/**
 * Sparkline.test.tsx — Tests für das Mini-Diagramm
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Sparkline } from './Sparkline';

describe('Sparkline', () => {
  it('rendert ein leeres SVG bei weniger als 2 Werten', () => {
    const { container } = render(<Sparkline values={[]} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // Keine Polyline
    expect(container.querySelector('polyline')).toBeNull();
  });

  it('rendert eine Polyline mit n Punkten bei n Werten', () => {
    const { container } = render(<Sparkline values={[10, 20, 30, 40]} />);
    const polyline = container.querySelector('polyline');
    expect(polyline).toBeInTheDocument();
    // points-Attribut hat 4 Koordinaten (durch Leerzeichen getrennt)
    const points = polyline?.getAttribute('points')?.split(' ');
    expect(points).toHaveLength(4);
  });

  it('skaliert die Y-Werte auf das Maximum', () => {
    // Werte 0 und 100 → Maximum = 100 → Linie geht vom unteren Rand zum oberen.
    const { container } = render(<Sparkline values={[0, 100]} height={20} />);
    const polyline = container.querySelector('polyline');
    const points = polyline?.getAttribute('points')?.split(' ') ?? [];
    // Erster Punkt liegt am unteren Rand (y nahe 19), zweiter nahe oben (y nahe 1).
    const firstY = parseFloat(points[0].split(',')[1]);
    const secondY = parseFloat(points[1].split(',')[1]);
    expect(firstY).toBeGreaterThan(secondY); // unten > oben in SVG-Koordinaten
  });

  it('respektiert die übergebene Breite und Höhe', () => {
    const { container } = render(<Sparkline values={[1, 2]} width={100} height={50} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('100');
    expect(svg?.getAttribute('height')).toBe('50');
  });
});
