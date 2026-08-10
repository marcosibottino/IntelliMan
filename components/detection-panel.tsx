"use client";

import { useMemo } from "react";
import type { DetectedObject } from "@tensorflow-models/coco-ssd";
import { Eye, ScanSearch } from "lucide-react";
import { classLabel, colorFor, TOTAL_CLASSES } from "@/lib/coco-classes";
import { useI18n } from "@/lib/i18n";

type Row = {
  key: string;
  label: string;
  color: string;
  /** Mejor certeza entre las instancias de esa clase. */
  score: number;
  count: number;
};

export function DetectionPanel({
  detections,
  fps,
  highlighted,
}: {
  detections: DetectedObject[];
  fps: number;
  highlighted?: string | null;
}) {
  const { t, locale } = useI18n();

  // Agrupamos por clase: tres personas en cuadro son una fila "persona ×3" y no
  // tres filas idénticas saltando de orden en cada pasada del modelo.
  const rows = useMemo<Row[]>(() => {
    const byClass = new Map<string, Row>();
    for (const detection of detections) {
      const existing = byClass.get(detection.class);
      if (existing) {
        existing.count += 1;
        existing.score = Math.max(existing.score, detection.score);
      } else {
        byClass.set(detection.class, {
          key: detection.class,
          label: classLabel(detection.class, locale),
          color: colorFor(detection.class, highlighted),
          score: detection.score,
          count: 1,
        });
      }
    }
    return Array.from(byClass.values()).sort((a, b) => b.score - a.score);
  }, [detections, locale, highlighted]);

  return (
    <section
      data-tour="detections"
      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-muted text-foreground/70">
            <Eye className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">{t("detect.title")}</h2>
            <p className="text-[0.68rem] text-muted-foreground">
              {t("detect.knows", { n: TOTAL_CLASSES })}
            </p>
          </div>
        </div>

        {fps > 0 && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[0.65rem] font-medium tabular-nums text-muted-foreground">
            {t("detect.fps", { n: fps })}
          </span>
        )}
      </header>

      <div className="min-h-[13rem] flex-1 p-3">
        {rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
              <ScanSearch className="size-5" />
            </span>
            <p className="text-sm font-medium">{t("detect.empty")}</p>
            <p className="max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
              {t("detect.emptyHint")}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {rows.map((row) => (
              <li
                key={row.key}
                className="rounded-xl border border-border/60 bg-background/40 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-[3px]"
                      style={{ background: row.color }}
                    />
                    <span className="truncate text-sm font-medium capitalize">
                      {row.label}
                    </span>
                    {row.count > 1 && (
                      <span className="shrink-0 rounded-full bg-muted px-1.5 text-[0.65rem] font-semibold text-muted-foreground">
                        ×{row.count}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums">
                    {Math.round(row.score * 100)}%
                  </span>
                </div>

                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                  role="meter"
                  aria-valuenow={Math.round(row.score * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${row.label}: ${Math.round(row.score * 100)}% ${t("detect.confidence")}`}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-200 ease-out"
                    style={{ width: `${row.score * 100}%`, background: row.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
