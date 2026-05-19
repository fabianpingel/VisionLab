/**
 * ============================================================================
 * canvas.ts — Hilfsfunktionen für das Canvas-Overlay
 * ============================================================================
 *
 * Reine Mathematik- und Style-Helpers — keine React- oder DOM-Abhängigkeiten.
 * So sind sie isoliert testbar.
 *
 * Was wird hier behandelt?
 *   1. Koordinaten-Transformation: Original-Video-Pixel → Canvas-Display-Pixel
 *   2. Klassen-Farben (stable, schön verteilt im HSL-Raum)
 *   3. Letterbox-/Object-cover-Mathematik für korrekte Box-Position
 */

/**
 * Bounding-Box im Display-Koordinatensystem.
 */
export type DisplayBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Transformiert eine Detection-Box aus Original-Video-Koordinaten ins
 * Canvas-Display-Koordinatensystem.
 *
 * Hintergrund:
 *   Das <video>-Element wird mit `object-cover` skaliert — es füllt den
 *   Container vollständig aus und wird ggf. an einer Achse gecroppt.
 *   Die Detections kommen aber im Original-Video-Pixelraum.
 *
 *   Wir berechnen:
 *     1. Wie wird das Video skaliert? (cover-Faktor)
 *     2. Wie viel wird gecroppt? (Offset)
 *     3. Wo liegt die Box im Display?
 *
 * Für Frontkamera muss zusätzlich horizontal gespiegelt werden, weil das
 * <video> per CSS `scale-x-[-1]` umgedreht wird.
 *
 * @param srcX Box-X im Original-Video.
 * @param srcY Box-Y im Original-Video.
 * @param srcW Box-Breite im Original-Video.
 * @param srcH Box-Höhe im Original-Video.
 * @param videoW Original-Video-Breite (videoWidth).
 * @param videoH Original-Video-Höhe (videoHeight).
 * @param canvasW Canvas-Breite (Display-Pixel).
 * @param canvasH Canvas-Höhe (Display-Pixel).
 * @param mirror True wenn Front-Kamera (Video ist horizontal gespiegelt).
 * @returns Box im Display-Koordinatensystem.
 */
export function transformBoxToDisplay(
  srcX: number,
  srcY: number,
  srcW: number,
  srcH: number,
  videoW: number,
  videoH: number,
  canvasW: number,
  canvasH: number,
  mirror: boolean,
): DisplayBox {
  // Aspect-Ratios vergleichen, um zu wissen, welche Achse das Video voll
  // ausfüllt (= scaling-driving axis) und welche gecroppt wird.
  const videoAspect = videoW / videoH;
  const canvasAspect = canvasW / canvasH;

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  if (videoAspect > canvasAspect) {
    // Video ist breiter als Container → vertikal füllen, horizontal croppen.
    // Skalierungs-Faktor ergibt sich aus der Höhe.
    scale = canvasH / videoH;
    // Wieviel Pixel werden links/rechts abgeschnitten (gleich verteilt)?
    offsetX = (videoW * scale - canvasW) / 2;
  } else {
    // Video ist schmaler (oder gleich) → horizontal füllen, vertikal croppen.
    scale = canvasW / videoW;
    offsetY = (videoH * scale - canvasH) / 2;
  }

  // Skalierte Koordinaten im Canvas-Raum, abzüglich Crop-Offset.
  let displayX = srcX * scale - offsetX;
  const displayY = srcY * scale - offsetY;
  const displayW = srcW * scale;
  const displayH = srcH * scale;

  // Front-Kamera ist gespiegelt → Box-X wird an der vertikalen Mitte gespiegelt.
  if (mirror) {
    displayX = canvasW - displayX - displayW;
  }

  return { x: displayX, y: displayY, width: displayW, height: displayH };
}

/**
 * Erzeugt eine stabile, gut unterscheidbare Farbe für eine Klassen-ID.
 *
 * Verwendet den "Goldenen Winkel" (≈137.5°) für die Hue-Verteilung —
 * das ist eine bekannte Technik, um N Farben gleichmäßig im Farbkreis
 * zu verteilen, ohne dass benachbarte IDs ähnliche Farben bekommen.
 *
 * @param classId Numerische Klassen-ID.
 * @param alpha Transparenz (0..1). Default 1.
 * @returns CSS-kompatibler hsla()-Farbstring.
 */
export function classIdToColor(classId: number, alpha: number = 1): string {
  // 137.5° = Goldener Winkel → gleichmäßige Verteilung über die Hue-Skala.
  const hue = (classId * 137.5) % 360;
  return `hsla(${hue.toFixed(0)}, 75%, 60%, ${alpha})`;
}

/**
 * Erzeugt einen kontrastreichen Text-Hintergrund (dunklere Variante derselben Farbe).
 *
 * Wird hinter den Label-Text gemalt, damit er auf jedem Bildhintergrund lesbar bleibt.
 *
 * @param classId Numerische Klassen-ID (gleich wie bei classIdToColor).
 * @returns CSS-kompatibler hsla()-Farbstring.
 */
export function classIdToLabelBackground(classId: number): string {
  const hue = (classId * 137.5) % 360;
  // Niedrigere Lightness → dunkler als die Box-Farbe, gut für Kontrast.
  return `hsla(${hue.toFixed(0)}, 75%, 30%, 0.92)`;
}
