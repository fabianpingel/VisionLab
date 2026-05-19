/**
 * ============================================================================
 * ModelPicker.tsx — Auswahl des aktiven KI-Modells
 * ============================================================================
 *
 * Listet alle verfügbaren Modelle aus der Manifest-Datei als Radio-Buttons.
 * Beim Wechsel ruft die Komponente den onSwitch-Handler des Parents auf,
 * der dann den Worker anweist, das neue Modell zu laden.
 *
 * Warum nicht direkt aus dem Settings-Store schreiben?
 *   Der Modell-Switch hat einen Side-Effect (Worker neu lädt), den der
 *   useInference-Hook orchestriert. Daher heben wir den Callback nach oben
 *   ("lifted state"). Die Selection-Anzeige (welches Modell IST gerade aktiv)
 *   bekommt sie als Prop.
 */

import type { ModelSpec } from '@/inference/types';

/**
 * Props des ModelPicker.
 */
type ModelPickerProps = {
  /** Liste verfügbarer Modelle (aus dem Manifest). */
  models: ModelSpec[];
  /** ID des aktuell aktiven Modells. */
  currentModelId: string | null;
  /** Callback bei Modell-Wechsel. */
  onSwitch: (modelId: string) => void;
};

/**
 * Modell-Auswahl als Radio-Group.
 *
 * @param props.models Alle verfügbaren Modelle.
 * @param props.currentModelId Aktiv markiert in der UI.
 * @param props.onSwitch Wird beim User-Klick mit der gewählten ID aufgerufen.
 */
export function ModelPicker({
  models,
  currentModelId,
  onSwitch,
}: ModelPickerProps): JSX.Element {
  // Wenn das Manifest leer ist, zeigen wir einen Hinweis.
  if (models.length === 0) {
    return (
      <p className="text-sm text-white/50">Keine Modelle verfügbar.</p>
    );
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-white/90 mb-2">
        Modell
      </legend>
      {/* role="radiogroup" wird durch <fieldset>+<input type="radio"> bereits
          implizit gesetzt — keine zusätzlichen ARIA-Attribute nötig. */}
      <div className="space-y-1.5">
        {models.map((model) => {
          // ID-Vergleich: prüft, ob diese Karte das aktive Modell darstellt.
          const isActive = model.id === currentModelId;

          return (
            <label
              key={model.id}
              // flex-Layout: Radio links, Beschriftung daneben.
              // hover/active wirken am ganzen Label (touch-friendly).
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer
                          transition-all duration-150
                          ${
                            isActive
                              ? 'bg-white/10 border-white/30'
                              : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                          }`}
            >
              <input
                type="radio"
                name="model-picker"
                value={model.id}
                checked={isActive}
                onChange={() => onSwitch(model.id)}
                className="mt-1 accent-white cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                {/* Anzeigename + Größe in derselben Zeile */}
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-white">
                    {model.displayName}
                  </span>
                  <span className="text-xs text-white/50 font-mono">
                    {formatBytes(model.sizeBytes)}
                  </span>
                </div>
                {/* Beschreibung (klein, dezent) */}
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  {model.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Hilfsfunktion: Bytes in eine lesbare Form bringen.
 *
 * @param bytes Anzahl Bytes.
 * @returns Z.B. "10.7 MB".
 */
function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  }
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}
