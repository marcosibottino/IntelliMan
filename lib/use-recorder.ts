"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Corte de seguridad: nadie quiere descubrir una grabación de dos horas. */
const MAX_DURATION_MS = 30_000;

/**
 * Formatos por orden de preferencia. Safari solo acepta mp4; Chrome y Firefox
 * prefieren webm. Sin este sondeo, `new MediaRecorder(stream)` elige un
 * contenedor que después el `<video>` puede no saber reproducir.
 */
const CANDIDATE_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return CANDIDATE_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`
  );
}

type Options = {
  onSaved?: () => void;
  onError?: (error: unknown) => void;
};

/**
 * Grabación del stream de la cámara.
 *
 * El error del que venía esta app era crear el MediaRecorder una sola vez al
 * montar, tomando `captureStream()` de un `<video>` que todavía no tenía
 * imagen: el grabador quedaba atado a un stream sin pistas y los archivos
 * salían vacíos. Acá el grabador se construye en el momento de grabar, contra
 * el `srcObject` real, y se descarta al terminar.
 */
export function useRecorder(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: Options = {},
) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<number>(0);

  // Los callbacks se guardan en refs para que cambiar de idioma —que recrea las
  // funciones de toast— no obligue a recrear las de arranque y parada.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!isRecording) {
      setElapsedMs(0);
      return;
    }
    const id = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 200);
    return () => clearInterval(id);
  }, [isRecording]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const start = useCallback(() => {
    if (recorderRef.current?.state === "recording") return false;

    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (!stream || stream.getVideoTracks().length === 0) {
      optionsRef.current.onError?.(new Error("sin stream de cámara"));
      return false;
    }

    try {
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        // El tipo del blob debe coincidir con el que grabó el recorder: con un
        // MIME inventado el archivo se descarga pero no lo abre ningún reproductor.
        const type = recorder.mimeType || mimeType || "video/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];

        if (blob.size === 0) {
          optionsRef.current.onError?.(new Error("grabación vacía"));
        } else {
          const extension = type.includes("mp4") ? "mp4" : "webm";
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `intelliman_${timestamp()}.${extension}`;
          link.click();
          // Sin revocar, cada grabación deja el blob entero retenido en memoria.
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          optionsRef.current.onSaved?.();
        }

        recorderRef.current = null;
        setIsRecording(false);
      };

      recorder.onerror = (event) => {
        optionsRef.current.onError?.(event);
        recorderRef.current = null;
        setIsRecording(false);
      };

      recorderRef.current = recorder;
      // Un chunk por segundo: si el navegador se cierra a mitad de grabación,
      // lo ya emitido sigue siendo recuperable.
      recorder.start(1000);
      startedAtRef.current = Date.now();
      setIsRecording(true);

      timeoutRef.current = setTimeout(stop, MAX_DURATION_MS);
      return true;
    } catch (error) {
      optionsRef.current.onError?.(error);
      return false;
    }
  }, [videoRef, stop]);

  const toggle = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      stop();
      return false;
    }
    return start();
  }, [start, stop]);

  // Al desmontar, cortamos: dejar un MediaRecorder vivo mantiene la cámara encendida.
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    },
    [],
  );

  return {
    isRecording,
    elapsedMs,
    maxDurationMs: MAX_DURATION_MS,
    start,
    stop,
    toggle,
  };
}
