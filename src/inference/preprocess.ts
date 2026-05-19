/**
 * ============================================================================
 * preprocess.ts — Frame-Preprocessing für YOLO-Inferenz
 * ============================================================================
 *
 * Aufgabe:
 *   1. Frame aus dem <video>-Element auf 640×640 letterboxen (Aspekt-Ratio
 *      erhalten, Ränder grau auffüllen).
 *   2. Pixel-Daten (RGBA, 0..255) in das Modell-Format überführen:
 *      - RGB-Kanäle extrahieren (Alpha wegwerfen)
 *      - Pixelwerte auf 0..1 normalisieren
 *      - Anordnung von NHWC (Browser-Standard) zu NCHW (YOLO-Standard)
 *
 * Warum dieses ganze Hin und Her?
 *   - Browser liefern Pixel im NHWC-Format (Height × Width × Channels).
 *   - YOLO-Modelle erwarten NCHW (Channels × Height × Width), planar.
 *   - "Planar" heißt: erst alle R-Werte, dann alle G-Werte, dann alle B-Werte
 *     (statt RGBRGBRGB für jedes Pixel).
 *
 * Performance-Tipp:
 *   Wir nutzen OffscreenCanvas, damit das Resize auf der GPU stattfindet
 *   (`drawImage` ist GPU-beschleunigt). Erst beim `getImageData()` wandern
 *   die Pixel zurück in den CPU-RAM für die Pixel-Schleife.
 */

import type { LetterboxParams } from './types';

/**
 * Ergebnis des Preprocessings: alles, was der Worker für die Inferenz braucht.
 */
export type PreprocessedFrame = {
  /** Pixel-Daten als planar RGB (Float32Array, Werte 0..1). */
  input: Float32Array;
  /** Originale Frame-Maße (für Box-Rück-Skalierung). */
  originalWidth: number;
  originalHeight: number;
  /** Letterbox-Parameter (Pad + Scale). */
  letterbox: LetterboxParams;
};

/**
 * Berechnet die Letterbox-Parameter für einen gegebenen Frame.
 *
 * Letterbox-Logik:
 *   1. Wir finden den Skalierungsfaktor, der die längere Seite des Frames
 *      auf die Modell-Eingabegröße bringt.
 *   2. Die kürzere Seite wird proportional verkleinert.
 *   3. Die Ränder (vertical oder horizontal, je nach Bildformat) werden
 *      symmetrisch mit grauen Pixeln aufgefüllt.
 *
 * @param origWidth Originale Frame-Breite in Pixeln.
 * @param origHeight Originale Frame-Höhe in Pixeln.
 * @param modelSize Quadratische Eingabegröße des Modells (z.B. 640).
 * @returns Skalierungsfaktor und Padding-Werte.
 *
 * @example
 *   // Frame 1920×1080, Modell 640:
 *   //   scale = 640 / 1920 = 0.333
 *   //   neue Maße: 640×360 (statt 360×640)
 *   //   padY = (640 - 360) / 2 = 140 (oben und unten je 140 grau)
 *   //   padX = 0
 */
export function computeLetterboxParams(
  origWidth: number,
  origHeight: number,
  modelSize: number,
): LetterboxParams {
  // Skalierungsfaktor: längere Seite passt genau in modelSize.
  const scale = modelSize / Math.max(origWidth, origHeight);

  // Neue Maße nach Skalierung
  const scaledW = origWidth * scale;
  const scaledH = origHeight * scale;

  // Padding: jeweils symmetrisch links/rechts bzw. oben/unten.
  // Wir geben das Padding auf der LINKEN/OBEREN Seite zurück;
  // die rechte/untere Seite ergibt sich aus modelSize - (scaledW + padX).
  const padX = (modelSize - scaledW) / 2;
  const padY = (modelSize - scaledH) / 2;

  return { scale, padX, padY };
}

/**
 * Wandelt RGBA-Pixeldaten (von canvas.getImageData()) in das planare
 * RGB-Float32-Format um, das YOLO erwartet.
 *
 * @param rgba Pixeldaten im Format [R, G, B, A, R, G, B, A, ...] (0..255).
 * @param width Breite des Frames in Pixeln (= modelSize).
 * @param height Höhe des Frames in Pixeln (= modelSize).
 * @returns Float32Array der Länge 3*width*height mit Werten 0..1.
 *
 * Speicherlayout der Rückgabe (NCHW, planar):
 *   [r_0, r_1, ..., r_n,  g_0, g_1, ..., g_n,  b_0, b_1, ..., b_n]
 */
export function rgbaToFloat32Planar(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): Float32Array {
  const pixelCount = width * height;
  // Output hat 3 Kanäle (RGB), kein Alpha. Größe = 3 * w * h.
  const out = new Float32Array(pixelCount * 3);

  // Wir iterieren einmal über alle Pixel und schreiben in die richtigen
  // Plätze der drei Kanal-Sektionen. Eine Schleife statt drei → schneller
  // (besser für CPU-Cache).
  for (let i = 0; i < pixelCount; i++) {
    const rgbaIdx = i * 4; // 4 = RGBA-Stride
    // Normalisierung: 0..255 → 0..1
    out[i] = rgba[rgbaIdx] / 255; // R-Kanal an Position i
    out[pixelCount + i] = rgba[rgbaIdx + 1] / 255; // G-Kanal an Position pixelCount+i
    out[2 * pixelCount + i] = rgba[rgbaIdx + 2] / 255; // B-Kanal an Position 2*pixelCount+i
    // rgba[rgbaIdx + 3] = Alpha — wird ignoriert.
  }

  return out;
}

/**
 * Komplettes Preprocessing eines Video-Frames.
 *
 * Nutzt einen wiederverwendbaren OffscreenCanvas, um Allokationen zu sparen
 * (das Canvas wird einmal pro Komponentenleben angelegt und immer wieder
 * neu bezeichnet).
 *
 * @param source Quelle des Frames — typischerweise ein HTMLVideoElement.
 * @param canvas Wiederverwendbares OffscreenCanvas (Größe = modelSize).
 * @param modelSize Quadratische Eingabegröße des Modells.
 * @returns Preprocessing-Ergebnis (Float32Array + Letterbox-Params).
 */
export function preprocessFrame(
  source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  canvas: OffscreenCanvas,
  modelSize: number,
): PreprocessedFrame {
  // Originale Maße ermitteln. videoWidth/videoHeight liefert die echte
  // Stream-Auflösung (nicht die CSS-Display-Größe).
  const origWidth =
    source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  const origHeight =
    source instanceof HTMLVideoElement ? source.videoHeight : source.height;

  // Letterbox-Parameter berechnen
  const letterbox = computeLetterboxParams(origWidth, origHeight, modelSize);

  // Canvas-Kontext holen — willHTML willReadFrequently fragen wir an,
  // damit getImageData() optimiert wird (mehrfach pro Sekunde).
  const ctx = canvas.getContext('2d', {
    willReadFrequently: true,
  }) as OffscreenCanvasRenderingContext2D | null;

  if (!ctx) {
    throw new Error('OffscreenCanvas 2D-Kontext konnte nicht erstellt werden.');
  }

  // Zuerst das gesamte Canvas grau füllen (Letterbox-Hintergrund).
  // YOLO erwartet typischerweise (114, 114, 114) als Pad-Farbe.
  ctx.fillStyle = 'rgb(114, 114, 114)';
  ctx.fillRect(0, 0, modelSize, modelSize);

  // Frame ins Canvas zeichnen — verkleinert und mittig positioniert.
  // drawImage ist GPU-beschleunigt im Browser.
  ctx.drawImage(
    source,
    letterbox.padX,
    letterbox.padY,
    origWidth * letterbox.scale,
    origHeight * letterbox.scale,
  );

  // Pixel-Daten zurück in den CPU-RAM holen.
  const imageData = ctx.getImageData(0, 0, modelSize, modelSize);

  // RGBA (0..255) → planar RGB (0..1)
  const input = rgbaToFloat32Planar(imageData.data, modelSize, modelSize);

  return {
    input,
    originalWidth: origWidth,
    originalHeight: origHeight,
    letterbox,
  };
}
