/**
 * ============================================================================
 * preprocess.test.ts — Tests für die Preprocessing-Funktionen
 * ============================================================================
 *
 * Wir testen nur die mathematisch-deterministischen Teile:
 *   - computeLetterboxParams (Skalierung + Padding)
 *   - rgbaToFloat32Planar (Pixel-Konvertierung)
 *
 * preprocessFrame selbst wird NICHT getestet, weil es OffscreenCanvas/
 * HTMLVideoElement braucht — beides ist in jsdom nicht (vollständig)
 * verfügbar. Smoke-Test erfolgt im Browser.
 */

import { describe, it, expect } from 'vitest';
import { computeLetterboxParams, rgbaToFloat32Planar } from './preprocess';

describe('computeLetterboxParams', () => {
  it('skaliert quadratisches Bild ohne Padding', () => {
    const params = computeLetterboxParams(640, 640, 640);
    expect(params.scale).toBe(1);
    expect(params.padX).toBe(0);
    expect(params.padY).toBe(0);
  });

  it('skaliert Landscape-Bild (1920×1080) korrekt', () => {
    // Längere Seite ist 1920 → Skalierungsfaktor = 640/1920 = 0.333...
    // Neue Höhe = 1080 * 0.333... = 360
    // Vertikal-Padding = (640 - 360) / 2 = 140
    const params = computeLetterboxParams(1920, 1080, 640);
    expect(params.scale).toBeCloseTo(640 / 1920);
    expect(params.padX).toBe(0);
    expect(params.padY).toBeCloseTo(140);
  });

  it('skaliert Portrait-Bild (720×1280) korrekt', () => {
    // Längere Seite ist 1280 → scale = 640/1280 = 0.5
    // Neue Breite = 720 * 0.5 = 360
    // Horizontal-Padding = (640 - 360) / 2 = 140
    const params = computeLetterboxParams(720, 1280, 640);
    expect(params.scale).toBe(0.5);
    expect(params.padX).toBe(140);
    expect(params.padY).toBe(0);
  });

  it('handhabt kleines Bild ohne Skalierungs-Probleme', () => {
    // Wenn das Original kleiner als modelSize ist, wird hochskaliert.
    const params = computeLetterboxParams(320, 240, 640);
    expect(params.scale).toBe(2); // 640 / 320 = 2
    expect(params.padX).toBe(0);
    expect(params.padY).toBe(80); // (640 - 240*2) / 2 = (640 - 480) / 2 = 80
  });
});

describe('rgbaToFloat32Planar', () => {
  it('produziert ein Array der erwarteten Größe (3 * w * h)', () => {
    // 2×2 Pixel = 4 Pixel = 16 RGBA-Werte
    const rgba = new Uint8ClampedArray(16);
    const out = rgbaToFloat32Planar(rgba, 2, 2);
    expect(out.length).toBe(2 * 2 * 3); // 12
  });

  it('normalisiert 255 zu 1.0 und 0 zu 0.0', () => {
    // 1×1 Pixel: R=255, G=128, B=0, A=255
    const rgba = new Uint8ClampedArray([255, 128, 0, 255]);
    const out = rgbaToFloat32Planar(rgba, 1, 1);
    // pixelCount = 1, output ist [R, G, B] an Positionen 0, 1, 2
    expect(out[0]).toBeCloseTo(1.0); // R
    expect(out[1]).toBeCloseTo(128 / 255); // G
    expect(out[2]).toBe(0); // B
  });

  it('legt Kanäle in planarem Layout ab (alle R, dann alle G, dann alle B)', () => {
    // 2×1 Pixel: Pixel0=(10,20,30,255), Pixel1=(40,50,60,255)
    const rgba = new Uint8ClampedArray([10, 20, 30, 255, 40, 50, 60, 255]);
    const out = rgbaToFloat32Planar(rgba, 2, 1);
    // pixelCount = 2
    // Positionen: [R0, R1, G0, G1, B0, B1]
    expect(out[0]).toBeCloseTo(10 / 255); // R0
    expect(out[1]).toBeCloseTo(40 / 255); // R1
    expect(out[2]).toBeCloseTo(20 / 255); // G0
    expect(out[3]).toBeCloseTo(50 / 255); // G1
    expect(out[4]).toBeCloseTo(30 / 255); // B0
    expect(out[5]).toBeCloseTo(60 / 255); // B1
  });

  it('ignoriert den Alpha-Kanal', () => {
    // Pixel mit Alpha=0 sollte trotzdem RGB-Werte korrekt liefern.
    const rgba = new Uint8ClampedArray([100, 200, 50, 0]);
    const out = rgbaToFloat32Planar(rgba, 1, 1);
    expect(out[0]).toBeCloseTo(100 / 255);
    expect(out[1]).toBeCloseTo(200 / 255);
    expect(out[2]).toBeCloseTo(50 / 255);
    // Kein 4. Wert für Alpha
    expect(out.length).toBe(3);
  });
});
