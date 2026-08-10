"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import { toast } from "sonner";
import {
  Camera,
  CircleDot,
  FlipHorizontal,
  GraduationCap,
  Loader2,
  Lock,
  PersonStanding,
  Square,
  Video,
  Volume2,
  VolumeX,
  VideoOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { DetectionPanel } from "@/components/detection-panel";
import { TourOverlay } from "@/components/tour/tour-overlay";
import { TOUR_STEPS, TOUR_STORAGE_KEY, type TourSignals } from "@/components/tour/steps";
import { drawOnCanvas } from "./utils/draw";
import { useObjectDetection } from "@/lib/use-object-detection";
import { useRecorder } from "@/lib/use-recorder";
import { classLabel, HANDY_CLASSES } from "@/lib/coco-classes";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Margen antes de cortar la grabación automática: evita frenar por un parpadeo del modelo. */
const PERSON_GRACE_MS = 2500;

type CameraState = "requesting" | "ready" | "denied" | "missing";

export default function HomePage() {
  const { t, locale } = useI18n();

  const webcamRef = useRef<Webcam>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraState, setCameraState] = useState<CameraState>("requesting");
  /**
   * Cambiar esta clave vuelve a montar el <Webcam>, que es lo que dispara una
   * nueva petición de permiso. Recargar la página también funcionaría, pero se
   * lleva puesto el idioma elegido y el punto del tutorial donde iba el usuario.
   */
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [mirrored, setMirrored] = useState(true);
  const [autoRecord, setAutoRecord] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [seenObject, setSeenObject] = useState<string | null>(null);

  const cameraReady = cameraState === "ready";
  const { status: modelStatus, detections, fps } = useObjectDetection(videoRef, cameraReady);

  const recorder = useRecorder(videoRef, {
    onSaved: () => toast.success(t("toast.recordSaved")),
    onError: () => toast.error(t("toast.recordFailed")),
  });

  /* ------------------------------------------------------------- tutorial -- */

  useEffect(() => {
    if (window.localStorage.getItem(TOUR_STORAGE_KEY) !== "1") setShowWelcome(true);
  }, []);

  const finishTour = useCallback(() => {
    setTourOpen(false);
    setShowWelcome(false);
    window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
  }, []);

  const startTour = useCallback(() => {
    setShowWelcome(false);
    setTourStep(0);
    setPhotoTaken(false);
    setTourOpen(true);
  }, []);

  /* ------------------------------------------------------------ detección -- */

  const personPresent = useMemo(
    // El error original era asignar dentro de un forEach, con lo cual solo
    // contaba la última predicción: bastaba una taza después de la persona
    // para que la grabación automática nunca arrancara.
    () => detections.some((d) => d.class === "person"),
    [detections],
  );

  /**
   * Mientras la grabación automática está a cargo, el botón manual no debe
   * responder: al pulsarlo la grabación se detenía y el propio efecto la
   * reanudaba de inmediato, porque la persona seguía en cuadro. Los dos
   * controles peleaban por el mismo estado. La salida sigue estando: apagar el
   * modo automático corta la grabación.
   */
  const autoDriving = autoRecord && recorder.isRecording;

  const firstObject = useMemo(
    () => detections.find((d) => d.class !== "person") ?? null,
    [detections],
  );

  // Recordamos el primer objeto que no sea una persona para el paso interactivo
  // del tutorial: sirve aunque el usuario ya lo haya sacado de cuadro.
  useEffect(() => {
    if (firstObject) setSeenObject(firstObject.class);
  }, [firstObject]);

  // Pintado de las cajas.
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.videoWidth) return;

    if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
    if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

    drawOnCanvas(detections, canvas.getContext("2d"), {
      mirrored,
      locale,
      highlighted: tourOpen && TOUR_STEPS[tourStep]?.id === "show" ? seenObject : null,
    });
  }, [detections, mirrored, locale, tourOpen, tourStep, seenObject]);

  /* --------------------------------------------------- grabación automática -- */

  const graceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beep = useCallback(() => {
    if (!soundOn) return;
    try {
      // Un tono corto generado al vuelo: evita cargar un archivo de audio solo
      // para avisar que arrancó una grabación.
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.25);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.26);
      oscillator.onended = () => context.close();
    } catch {
      // Si el navegador bloquea el audio por falta de interacción, no pasa nada.
    }
  }, [soundOn]);

  useEffect(() => {
    if (!autoRecord || !cameraReady) return;

    if (personPresent) {
      if (graceRef.current) {
        clearTimeout(graceRef.current);
        graceRef.current = null;
      }
      if (!recorder.isRecording && recorder.start()) {
        toast.info(t("toast.autoStarted"));
        beep();
      }
      return;
    }

    // Nadie en cuadro: esperamos el margen antes de cerrar, porque el modelo
    // pierde la detección por un cuadro con bastante frecuencia.
    if (recorder.isRecording && !graceRef.current) {
      graceRef.current = setTimeout(() => {
        graceRef.current = null;
        recorder.stop();
        toast.info(t("toast.autoStopped"));
      }, PERSON_GRACE_MS);
    }
  }, [autoRecord, cameraReady, personPresent, recorder, beep, t]);

  useEffect(
    () => () => {
      if (graceRef.current) clearTimeout(graceRef.current);
    },
    [],
  );

  /* -------------------------------------------------------------- acciones -- */

  function takePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      toast.error(t("toast.cameraMissing"));
      return;
    }

    // Componemos imagen y cajas en un lienzo aparte: `getScreenshot()` devuelve
    // solo el cuadro crudo, sin las marcas de detección que el usuario ve.
    const composed = document.createElement("canvas");
    composed.width = video.videoWidth;
    composed.height = video.videoHeight;
    const ctx = composed.getContext("2d");
    if (!ctx) return;

    if (mirrored) {
      ctx.translate(composed.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, composed.width, composed.height);
    if (mirrored) ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (canvasRef.current) ctx.drawImage(canvasRef.current, 0, 0);

    composed.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `intelliman_${Date.now()}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(t("toast.photoSaved"));
      setPhotoTaken(true);
    }, "image/png");
  }

  function toggleAutoRecord() {
    setAutoRecord((previous) => {
      const next = !previous;
      toast.info(next ? t("controls.autoRecordOn") : t("controls.autoRecordOff"));
      if (!next && recorder.isRecording) recorder.stop();
      return next;
    });
  }

  /* ----------------------------------------------------------------- señales -- */

  const signals: TourSignals = {
    cameraReady,
    modelReady: modelStatus === "ready",
    objectSeen: seenObject !== null,
    lastObjectLabel: seenObject ? classLabel(seenObject, locale) : null,
    photoTaken,
    autoRecordEnabled: autoRecord,
  };

  const examples = useMemo(() => {
    const picks = HANDY_CLASSES.slice(0, 24)
      .filter((_, index) => index % 6 === 0)
      .slice(0, 3)
      .map((c) => (locale === "es" ? c.es : c.en));
    return picks.join(", ");
  }, [locale]);

  const busy = modelStatus === "loading" || cameraState === "requesting";

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      {/* Encabezado */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
            <CircleDot className="size-4" />
          </span>
          <div>
            <h1 className="text-sm font-semibold leading-none tracking-tight">
              {t("app.name")}
            </h1>
            <p className="mt-1 text-[0.7rem] leading-none text-muted-foreground">
              {t("app.tagline")}
            </p>
          </div>
        </div>

        <div data-tour="extras" className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={startTour}
            className="gap-1.5 text-xs"
          >
            <GraduationCap className="size-3.5" />
            <span className="hidden sm:inline">{t("nav.tutorial")}</span>
          </Button>
          <LanguageToggle />
          <ModeToggle />
        </div>
      </header>

      {/* Cuerpo */}
      <main className="grid min-h-0 flex-1 gap-4 p-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        {/* Escenario de cámara */}
        <section
          data-tour="camera"
          className="relative min-h-[18rem] overflow-hidden rounded-2xl border border-border bg-zinc-950"
        >
          <Webcam
            key={cameraAttempt}
            ref={webcamRef}
            audio={false}
            mirrored={mirrored}
            screenshotFormat="image/png"
            className="h-full w-full object-contain"
            onUserMedia={() => {
              videoRef.current = webcamRef.current?.video ?? null;
              setCameraState("ready");
            }}
            onUserMediaError={(error) => {
              const name = typeof error === "string" ? error : error?.name;
              setCameraState(
                name === "NotFoundError" || name === "DevicesNotFoundError"
                  ? "missing"
                  : "denied",
              );
            }}
          />
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          />

          {/* Estados que tapan la cámara */}
          {(busy || cameraState === "denied" || cameraState === "missing") && (
            <div className="absolute inset-0 grid place-items-center bg-zinc-950/92 px-6 text-center">
              {cameraState === "denied" || cameraState === "missing" ? (
                <div className="max-w-sm">
                  <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-zinc-800 text-amber-400">
                    <VideoOff className="size-5" />
                  </span>
                  <p className="text-sm font-semibold text-zinc-100">
                    {cameraState === "denied"
                      ? t("camera.deniedTitle")
                      : t("camera.noneTitle")}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                    {cameraState === "denied"
                      ? t("camera.deniedBody")
                      : t("camera.noneBody")}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setCameraState("requesting");
                      setCameraAttempt((n) => n + 1);
                    }}
                  >
                    {t("camera.retry")}
                  </Button>
                </div>
              ) : (
                <div className="max-w-xs">
                  <Loader2 className="mx-auto size-6 animate-spin text-indigo-400" />
                  <p className="mt-4 text-sm font-medium text-zinc-100">
                    {modelStatus === "loading"
                      ? t("camera.loadingModel")
                      : t("camera.requesting")}
                  </p>
                  {modelStatus === "loading" && (
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                      {t("camera.loadingHint")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Indicador de grabación */}
          {recorder.isRecording && (
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
              <span className="size-2 animate-pulse rounded-full bg-white" />
              {t("status.recording")}
              <span className="tabular-nums opacity-80">
                {Math.floor(recorder.elapsedMs / 1000)}s
              </span>
              {autoDriving && (
                <span className="border-l border-white/30 pl-2 text-[0.68rem] font-normal opacity-90">
                  {t("status.autoDriving")}
                </span>
              )}
            </div>
          )}

          {autoRecord && !recorder.isRecording && cameraReady && (
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-zinc-900/85 px-3 py-1.5 text-xs font-medium text-zinc-200 ring-1 ring-white/10">
              <PersonStanding className="size-3.5" />
              {t("status.autoWaiting")}
            </div>
          )}

          {/* Barra de controles */}
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/85 p-2 shadow-xl backdrop-blur">
              <ControlButton
                label={t("controls.mirror")}
                onClick={() => setMirrored((p) => !p)}
                active={mirrored}
              >
                <FlipHorizontal className="size-4" />
              </ControlButton>

              <span className="mx-0.5 h-6 w-px bg-white/10" />

              <ControlButton
                label={t("controls.photo")}
                onClick={takePhoto}
                disabled={!cameraReady}
                tour="photo"
              >
                <Camera className="size-4" />
              </ControlButton>

              <ControlButton
                label={
                  autoDriving
                    ? t("controls.recordLocked")
                    : recorder.isRecording
                      ? t("controls.recordStop")
                      : t("controls.record")
                }
                onClick={() => recorder.toggle()}
                disabled={!cameraReady || autoDriving}
                danger={recorder.isRecording}
                tour="record"
              >
                {recorder.isRecording ? (
                  <Square className="size-4 fill-current" />
                ) : (
                  <Video className="size-4" />
                )}
              </ControlButton>

              <ControlButton
                label={t("controls.autoRecord")}
                onClick={toggleAutoRecord}
                disabled={!cameraReady}
                active={autoRecord}
                tour="auto"
              >
                <PersonStanding className="size-4" />
              </ControlButton>

              <span className="mx-0.5 h-6 w-px bg-white/10" />

              <ControlButton
                label={t("controls.sound")}
                onClick={() => setSoundOn((p) => !p)}
                active={soundOn}
              >
                {soundOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </ControlButton>
            </div>
          </div>
        </section>

        {/* Panel lateral */}
        <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto lg:pr-1">
          <DetectionPanel
            detections={detections}
            fps={fps}
            highlighted={tourOpen && TOUR_STEPS[tourStep]?.id === "show" ? seenObject : null}
          />

          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-xs font-semibold">
              <Lock className="size-3.5 text-emerald-500" />
              {t("privacy.title")}
            </p>
            <p className="mt-1.5 text-[0.7rem] leading-relaxed text-muted-foreground">
              {t("privacy.body")}
            </p>
          </div>

          <p className="px-1 text-[0.65rem] text-muted-foreground">
            {t("footer.builtWith")}
          </p>
        </aside>
      </main>

      {/* Bienvenida */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
              <GraduationCap className="size-5" />
            </span>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">
              {t("tour.welcome.title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("tour.welcome.body")}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={startTour} className="w-full">
                {t("tour.welcome.cta")}
              </Button>
              <Button variant="ghost" onClick={finishTour} className="w-full text-xs">
                {t("tour.welcome.skip")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <TourOverlay
        open={tourOpen}
        stepIndex={tourStep}
        signals={signals}
        examples={examples}
        onNext={() =>
          tourStep === TOUR_STEPS.length - 1
            ? finishTour()
            : setTourStep((s) => s + 1)
        }
        onBack={() => setTourStep((s) => Math.max(0, s - 1))}
        onClose={finishTour}
      />
    </div>
  );
}

function ControlButton({
  children,
  label,
  onClick,
  disabled,
  active,
  danger,
  tour,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
  tour?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-tour={tour}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid size-10 place-items-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-40",
        danger
          ? "bg-red-600 text-white hover:brightness-110"
          : active
            ? "bg-indigo-500 text-white hover:brightness-110"
            : "text-zinc-300 hover:bg-white/10 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
