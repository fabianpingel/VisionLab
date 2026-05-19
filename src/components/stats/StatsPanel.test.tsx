/**
 * StatsPanel.test.tsx — Komponententests fürs Stats-Panel
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsPanel } from './StatsPanel';
import type { ModelSpec } from '@/inference/types';

// Minimal-Modell-Spec für die Tests
const FAKE_MODEL: ModelSpec = {
  id: 'yolo11n-coco',
  name: 'YOLO11N (COCO)',
  displayName: 'YOLO v11 Nano',
  path: 'yolo11n-coco.onnx',
  inputSize: [1, 3, 640, 640],
  precision: 'fp32',
  sizeBytes: 10741341,
  description: 'Nano-Variante.',
  classes: ['person', 'bicycle'],
};

describe('StatsPanel', () => {
  it('zeigt eine Lade-Nachricht im Status "loading-manifest"', () => {
    render(
      <StatsPanel
        status="loading-manifest"
        error={null}
        backend={null}
        fps={0}
        fpsHistory={[]}
        inferenceMs={0}
        detectionCount={0}
        currentModel={null}
      />,
    );
    expect(screen.getByText(/Lade Modell-Liste/i)).toBeInTheDocument();
  });

  it('zeigt eine Fehlermeldung mit dem error-String im Status "error"', () => {
    render(
      <StatsPanel
        status="error"
        error="Worker abgestürzt"
        backend={null}
        fps={0}
        fpsHistory={[]}
        inferenceMs={0}
        detectionCount={0}
        currentModel={null}
      />,
    );
    expect(screen.getByText(/Worker abgestürzt/i)).toBeInTheDocument();
  });

  it('zeigt im Ready-Zustand FPS, ms, Backend und Modellname', () => {
    render(
      <StatsPanel
        status="ready"
        error={null}
        backend="webgpu"
        fps={28}
        fpsHistory={[26, 27, 28]}
        inferenceMs={18}
        detectionCount={3}
        currentModel={FAKE_MODEL}
      />,
    );
    // Gerundete FPS-Zahl
    expect(screen.getByText('28')).toBeInTheDocument();
    // FPS-Label (klein in Caps)
    expect(screen.getByText(/FPS/)).toBeInTheDocument();
    // Inferenz-ms
    expect(screen.getByText('18 ms')).toBeInTheDocument();
    // Backend
    expect(screen.getByText('WebGPU')).toBeInTheDocument();
    // Modellname
    expect(screen.getByText('YOLO v11 Nano')).toBeInTheDocument();
  });

  it('verwendet Singular für 1 Detection, Plural für andere', () => {
    const { rerender } = render(
      <StatsPanel
        status="ready"
        error={null}
        backend="webgpu"
        fps={30}
        fpsHistory={[30]}
        inferenceMs={10}
        detectionCount={1}
        currentModel={FAKE_MODEL}
      />,
    );
    expect(screen.getByText(/1 Objekt$/)).toBeInTheDocument();

    rerender(
      <StatsPanel
        status="ready"
        error={null}
        backend="webgpu"
        fps={30}
        fpsHistory={[30]}
        inferenceMs={10}
        detectionCount={5}
        currentModel={FAKE_MODEL}
      />,
    );
    expect(screen.getByText(/5 Objekte/)).toBeInTheDocument();
  });
});
