/**
 * ============================================================================
 * settingsStore.ts — Persistenter Store für UI-Einstellungen
 * ============================================================================
 *
 * Was wird hier gehalten?
 *   - confidenceThreshold: Minimum-Score für eine Detection (0..1)
 *   - iouThreshold:        Schwelle für Non-Max-Suppression (0..1)
 *   - enabledClassIds:     Welche COCO-Klassen sollen angezeigt werden?
 *   - selectedModelId:     ID des aktuell geladenen Modells
 *
 * Persistenz: localStorage (über Zustand-`persist`-Middleware).
 * Bei Browser-Neustart bleiben die Settings erhalten.
 *
 * Hinweis zur Set-Serialisierung:
 *   localStorage kann nur JSON speichern — JS-Sets werden dabei zu {}.
 *   Daher speichern wir enabledClassIds als number[] (sortiert), und
 *   bauen das Set bei Bedarf zur Laufzeit auf (Selector-Helfer unten).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** Standardwerte — werden initial verwendet und beim Reset wiederhergestellt. */
const DEFAULT_CONFIDENCE = 0.45;
const DEFAULT_IOU = 0.45;

/** 80 COCO-Klassen sind initial alle aktiv. */
const ALL_COCO_CLASSES: number[] = Array.from({ length: 80 }, (_, i) => i);

/**
 * Typ des Store-Zustands.
 */
type SettingsState = {
  confidenceThreshold: number;
  iouThreshold: number;
  /** Sortiertes Array der aktivierten Klassen-IDs. */
  enabledClassIds: number[];
  /** ID des aktuell ausgewählten Modells oder null (initial). */
  selectedModelId: string | null;

  // --- Aktionen ---
  setConfidenceThreshold: (value: number) => void;
  setIouThreshold: (value: number) => void;
  /** Aktivierungszustand einer einzelnen Klasse umschalten. */
  toggleClass: (classId: number) => void;
  /** Alle Klassen auf einmal aktivieren. */
  enableAllClasses: () => void;
  /** Alle Klassen deaktivieren. */
  disableAllClasses: () => void;
  setSelectedModelId: (modelId: string) => void;
  /** Alles auf Default zurücksetzen. */
  reset: () => void;
};

/**
 * Globaler Settings-Hook.
 *
 * @example
 *   const conf = useSettingsStore((s) => s.confidenceThreshold);
 *   const setConf = useSettingsStore((s) => s.setConfidenceThreshold);
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      confidenceThreshold: DEFAULT_CONFIDENCE,
      iouThreshold: DEFAULT_IOU,
      enabledClassIds: ALL_COCO_CLASSES.slice(),
      selectedModelId: null,

      setConfidenceThreshold: (value) => set({ confidenceThreshold: clamp01(value) }),
      setIouThreshold: (value) => set({ iouThreshold: clamp01(value) }),

      toggleClass: (classId) =>
        set((state) => {
          const isEnabled = state.enabledClassIds.includes(classId);
          // Funktional: bei Toggle bauen wir ein neues Array, damit
          // React/Zustand den Wechsel als State-Update erkennt.
          const next = isEnabled
            ? state.enabledClassIds.filter((id) => id !== classId)
            : [...state.enabledClassIds, classId].sort((a, b) => a - b);
          return { enabledClassIds: next };
        }),

      enableAllClasses: () => set({ enabledClassIds: ALL_COCO_CLASSES.slice() }),
      disableAllClasses: () => set({ enabledClassIds: [] }),

      setSelectedModelId: (modelId) => set({ selectedModelId: modelId }),

      reset: () =>
        set({
          confidenceThreshold: DEFAULT_CONFIDENCE,
          iouThreshold: DEFAULT_IOU,
          enabledClassIds: ALL_COCO_CLASSES.slice(),
          selectedModelId: null,
        }),
    }),
    {
      name: 'visionlab.settings.v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * Hilfsfunktion: erzwingt einen Wert auf das Intervall [0, 1].
 *
 * @param value Beliebige Zahl.
 * @returns Wert geclippt auf 0..1.
 */
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Selector-Helfer: liefert das enabledClassIds-Array als Set zurück.
 *
 * Set ist für Lookups O(1), aber localStorage kann es nicht speichern.
 * Daher wandeln wir hier zur Laufzeit um.
 *
 * @param state Store-State.
 * @returns Set<number> der aktivierten Klassen-IDs.
 */
export function selectEnabledClassIdSet(state: SettingsState): Set<number> {
  return new Set(state.enabledClassIds);
}
