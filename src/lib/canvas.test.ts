/**
 * ============================================================================
 * canvas.test.ts — Tests für die Canvas-Helper-Funktionen
 * ============================================================================
 *
 * Wir testen:
 *   - transformBoxToDisplay: Koordinaten-Transformation Video → Canvas
 *   - classIdToColor + classIdToLabelBackground: Farben deterministisch
 */

import { describe, it, expect } from 'vitest';
import {
  transformBoxToDisplay,
  classIdToColor,
  classIdToLabelBackground,
} from './canvas';

describe('transformBoxToDisplay', () => {
  it('identische Aspekte: 1:1-Skalierung ohne Crop-Offset', () => {
    // Video 640×640, Canvas 640×640 → kein Skalieren, kein Croppen.
    const box = transformBoxToDisplay(100, 50, 200, 150, 640, 640, 640, 640, false);
    expect(box.x).toBeCloseTo(100);
    expect(box.y).toBeCloseTo(50);
    expect(box.width).toBeCloseTo(200);
    expect(box.height).toBeCloseTo(150);
  });

  it('skaliert proportional, wenn Video kleiner als Canvas', () => {
    // Video 320×320, Canvas 640×640 → Skalierung ×2.
    const box = transformBoxToDisplay(100, 50, 200, 150, 320, 320, 640, 640, false);
    expect(box.x).toBeCloseTo(200);
    expect(box.y).toBeCloseTo(100);
    expect(box.width).toBeCloseTo(400);
    expect(box.height).toBeCloseTo(300);
  });

  it('Landscape-Video in Portrait-Canvas: horizontaler Crop', () => {
    // Video 1920×1080 in Canvas 360×640 (Portrait).
    // videoAspect = 1.78, canvasAspect = 0.5625 → videoAspect > canvasAspect
    // → vertikal füllen, horizontal croppen.
    // scale = 640 / 1080 ≈ 0.5926
    // skalierte Video-Breite = 1920 * 0.5926 ≈ 1138
    // Crop-Offset-X = (1138 - 360) / 2 ≈ 389
    // Box (0, 0) im Original → (0 * 0.5926 - 389, 0 * 0.5926 - 0) = (-389, 0)
    // Das ist außerhalb des sichtbaren Bereichs — was korrekt ist
    // (linke Bildkante wurde gecroppt).
    const box = transformBoxToDisplay(0, 0, 100, 100, 1920, 1080, 360, 640, false);
    const expectedScale = 640 / 1080;
    const expectedOffsetX = (1920 * expectedScale - 360) / 2;
    expect(box.x).toBeCloseTo(-expectedOffsetX);
    expect(box.width).toBeCloseTo(100 * expectedScale);
  });

  it('Portrait-Video in Landscape-Canvas: vertikaler Crop', () => {
    // Video 720×1280 in Canvas 640×360 (Landscape).
    // videoAspect = 0.5625, canvasAspect = 1.78 → videoAspect < canvasAspect
    // → horizontal füllen, vertikal croppen.
    const box = transformBoxToDisplay(0, 0, 100, 100, 720, 1280, 640, 360, false);
    const expectedScale = 640 / 720;
    expect(box.x).toBeCloseTo(0);
    expect(box.width).toBeCloseTo(100 * expectedScale);
  });

  it('spiegelt die X-Koordinate bei mirror=true', () => {
    // Box bei x=100, width=50 in 640er Canvas, mirror=true.
    // Erwartet: x = 640 - 100 - 50 = 490 (an der vertikalen Mitte gespiegelt).
    const box = transformBoxToDisplay(100, 0, 50, 50, 640, 640, 640, 640, true);
    expect(box.x).toBeCloseTo(490);
    // Y und Maße bleiben unverändert
    expect(box.y).toBeCloseTo(0);
    expect(box.width).toBeCloseTo(50);
    expect(box.height).toBeCloseTo(50);
  });

  it('Spiegelung ist involutiv (zweimal spiegeln = nicht spiegeln)', () => {
    // x bei 100 in 640er Canvas.
    // 1× spiegeln: 640 - 100 - 50 = 490
    // 2× spiegeln: 640 - 490 - 50 = 100 ✓
    const once = transformBoxToDisplay(100, 0, 50, 50, 640, 640, 640, 640, true);
    const twice = transformBoxToDisplay(once.x, 0, 50, 50, 640, 640, 640, 640, true);
    expect(twice.x).toBeCloseTo(100);
  });
});

describe('classIdToColor', () => {
  it('liefert einen hsla-String mit der erwarteten Struktur', () => {
    const color = classIdToColor(0);
    expect(color).toMatch(/^hsla\(\d+, 75%, 60%, 1\)$/);
  });

  it('liefert für gleiche ID immer dieselbe Farbe (deterministisch)', () => {
    expect(classIdToColor(5)).toBe(classIdToColor(5));
    expect(classIdToColor(42)).toBe(classIdToColor(42));
  });

  it('liefert für verschiedene IDs verschiedene Farben (Hue unterschiedlich)', () => {
    // Wir prüfen ein paar Stichproben — IDs nahe beieinander sollten
    // klar unterschiedliche Hues haben (wegen Goldenem-Winkel-Sprung).
    const c0 = classIdToColor(0);
    const c1 = classIdToColor(1);
    const c2 = classIdToColor(2);
    expect(c0).not.toBe(c1);
    expect(c1).not.toBe(c2);
    expect(c0).not.toBe(c2);
  });

  it('respektiert die Alpha-Komponente', () => {
    const c = classIdToColor(0, 0.5);
    expect(c).toMatch(/, 0\.5\)$/);
  });
});

describe('classIdToLabelBackground', () => {
  it('liefert für die gleiche Klassen-ID einen dunkleren Ton als die Box-Farbe', () => {
    // Beide Funktionen nutzen denselben Hue, aber unterschiedliche Lightness.
    // Wir prüfen, dass Lightness 30% (Background) anders als 60% (Box) ist.
    const bg = classIdToLabelBackground(0);
    expect(bg).toContain('30%');
    const fg = classIdToColor(0);
    expect(fg).toContain('60%');
  });

  it('ist deterministisch', () => {
    expect(classIdToLabelBackground(7)).toBe(classIdToLabelBackground(7));
  });
});
