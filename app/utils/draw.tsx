import type { DetectedObject } from "@tensorflow-models/coco-ssd";
import { classLabel, colorFor } from "@/lib/coco-classes";
import type { Locale } from "@/lib/i18n";

type Options = {
  mirrored: boolean;
  locale: Locale;
  /** Clase que el tutorial pidió mostrar; se pinta distinto cuando aparece. */
  highlighted?: string | null;
};

/**
 * Dibuja las cajas de detección sobre el lienzo superpuesto a la cámara.
 *
 * El recuadro va con borde y relleno muy tenue en lugar del relleno sólido
 * original: sobre imagen de cámara, un bloque translúcido tapa justo lo que el
 * usuario quiere mirar. La etiqueta lleva su propia pastilla opaca porque el
 * fondo es video y no se puede garantizar contraste contra él.
 */
export function drawOnCanvas(
  predictions: DetectedObject[],
  ctx: CanvasRenderingContext2D | null | undefined,
  { mirrored, locale, highlighted }: Options,
) {
  if (!ctx) return;

  const { width: canvasWidth, height: canvasHeight } = ctx.canvas;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const scale = Math.max(1, canvasWidth / 640);
  const fontSize = Math.round(13 * scale);
  const radius = 10 * scale;

  for (const prediction of predictions) {
    const [rawX, y, width, height] = prediction.bbox;
    // Con la imagen espejada el lienzo no se voltea, así que la coordenada X se
    // refleja a mano; el ancho se mantiene positivo para poder medir el texto.
    const x = mirrored ? canvasWidth - rawX - width : rawX;

    const color = colorFor(prediction.class, highlighted);
    const label = classLabel(prediction.class, locale);
    const percent = Math.round(prediction.score * 100);

    ctx.save();

    // Recuadro
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5 * scale;
    ctx.stroke();

    // Etiqueta
    ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    const text = `${label} · ${percent}%`;
    const paddingX = 8 * scale;
    const paddingY = 5 * scale;
    const textWidth = ctx.measureText(text).width;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = fontSize + paddingY * 2;

    // Si la caja toca el borde superior, la etiqueta baja hacia adentro.
    const labelY = y - boxHeight - 4 * scale < 0 ? y + 4 * scale : y - boxHeight - 4 * scale;
    const labelX = Math.min(Math.max(0, x), canvasWidth - boxWidth);

    ctx.beginPath();
    ctx.roundRect(labelX, labelY, boxWidth, boxHeight, 6 * scale);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(text, labelX + paddingX, labelY + boxHeight / 2);

    ctx.restore();
  }
}
