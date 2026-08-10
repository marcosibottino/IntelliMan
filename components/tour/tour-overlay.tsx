"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { TOUR_STEPS, type TourSignals } from "./steps";

type Rect = { top: number; left: number; width: number; height: number };

const TOOLTIP_WIDTH = 360;
const GAP = 14;

function readRect(target: string, padding: number): Rect | null {
  const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!element) return null;
  const r = element.getBoundingClientRect();
  return {
    top: r.top - padding,
    left: r.left - padding,
    width: r.width + padding * 2,
    height: r.height + padding * 2,
  };
}

export function TourOverlay({
  open,
  stepIndex,
  signals,
  examples,
  onNext,
  onBack,
  onClose,
}: {
  open: boolean;
  stepIndex: number;
  signals: TourSignals;
  /** Sugerencias de objetos, ya traducidas, para el paso interactivo. */
  examples: string;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [rect, setRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipHeight, setTooltipHeight] = useState(240);

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const satisfied = step?.waitFor ? step.waitFor(signals) : true;

  // El recorte se recalcula en cada cuadro mientras el tutorial está abierto:
  // el panel de detecciones cambia de alto solo, y con una medición única el
  // foco quedaría desalineado apenas aparece un objeto.
  useLayoutEffect(() => {
    if (!open || !step) return;

    let frame = 0;
    const measure = () => {
      setRect(step.target ? readRect(step.target, step.padding ?? 8) : null);
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [open, step]);

  useLayoutEffect(() => {
    if (!open) return;
    const node = tooltipRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setTooltipHeight(node.offsetHeight));
    observer.observe(node);
    setTooltipHeight(node.offsetHeight);
    return () => observer.disconnect();
  }, [open, stepIndex]);

  // Escape cierra; las flechas navegan.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && satisfied) onNext();
      if (event.key === "ArrowLeft" && stepIndex > 0) onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, satisfied, stepIndex, onNext, onBack, onClose]);

  if (!open || !step) return null;

  // Colocación del globo: debajo del recorte si entra, si no arriba, y si el
  // recorte ocupa casi toda la pantalla, centrado abajo.
  let tooltipStyle: React.CSSProperties;
  if (!rect) {
    tooltipStyle = {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: TOOLTIP_WIDTH,
    };
  } else {
    const left = Math.min(
      Math.max(GAP, rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2),
      window.innerWidth - TOOLTIP_WIDTH - GAP,
    );

    const spaceBelow = window.innerHeight - (rect.top + rect.height) - GAP;
    const spaceAbove = rect.top - GAP;

    // Un objetivo que ocupa casi toda la pantalla —la cámara— no deja lugar ni
    // arriba ni abajo. En ese caso el globo se apoya sobre el propio objetivo en
    // vez de salirse del viewport, que es lo que hacía antes.
    let top: number;
    if (spaceBelow >= tooltipHeight) top = rect.top + rect.height + GAP;
    else if (spaceAbove >= tooltipHeight) top = rect.top - tooltipHeight - GAP;
    else top = window.innerHeight - tooltipHeight - GAP;

    tooltipStyle = {
      top: Math.max(GAP, top),
      left,
      width: TOOLTIP_WIDTH,
    };
  }

  const bodyVars =
    step.id === "show" ? { examples } : undefined;

  return (
    // `pointer-events-none` en el contenedor es lo que permite que el usuario
    // realmente use el control resaltado: sin esto, este div a pantalla completa
    // intercepta cada clic y los pasos interactivos son imposibles de completar.
    // El globo y el velo de los pasos centrados vuelven a habilitarlo.
    <div
      className="pointer-events-none fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={t(step.titleKey)}
    >
      {/* Oscurecido con recorte. El box-shadow gigante pinta todo menos el hueco,
          así el elemento resaltado sigue siendo visible y clicleable. */}
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-white/70"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px rgba(3, 7, 18, 0.78)",
          }}
        />
      ) : (
        <div className="pointer-events-auto absolute inset-0 bg-[rgba(3,7,18,0.78)]" onClick={onClose} />
      )}

      <div
        ref={tooltipRef}
        className="pointer-events-auto absolute rounded-2xl border border-white/10 bg-zinc-900 p-5 text-zinc-100 shadow-2xl"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-indigo-300">
            {t("tour.step", { current: stepIndex + 1, total: TOUR_STEPS.length })}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-lg p-1 text-zinc-400 transition hover:text-zinc-100"
            aria-label={t("tour.skip")}
          >
            <X className="size-4" />
          </button>
        </div>

        <h2 className="mt-2 text-lg font-semibold tracking-tight">{t(step.titleKey)}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          {t(step.bodyKey, bodyVars)}
        </p>

        {step.waitFor && (
          <div
            className={cn(
              "mt-4 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs",
              satisfied
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300",
            )}
          >
            {satisfied ? (
              <Check className="size-4 shrink-0" />
            ) : (
              <Loader2 className="size-4 shrink-0 animate-spin" />
            )}
            <span>
              {satisfied
                ? step.doneKey
                  ? t(step.doneKey, { label: signals.lastObjectLabel ?? "" })
                  : t("tour.done")
                : t(step.waitingKey ?? "tour.waiting")}
            </span>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((s, index) => (
              <span
                key={s.id}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === stepIndex
                    ? "w-5 bg-indigo-400"
                    : index < stepIndex
                      ? "w-1.5 bg-indigo-400/50"
                      : "w-1.5 bg-zinc-700",
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-zinc-300 transition hover:bg-white/5"
              >
                <ArrowLeft className="size-3.5" />
                {t("tour.back")}
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              disabled={!satisfied}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 text-xs font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLast ? t("tour.finish") : t("tour.next")}
              {!isLast && <ArrowRight className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
