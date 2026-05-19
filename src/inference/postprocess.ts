/**
 * ============================================================================
 * postprocess.ts — Postprocessing der YOLO-Modell-Ausgabe
 * ============================================================================
 *
 * YOLO11-Output-Format (für 640×640 Eingabe, 80 Klassen):
 *   Shape: [1, 84, 8400]
 *     1     = Batch-Größe
 *     84    = 4 Box-Koordinaten + 80 Klassen-Scores
 *     8400  = Anzahl Detektions-Kandidaten (Grid-Zellen über drei Skalen)
 *
 * Die 84 Werte pro Kandidat aufgegliedert:
 *     Index 0-3:  cx, cy, w, h  (Center-Koordinaten im Modell-Pixelraum)
 *     Index 4-83: Score pro Klasse (NACH Sigmoid bereits — YOLO11 wendet
 *                 das Aktivieren während des Forward-Pass intern an)
 *
 * Pipeline:
 *   1. Iteriere alle 8400 Kandidaten.
 *   2. Finde den höchsten Klassen-Score pro Kandidat.
 *   3. Wirf Kandidaten unter dem Konfidenz-Threshold weg.
 *   4. Wandle Center→Corner-Koordinaten um.
 *   5. Skaliere Koordinaten zurück auf das Originalbild (Letterbox rückgängig).
 *   6. Non-Maximum-Suppression (NMS): überlappende Boxen derselben Klasse
 *      werden auf die mit dem höchsten Score reduziert.
 */

import type { Detection, LetterboxParams } from './types';

/**
 * Konfigurationsoptionen für das Postprocessing.
 */
export type PostprocessOptions = {
  /** Klassennamen (englisch), Index entspricht der Klassen-ID. */
  classNames: string[];
  /** Konfidenz-Schwelle: Kandidaten unter diesem Score werden verworfen. */
  scoreThreshold: number;
  /** IoU-Schwelle für NMS: Überlappung über diesem Wert → niedrigere Box wegwerfen. */
  iouThreshold: number;
  /** Letterbox-Parameter aus dem Preprocessing (für Box-Rückskalierung). */
  letterbox: LetterboxParams;
  /** Originale Bildmaße (vor Letterbox). */
  originalWidth: number;
  originalHeight: number;
  /** Eingabegröße des Modells (z.B. 640). */
  modelSize: number;
  /** Optional: nur diese Klassen-IDs zurückgeben (für UI-Klassenfilter). */
  allowedClassIds?: ReadonlySet<number>;
};

/**
 * Berechnet die Intersection-over-Union (IoU) zweier Bounding Boxes.
 *
 * IoU = Schnittfläche / Vereinigungsfläche.
 * Wertebereich: 0 (keine Überlappung) bis 1 (identische Boxen).
 *
 * @param a Erste Box im Format [x, y, width, height].
 * @param b Zweite Box im selben Format.
 * @returns IoU im Bereich 0..1.
 */
export function computeIou(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): number {
  // Rechte/untere Kante der jeweiligen Box berechnen.
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;

  // Schnitt-Rechteck bestimmen.
  const interLeft = Math.max(a.x, b.x);
  const interTop = Math.max(a.y, b.y);
  const interRight = Math.min(aRight, bRight);
  const interBottom = Math.min(aBottom, bBottom);

  // Wenn die Rechtecke nicht überlappen, ist die Schnittfläche 0.
  const interW = Math.max(0, interRight - interLeft);
  const interH = Math.max(0, interBottom - interTop);
  const interArea = interW * interH;

  // Vereinigungsfläche = A + B - Schnitt
  const aArea = a.width * a.height;
  const bArea = b.width * b.height;
  const unionArea = aArea + bArea - interArea;

  // Sicher gegen Division durch 0.
  if (unionArea <= 0) return 0;
  return interArea / unionArea;
}

/**
 * Non-Maximum-Suppression: entfernt überlappende Boxen derselben Klasse,
 * behält nur die mit dem höchsten Konfidenz-Score.
 *
 * Algorithmus:
 *   1. Detektionen nach Score absteigend sortieren.
 *   2. Erste Detektion behalten, alle anderen derselben Klasse mit
 *      IoU > Threshold verwerfen.
 *   3. Mit der nächsten verbliebenen Detektion fortfahren.
 *
 * @param detections Liste unaufgeräumter Detektionen.
 * @param iouThreshold Schwellwert für die Überlappung.
 * @returns Aufgeräumte Liste ohne Duplikate.
 */
export function nonMaximumSuppression(
  detections: Detection[],
  iouThreshold: number,
): Detection[] {
  // Sortieren nach Score absteigend. Slice damit das Original nicht mutiert wird.
  const sorted = detections.slice().sort((a, b) => b.score - a.score);
  const kept: Detection[] = [];

  for (const det of sorted) {
    // Prüfen, ob diese Detektion mit einer bereits gewählten zu stark überlappt.
    let suppress = false;
    for (const keep of kept) {
      // NMS nur innerhalb derselben Klasse — verschiedene Klassen dürfen
      // sich überlagern (z.B. Person mit Handtasche).
      if (det.classId !== keep.classId) continue;
      if (computeIou(det, keep) > iouThreshold) {
        suppress = true;
        break;
      }
    }
    if (!suppress) {
      kept.push(det);
    }
  }

  return kept;
}

/**
 * Hauptfunktion: nimmt rohen Modell-Output und liefert fertige Detektionen.
 *
 * @param output Rohes Modell-Output-Array (Length = 1 * 84 * 8400 = 705600).
 * @param options Konfiguration (Klassen, Thresholds, Letterbox-Parameter).
 * @returns Aufgeräumte Detektions-Liste im Originalbild-Koordinatensystem.
 */
export function postprocessYolo11(
  output: Float32Array,
  options: PostprocessOptions,
): Detection[] {
  const {
    classNames,
    scoreThreshold,
    iouThreshold,
    letterbox,
    originalWidth,
    originalHeight,
    modelSize,
    allowedClassIds,
  } = options;

  const numClasses = classNames.length;
  // 84 = 4 Box-Werte + 80 Klassen
  const numAttrs = 4 + numClasses;
  // 8400 = Anzahl Kandidaten (output.length / numAttrs)
  const numCandidates = output.length / numAttrs;

  // Sammeln aller Kandidaten, die den Score-Threshold überschreiten.
  const candidates: Detection[] = [];

  // YOLO-Output ist im Format [attribute][candidate] gespeichert (column-major).
  // D.h. cx-Werte aller Kandidaten kommen zuerst, dann cy, dann w, dann h,
  // dann Score-Klasse-0 aller Kandidaten, dann Score-Klasse-1, etc.

  for (let c = 0; c < numCandidates; c++) {
    // Höchsten Klassen-Score für diesen Kandidaten finden.
    let bestClassId = -1;
    let bestScore = scoreThreshold;

    for (let k = 0; k < numClasses; k++) {
      // Index in output: (4 + k) * numCandidates + c
      const score = output[(4 + k) * numCandidates + c];
      if (score > bestScore) {
        bestScore = score;
        bestClassId = k;
      }
    }

    // Wenn kein Score über dem Threshold: Kandidat verwerfen.
    if (bestClassId === -1) continue;

    // Falls Klassenfilter aktiv: prüfen ob diese Klasse erlaubt ist.
    if (allowedClassIds && !allowedClassIds.has(bestClassId)) continue;

    // Box-Koordinaten extrahieren (im Modell-Pixelraum 0..modelSize).
    const cx = output[0 * numCandidates + c];
    const cy = output[1 * numCandidates + c];
    const w = output[2 * numCandidates + c];
    const h = output[3 * numCandidates + c];

    // Center → Corner-Format
    const x = cx - w / 2;
    const y = cy - h / 2;

    // Letterbox-Padding rückgängig machen: vom Modell-Raum zurück
    // ins skalierte Original (vor Padding).
    const xUnpad = x - letterbox.padX;
    const yUnpad = y - letterbox.padY;

    // Vom skalierten Original zurück ins Original (mit Scale rückgängig).
    const origX = xUnpad / letterbox.scale;
    const origY = yUnpad / letterbox.scale;
    const origW = w / letterbox.scale;
    const origH = h / letterbox.scale;

    // Boxen außerhalb des Bildes clippen (kommt bei Letterbox-Rand selten vor).
    const clippedX = Math.max(0, Math.min(originalWidth, origX));
    const clippedY = Math.max(0, Math.min(originalHeight, origY));
    const clippedW = Math.min(originalWidth - clippedX, origW);
    const clippedH = Math.min(originalHeight - clippedY, origH);

    // Negative oder degenerierte Boxen aussortieren.
    if (clippedW <= 0 || clippedH <= 0) continue;

    candidates.push({
      x: clippedX,
      y: clippedY,
      width: clippedW,
      height: clippedH,
      classId: bestClassId,
      className: classNames[bestClassId],
      score: bestScore,
    });
  }

  // NMS anwenden — entfernt Duplikate.
  return nonMaximumSuppression(candidates, iouThreshold);

  // modelSize wird hier nicht direkt verwendet, ist aber in den Options
  // dokumentiert, weil es bei alternativen Postprocessing-Varianten
  // (z.B. wenn cx,cy in normalisierten 0..1-Koordinaten kämen) gebraucht würde.
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  modelSize;
}
