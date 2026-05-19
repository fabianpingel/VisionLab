/**
 * ============================================================================
 * BackendBadge.tsx — Pille, die zeigt, welches Backend gerade läuft
 * ============================================================================
 *
 * Zwei Backends sind möglich:
 *   - WebGPU: hardwarebeschleunigt, modern → Blitz-Icon, akzentuierte Farbe
 *   - WASM:   CPU-Fallback → Werkzeug-Icon, dezente Farbe
 *
 * Funktioniert auch als Marketing-Element: zeigt dem Kunden, dass die App
 * adaptiv ist — "läuft hier auf WebGPU, auf älteren Geräten als Fallback".
 */

import type { InferenceBackend } from '@/inference/types';

type BackendBadgeProps = {
  backend: InferenceBackend | null;
};

/**
 * Pille mit Icon und Backend-Namen.
 *
 * @param props.backend 'webgpu', 'wasm' oder null (noch nicht bekannt).
 * @returns JSX-Element.
 */
export function BackendBadge({ backend }: BackendBadgeProps): JSX.Element | null {
  // Solange kein Backend bekannt ist (initial), nichts rendern.
  if (!backend) return null;

  // Backend-spezifische Darstellung
  const isWebGpu = backend === 'webgpu';
  const label = isWebGpu ? 'WebGPU' : 'WASM';
  // Akzentfarbe (Tailwind): WebGPU = grünlich, WASM = neutral
  const colorClass = isWebGpu ? 'text-emerald-300' : 'text-white/70';

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase
                  tracking-wider ${colorClass}`}
      title={isWebGpu ? 'Hardware-beschleunigt via WebGPU' : 'CPU-Inferenz via WebAssembly'}
    >
      {/* Icon je nach Backend.
          Heroicons "bolt" für WebGPU (MIT-Lizenz),
          "cpu-chip" für WASM. */}
      {isWebGpu ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-3 h-3"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-3 h-3"
          aria-hidden="true"
        >
          <path d="M14 6H6v8h8V6Z" />
          <path
            fillRule="evenodd"
            d="M9.25 3V1.75a.75.75 0 0 1 1.5 0V3h1.5V1.75a.75.75 0 0 1 1.5 0V3h.5A2.75 2.75 0 0 1 17 5.75v.5h1.25a.75.75 0 0 1 0 1.5H17v1.5h1.25a.75.75 0 0 1 0 1.5H17v1.5h1.25a.75.75 0 0 1 0 1.5H17v.5A2.75 2.75 0 0 1 14.25 17h-.5v1.25a.75.75 0 0 1-1.5 0V17h-1.5v1.25a.75.75 0 0 1-1.5 0V17h-1.5v1.25a.75.75 0 0 1-1.5 0V17h-.5A2.75 2.75 0 0 1 3 14.25v-.5H1.75a.75.75 0 0 1 0-1.5H3v-1.5H1.75a.75.75 0 0 1 0-1.5H3v-1.5H1.75a.75.75 0 0 1 0-1.5H3v-.5A2.75 2.75 0 0 1 5.75 3h.5V1.75a.75.75 0 0 1 1.5 0V3h1.5ZM4.5 5.75c0-.69.56-1.25 1.25-1.25h8.5c.69 0 1.25.56 1.25 1.25v8.5c0 .69-.56 1.25-1.25 1.25h-8.5c-.69 0-1.25-.56-1.25-1.25v-8.5Z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {label}
    </span>
  );
}
