/**
 * ============================================================================
 * ClassFilter.tsx — Multi-Select für die 80 COCO-Klassen (deutsch beschriftet)
 * ============================================================================
 *
 * UI:
 *   - Zwei Aktion-Buttons oben: "Alle" / "Keine"
 *   - Darunter ein Grid aus 80 Checkbox-Pills (alphabetisch sortiert)
 *
 * Bei vielen Klassen würden wir eigentlich ein Suchfeld einbauen — bei 80
 * Items ist das aber gut überblickbar, das sparen wir uns hier.
 *
 * Bidirektionale Anbindung an den settingsStore:
 *   - Liest enabledClassIds direkt aus dem Store.
 *   - Klick toggelt einzelne Klasse via toggleClass-Aktion.
 */

import { useMemo } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { COCO_LABELS_DE } from '@/models/cocoLabelsDe';

/**
 * Klassenfilter-Komponente.
 *
 * @returns JSX-Element mit Alle/Keine-Buttons + Klassen-Gitter.
 */
export function ClassFilter(): JSX.Element {
  // Store-Subscriptions — fein-granular, nur was wir wirklich brauchen.
  const enabledClassIds = useSettingsStore((s) => s.enabledClassIds);
  const toggleClass = useSettingsStore((s) => s.toggleClass);
  const enableAll = useSettingsStore((s) => s.enableAllClasses);
  const disableAll = useSettingsStore((s) => s.disableAllClasses);

  /**
   * Indizes alphabetisch sortiert nach deutschem Namen.
   *
   * useMemo cached das Ergebnis, damit es nur einmal pro Komponenten-Lebenszyklus
   * berechnet wird (die COCO-Liste ändert sich nie).
   */
  const sortedIndices = useMemo(() => {
    return COCO_LABELS_DE.map((label, idx) => ({ label, idx }))
      .sort((a, b) => a.label.localeCompare(b.label, 'de'))
      .map((entry) => entry.idx);
  }, []);

  // O(1)-Lookup während des Renderns.
  const enabledSet = useMemo(() => new Set(enabledClassIds), [enabledClassIds]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/90">
          Klassen ({enabledClassIds.length} / {COCO_LABELS_DE.length})
        </span>
        {/* Aktion-Buttons: Alle aktivieren / alle deaktivieren */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={enableAll}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15
                       text-white/80 transition-colors"
          >
            Alle
          </button>
          <button
            type="button"
            onClick={disableAll}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15
                       text-white/80 transition-colors"
          >
            Keine
          </button>
        </div>
      </div>

      {/* Gitter aus Klassen-Pills.
          - grid-cols-2 auf Mobile, mehr auf größeren Bildschirmen
          - max-h + overflow-y-auto, damit der Drawer nicht riesig wird */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-64 overflow-y-auto pr-1">
        {sortedIndices.map((classId) => {
          const isEnabled = enabledSet.has(classId);
          return (
            <button
              key={classId}
              type="button"
              onClick={() => toggleClass(classId)}
              aria-pressed={isEnabled}
              // Pill-Look: aktiv = volle Farbe, inaktiv = ausgegraut
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-150
                          text-left truncate
                          ${
                            isEnabled
                              ? 'bg-white/10 border-white/25 text-white'
                              : 'bg-transparent border-white/10 text-white/40 hover:text-white/70'
                          }`}
              title={COCO_LABELS_DE[classId]}
            >
              {COCO_LABELS_DE[classId]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
