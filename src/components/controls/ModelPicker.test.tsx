/**
 * ModelPicker.test.tsx — Komponententests für die Modell-Auswahl
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModelPicker } from './ModelPicker';
import type { ModelSpec } from '@/inference/types';

// Test-Daten — zwei realistische Modell-Specs.
const MODELS: ModelSpec[] = [
  {
    id: 'yolo11n-coco',
    name: 'YOLO11N (COCO)',
    displayName: 'YOLO v11 Nano',
    path: 'yolo11n-coco.onnx',
    inputSize: [1, 3, 640, 640],
    precision: 'fp32',
    sizeBytes: 10_741_341, // 10.2 MB
    description: 'Nano-Variante, schnell.',
    classes: [],
  },
  {
    id: 'yolo11s-coco',
    name: 'YOLO11S (COCO)',
    displayName: 'YOLO v11 Small',
    path: 'yolo11s-coco.onnx',
    inputSize: [1, 3, 640, 640],
    precision: 'fp32',
    sizeBytes: 38_051_727, // 36.3 MB
    description: 'Small-Variante.',
    classes: [],
  },
];

describe('ModelPicker', () => {
  it('zeigt einen Hinweis, wenn keine Modelle verfügbar sind', () => {
    render(<ModelPicker models={[]} currentModelId={null} onSwitch={() => {}} />);
    expect(screen.getByText(/keine modelle/i)).toBeInTheDocument();
  });

  it('rendert eine Radio-Karte pro Modell mit Displayname und Größe', () => {
    render(<ModelPicker models={MODELS} currentModelId={null} onSwitch={() => {}} />);
    expect(screen.getByText('YOLO v11 Nano')).toBeInTheDocument();
    expect(screen.getByText('YOLO v11 Small')).toBeInTheDocument();
    // Formatierte Größe (MB mit einer Nachkommastelle)
    expect(screen.getByText('10.2 MB')).toBeInTheDocument();
    expect(screen.getByText('36.3 MB')).toBeInTheDocument();
  });

  it('markiert die Karte des aktuellen Modells als aktiv (radio checked)', () => {
    render(
      <ModelPicker
        models={MODELS}
        currentModelId="yolo11s-coco"
        onSwitch={() => {}}
      />,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).not.toBeChecked(); // Nano
    expect(radios[1]).toBeChecked(); // Small
  });

  it('ruft onSwitch mit der korrekten Modell-ID beim Klick auf', async () => {
    const handleSwitch = vi.fn();
    const user = userEvent.setup();

    render(
      <ModelPicker
        models={MODELS}
        currentModelId="yolo11n-coco"
        onSwitch={handleSwitch}
      />,
    );
    await user.click(screen.getByRole('radio', { name: /YOLO v11 Small/ }));

    expect(handleSwitch).toHaveBeenCalledWith('yolo11s-coco');
  });
});
