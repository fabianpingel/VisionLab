/**
 * ConfidenceSlider.test.tsx — Komponententests für den Konfidenz-Slider
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfidenceSlider } from './ConfidenceSlider';
import { useSettingsStore } from '@/stores/settingsStore';

describe('ConfidenceSlider', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset();
  });

  it('zeigt den initialen Konfidenz-Wert aus dem Store', () => {
    render(<ConfidenceSlider />);
    // Default ist 0.45
    expect(screen.getByText('0.45')).toBeInTheDocument();
  });

  it('aktualisiert den Store-Wert bei Slider-Bewegung', () => {
    render(<ConfidenceSlider />);
    const slider = screen.getByRole('slider', { name: /konfidenz/i });

    // fireEvent.change ist hier zuverlässiger als user.type für range-Inputs.
    fireEvent.change(slider, { target: { value: '0.75' } });

    expect(useSettingsStore.getState().confidenceThreshold).toBeCloseTo(0.75);
    // Anzeige aktualisiert sich auch
    expect(screen.getByText('0.75')).toBeInTheDocument();
  });

  it('clampt auf maximal 1.0', () => {
    render(<ConfidenceSlider />);
    const slider = screen.getByRole('slider', { name: /konfidenz/i });

    // Versuch über 1 → Store clampt auf 1
    fireEvent.change(slider, { target: { value: '2' } });
    // input type=range klemmt selbst auf max=1, daher kommt 1 an.
    expect(useSettingsStore.getState().confidenceThreshold).toBe(1);
  });
});
