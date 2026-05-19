/**
 * BackendBadge.test.tsx — Tests für das Backend-Label
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BackendBadge } from './BackendBadge';

describe('BackendBadge', () => {
  it('rendert nichts, wenn das Backend null ist', () => {
    const { container } = render(<BackendBadge backend={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('zeigt "WebGPU" mit korrektem Tooltip für webgpu-Backend', () => {
    render(<BackendBadge backend="webgpu" />);
    expect(screen.getByText('WebGPU')).toBeInTheDocument();
    expect(screen.getByTitle(/Hardware-beschleunigt/i)).toBeInTheDocument();
  });

  it('zeigt "WASM" mit korrektem Tooltip für wasm-Backend', () => {
    render(<BackendBadge backend="wasm" />);
    expect(screen.getByText('WASM')).toBeInTheDocument();
    expect(screen.getByTitle(/CPU-Inferenz/i)).toBeInTheDocument();
  });
});
