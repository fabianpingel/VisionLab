/**
 * ============================================================================
 * BoxOverlay.tsx — Canvas-Overlay über dem Kamerabild für Bounding Boxes
 * ============================================================================
 *
 * Diese Komponente liegt als transparentes <canvas> ÜBER dem <video>-Element
 * und zeichnet die Detektions-Boxen + deutsche Labels.
 *
 * --- Wie funktioniert ein Canvas-Overlay? ---
 *
 * - <canvas> wird mit `position: absolute; inset: 0` über das Video gelegt.
 * - `pointer-events: none` sorgt dafür, dass Touch-Events das Canvas
 *   ignorieren und am Video/Switch-Button landen.
 * - Beim Resize des Containers (Orientation-Change, Window-Resize) muss das
 *   Canvas-Pixel-Backing neu dimensioniert werden — sonst wird das Bild
 *   unscharf gestreckt.
 *
 * --- High-DPI-Displays ("Retina") ---
 *
 * Auf Retina-Displays haben 1 CSS-Pixel = z.B. 2 echte Pixel. Damit Linien
 * scharf bleiben, setzen wir:
 *   canvas.width  = cssWidth  * devicePixelRatio
 *   canvas.height = cssHeight * devicePixelRatio
 * und transformieren den Zeichen-Kontext entsprechend.
 */

import { useEffect, useRef } from 'react';
import {
  transformBoxToDisplay,
  classIdToColor,
  classIdToLabelBackground,
} from '@/lib/canvas';
import { translateClassName } from '@/models/cocoLabelsDe';
import type { Detection } from '@/inference/types';

/**
 * Props der BoxOverlay-Komponente.
 */
type BoxOverlayProps = {
  /** Referenz auf das <video>-Element (für Größen-Abfrage). */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Aktuelle Detektionen, die gezeichnet werden sollen. */
  detections: Detection[];
  /** True, wenn das Video gespiegelt angezeigt wird (Frontkamera). */
  mirror: boolean;
};

/** Strichstärke der Bounding-Box-Linien in CSS-Pixeln. */
const BOX_LINE_WIDTH = 2.5;

/** Schriftgröße des Labels in CSS-Pixeln. */
const LABEL_FONT_SIZE = 13;

/** Innenabstand des Label-Hintergrunds in CSS-Pixeln. */
const LABEL_PADDING = 6;

/**
 * Canvas-Overlay-Komponente.
 *
 * @param props Siehe BoxOverlayProps.
 * @returns Transparentes Canvas-Element, das absolut positioniert wird.
 */
export function BoxOverlay({ videoRef, detections, mirror }: BoxOverlayProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Synchronisiert die Canvas-Pixel-Größe mit der Video-CSS-Größe.
   * Wird beim Mount + bei jeder Größenänderung aufgerufen.
   */
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    /**
     * Liest die aktuelle CSS-Größe des Videos und setzt das Canvas
     * entsprechend (Backing-Buffer + CSS-Größe getrennt für Retina).
     */
    const resize = (): void => {
      const rect = video.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Pixel-Backing-Buffer (höher aufgelöst auf Retina)
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      // CSS-Größe (wie das <canvas> auf der Seite erscheint)
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    // Erstmal initial sizen
    resize();

    // ResizeObserver feuert bei jeder Größenänderung des Videos —
    // z.B. bei Orientation-Change am Smartphone.
    const observer = new ResizeObserver(resize);
    observer.observe(video);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [videoRef]);

  /**
   * Zeichnet die Detektionen ins Canvas.
   * Läuft bei JEDER neuen Detection-Liste — also typischerweise 20-60×/s.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Komplettes Canvas leeren — wichtig, sonst bleiben alte Boxen stehen.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Wenn das Video noch nicht initialisiert ist (videoWidth=0), nichts zeichnen.
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // High-DPI-Skalierung: Wir zeichnen in CSS-Pixeln, multipliziert mit DPR.
    // Statt jede Koordinate einzeln zu multiplizieren, transformieren wir
    // einmalig den Kontext und arbeiten dann mit CSS-Pixel-Werten.
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);

    // CSS-Größen (das, was wir als Koordinaten-System nutzen)
    const cssW = canvas.width / dpr;
    const cssH = canvas.height / dpr;

    // Schriftart einmalig setzen
    ctx.font = `600 ${LABEL_FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textBaseline = 'top';

    // Jede Detection einzeln zeichnen
    for (const det of detections) {
      // Box-Koordinaten ins Display-System überführen
      const box = transformBoxToDisplay(
        det.x,
        det.y,
        det.width,
        det.height,
        video.videoWidth,
        video.videoHeight,
        cssW,
        cssH,
        mirror,
      );

      // Bounding-Box-Rahmen zeichnen
      const strokeColor = classIdToColor(det.classId, 1);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = BOX_LINE_WIDTH;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      // Label-Text bauen: deutscher Klassenname + Konfidenz in Prozent
      const labelText = `${translateClassName(det.classId, det.className)} ${Math.round(
        det.score * 100,
      )}%`;

      // Label-Hintergrund: gefülltes Rechteck oben links der Box,
      // damit der Text auf jedem Bildhintergrund lesbar bleibt.
      const textMetrics = ctx.measureText(labelText);
      const labelWidth = textMetrics.width + LABEL_PADDING * 2;
      const labelHeight = LABEL_FONT_SIZE + LABEL_PADDING * 2;

      // Wenn die Box ganz oben liegt, Label INSIDE the box rendern,
      // sonst direkt oberhalb der Box.
      const labelY = box.y >= labelHeight ? box.y - labelHeight : box.y;

      ctx.fillStyle = classIdToLabelBackground(det.classId);
      ctx.fillRect(box.x, labelY, labelWidth, labelHeight);

      // Label-Text selbst
      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, box.x + LABEL_PADDING, labelY + LABEL_PADDING);
    }

    // Kontext-Transformation zurücksetzen
    ctx.restore();
  }, [detections, mirror, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      // pointer-events-none → Klicks/Touches gehen am Canvas vorbei zur
      // darunter liegenden Schicht (Video, Buttons).
      className="absolute inset-0 w-full h-full pointer-events-none"
      // ARIA: das Canvas ist rein dekorativ, Screenreader sollen es ignorieren.
      role="presentation"
      aria-hidden="true"
    />
  );
}
