"use client";

import { useEffect, useRef, useState } from "react";
import type { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd";

export type ModelStatus = "idle" | "loading" | "ready" | "error";

/** Por debajo de esto el modelo dispara falsos positivos constantemente. */
const MIN_SCORE = 0.55;

/**
 * Objetivo de análisis por segundo.
 *
 * El original corría cada 100 ms (10 por segundo) sin importar cuánto tardaba
 * la inferencia. Cuando una pasada tarda más que el intervalo, `setInterval`
 * encola la siguiente y el hilo principal se satura: la imagen se entrecorta.
 * Acá cada pasada agenda la próxima recién al terminar, así que el ritmo baja
 * solo en equipos lentos en vez de trabar la interfaz.
 */
const TARGET_FPS = 8;

export function useObjectDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
) {
  const [status, setStatus] = useState<ModelStatus>("idle");
  const [detections, setDetections] = useState<DetectedObject[]>([]);
  const [fps, setFps] = useState(0);

  const modelRef = useRef<ObjectDetection | null>(null);
  const runningRef = useRef(false);
  const frameTimesRef = useRef<number[]>([]);

  // Carga del modelo. Los backends de TensorFlow se importan de forma dinámica
  // para que no entren en el bundle inicial: son varios megas de WebAssembly y
  // WebGL que no hacen falta hasta que la página ya se pintó.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const [cocossd] = await Promise.all([
          import("@tensorflow-models/coco-ssd"),
          import("@tensorflow/tfjs-backend-webgl"),
          import("@tensorflow/tfjs-backend-cpu"),
        ]);
        const model = await cocossd.load({ base: "mobilenet_v2" });
        if (cancelled) {
          model.dispose();
          return;
        }
        modelRef.current = model;
        setStatus("ready");
      } catch (error) {
        console.error("[detección] no se pudo cargar el modelo:", error);
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
      modelRef.current?.dispose();
      modelRef.current = null;
    };
  }, []);

  // Bucle de inferencia.
  useEffect(() => {
    if (status !== "ready" || !enabled) {
      setDetections([]);
      setFps(0);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    const minInterval = 1000 / TARGET_FPS;

    async function tick() {
      if (stopped) return;
      const started = performance.now();
      const video = videoRef.current;
      const model = modelRef.current;

      // readyState 4 = HAVE_ENOUGH_DATA. Analizar antes devuelve siempre vacío.
      if (model && video && video.readyState === 4 && video.videoWidth > 0) {
        if (!runningRef.current) {
          runningRef.current = true;
          try {
            const found = await model.detect(video);
            if (!stopped) {
              setDetections(found.filter((d) => d.score >= MIN_SCORE));

              const times = frameTimesRef.current;
              times.push(performance.now());
              // Ventana de un segundo para el contador de ritmo.
              while (times.length > 0 && times[0] < performance.now() - 1000) {
                times.shift();
              }
              setFps(times.length);
            }
          } catch (error) {
            console.error("[detección] falló una pasada:", error);
          } finally {
            runningRef.current = false;
          }
        }
      }

      if (stopped) return;
      const spent = performance.now() - started;
      timer = setTimeout(tick, Math.max(0, minInterval - spent));
    }

    tick();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      frameTimesRef.current = [];
    };
  }, [status, enabled, videoRef]);

  return { status, detections, fps };
}
