/**
 * ============================================================================
 * postprocess.test.ts — Tests für die Postprocessing-Funktionen
 * ============================================================================
 *
 * Wir testen die deterministischen Hilfsfunktionen:
 *   - computeIou (Intersection-over-Union)
 *   - nonMaximumSuppression (NMS)
 *
 * `postprocessYolo11` selbst testen wir hier nicht voll durch — dafür wäre
 * ein synthetischer Modell-Output mit 8400 Kandidaten nötig. Stattdessen
 * wird die Funktion durch den Browser-Smoketest verifiziert.
 */

import { describe, it, expect } from 'vitest';
import { computeIou, nonMaximumSuppression } from './postprocess';
import type { Detection } from './types';

describe('computeIou', () => {
  it('liefert 0 für nicht überlappende Boxen', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 20, y: 20, width: 10, height: 10 };
    expect(computeIou(a, b)).toBe(0);
  });

  it('liefert 1 für identische Boxen', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 0, y: 0, width: 10, height: 10 };
    expect(computeIou(a, b)).toBe(1);
  });

  it('liefert 0.5 für genau halb-überlappende Boxen (Schnitt = halbe Union)', () => {
    // Zwei 10×10-Boxen, die um 5 Pixel horizontal verschoben sind.
    // Schnitt = 5×10 = 50.
    // Vereinigung = 10×10 + 10×10 − 50 = 150.
    // IoU = 50/150 = 1/3.
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 0, width: 10, height: 10 };
    expect(computeIou(a, b)).toBeCloseTo(1 / 3);
  });

  it('liefert korrektes IoU für teil-überlappende Boxen', () => {
    // Beide 10×10, eine bei (0,0), andere bei (5,5)
    // Schnitt = 5×5 = 25
    // Vereinigung = 100 + 100 − 25 = 175
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(computeIou(a, b)).toBeCloseTo(25 / 175);
  });
});

describe('nonMaximumSuppression', () => {
  // Helfer: Detection mit Defaults bauen.
  function makeDet(
    classId: number,
    score: number,
    x: number,
    y: number,
    w = 10,
    h = 10,
  ): Detection {
    return {
      classId,
      className: `class-${classId}`,
      score,
      x,
      y,
      width: w,
      height: h,
    };
  }

  it('behält identische Boxen, wenn sie unterschiedliche Klassen haben', () => {
    // Zwei Boxen am selben Ort, aber unterschiedliche Klassen → beide bleiben.
    const dets: Detection[] = [makeDet(0, 0.9, 0, 0), makeDet(1, 0.8, 0, 0)];
    const kept = nonMaximumSuppression(dets, 0.5);
    expect(kept.length).toBe(2);
  });

  it('entfernt die niedriger-bewertete Box bei Klassen-internem Overlap', () => {
    // Zwei identische Boxen, gleiche Klasse → die mit dem niedrigeren Score fliegt.
    const dets: Detection[] = [makeDet(0, 0.9, 0, 0), makeDet(0, 0.7, 0, 0)];
    const kept = nonMaximumSuppression(dets, 0.5);
    expect(kept.length).toBe(1);
    expect(kept[0].score).toBe(0.9);
  });

  it('behält beide Boxen, wenn ihr IoU unter dem Threshold liegt', () => {
    // Boxen mit IoU = 1/3 ≈ 0.333. Threshold = 0.5 → beide bleiben.
    const dets: Detection[] = [
      makeDet(0, 0.9, 0, 0),
      makeDet(0, 0.8, 5, 0), // 5 Pixel verschoben → IoU = 1/3
    ];
    const kept = nonMaximumSuppression(dets, 0.5);
    expect(kept.length).toBe(2);
  });

  it('verwirft Boxen bei IoU über dem Threshold', () => {
    // Boxen sind fast identisch → IoU > 0.5 → niedriger fliegt.
    const dets: Detection[] = [
      makeDet(0, 0.9, 0, 0, 10, 10),
      makeDet(0, 0.8, 1, 1, 10, 10), // großer Überlapp
    ];
    const kept = nonMaximumSuppression(dets, 0.5);
    expect(kept.length).toBe(1);
    expect(kept[0].score).toBe(0.9);
  });

  it('liefert leeres Array bei leerem Input', () => {
    const kept = nonMaximumSuppression([], 0.5);
    expect(kept).toEqual([]);
  });
});
