/**
 * ============================================================================
 * ConfidenceSlider.tsx — Slider für die Konfidenz-Schwelle
 * ============================================================================
 *
 * Mit diesem Slider regelt der Nutzer, ab welchem Konfidenz-Score Detektionen
 * angezeigt werden:
 *   - Niedriger Wert (z.B. 0.1) → viele Detektionen, auch unsichere
 *   - Hoher Wert (z.B. 0.8)      → nur sehr sichere Detektionen
 *
 * Wir verwenden den nativen <input type="range">, weil er auf Touch-Geräten
 * (vor allem iOS) am zuverlässigsten funktioniert. Eigene Slider-Komponenten
 * können da hakeln.
 *
 * Stylen über `accent-color` (CSS) — wirkt auf den Slider-Daumen in modernen
 * Browsern und respektiert das Theme.
 */

import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Konfidenz-Slider — liest und schreibt direkt den Settings-Store.
 *
 * @returns JSX-Element mit Label, Slider und aktuellem Wert.
 */
export function ConfidenceSlider(): JSX.Element {
  // Wert + Setter aus dem Store. Wir nutzen separate Selektoren, damit
  // die Komponente nur bei Änderung des spezifischen Wertes re-rendert.
  const value = useSettingsStore((s) => s.confidenceThreshold);
  const setValue = useSettingsStore((s) => s.setConfidenceThreshold);

  /**
   * onChange-Handler: parsen, validieren, im Store speichern.
   *
   * `e.target.value` ist immer ein String, daher parseFloat.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const num = parseFloat(e.target.value);
    if (!Number.isNaN(num)) {
      setValue(num);
    }
  };

  return (
    <div className="space-y-2">
      {/* Label + aktueller Wert in einer Zeile (flex-between) */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="confidence-slider"
          className="text-sm font-medium text-white/90"
        >
          Konfidenz-Schwelle
        </label>
        <span className="text-sm font-mono text-white/70 tabular-nums">
          {value.toFixed(2)}
        </span>
      </div>

      <input
        id="confidence-slider"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={handleChange}
        // accent-color: native Slider-Farbe in modernen Browsern.
        // Brand-Amber statt Weiß → Marken-Identität auch in Bedienelementen.
        className="w-full accent-accent cursor-pointer"
        aria-label="Konfidenz-Schwelle"
      />
    </div>
  );
}
