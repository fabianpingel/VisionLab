/**
 * ============================================================================
 * StatsPanel.tsx — Performance-Anzeige im Glassmorphism-Stil
 * ============================================================================
 *
 * Schwebt oben links über dem Kamerabild und zeigt:
 *   - Lade-Status während Initialisierung
 *   - Im Betrieb: FPS groß, Sparkline, Inferenzzeit, Backend, Modell, Detection-Count
 *
 * Designziele:
 *   - Subtil genug, dass es nicht vom Kamerabild ablenkt
 *   - Klar genug, dass der Kunde "Live-Performance" sieht
 *   - "Technisch souverän" — vermittelt: hier läuft echte Hardware-Beschleunigung
 *
 * Die Komponente bekommt alle Daten als Props — sie ist rein deklarativ,
 * keine Store-Anbindung. So lässt sie sich leicht testen.
 */

import type { InferenceStatus } from '@/hooks/useInference';
import type { InferenceBackend, ModelSpec } from '@/inference/types';
import { Sparkline } from './Sparkline';
import { BackendBadge } from './BackendBadge';

/**
 * Props des Stats-Panels.
 */
type StatsPanelProps = {
  status: InferenceStatus;
  error: string | null;
  backend: InferenceBackend | null;
  /** Aktuelle FPS (Mittelwert über das rollende Fenster). */
  fps: number;
  /** FPS-Verlauf (letzte ~30 Werte) für die Sparkline. */
  fpsHistory: number[];
  /** Reine Modell-Inferenzzeit in ms (letzter Frame). */
  inferenceMs: number;
  /** Anzahl aktuell sichtbarer Detektionen. */
  detectionCount: number;
  /** Aktuell geladenes Modell (für Anzeigename). */
  currentModel: ModelSpec | null;
};

/**
 * Liefert einen menschen-lesbaren Status-Text für den Lade-Zustand.
 *
 * @param status Inferenz-Status aus dem Hook.
 * @param error Optionaler Fehlertext (nur bei status === 'error' gesetzt).
 * @returns Anzeige-Text oder null wenn kein Lade-Status anliegt.
 */
function getLoadingMessage(status: InferenceStatus, error: string | null): string | null {
  switch (status) {
    case 'idle':
      return 'Bereit';
    case 'loading-manifest':
      return 'Lade Modell-Liste …';
    case 'spawning-worker':
      return 'Starte Inferenz-Worker …';
    case 'loading-model':
      return 'Lade Modell …';
    case 'error':
      return error ? `Fehler: ${error}` : 'Unbekannter Fehler';
    case 'ready':
      return null; // Im Ready-Zustand zeigt das Panel die echten Stats.
  }
}

/**
 * Performance-Stats-Panel oben links über dem Kamerabild.
 *
 * @param props Siehe StatsPanelProps.
 * @returns JSX-Element.
 */
export function StatsPanel({
  status,
  error,
  backend,
  fps,
  fpsHistory,
  inferenceMs,
  detectionCount,
  currentModel,
}: StatsPanelProps): JSX.Element {
  const loadingMessage = getLoadingMessage(status, error);
  const isError = status === 'error';

  return (
    // Schwebendes Panel — pointer-events-none, damit Touches/Clicks
    // durchgehen ans Video bzw. an die Buttons drumherum.
    <div
      className="absolute top-4 left-4 z-10 pointer-events-none select-none
                 max-w-[200px] sm:max-w-[240px]"
      aria-live="polite"
    >
      <div
        className={`rounded-2xl backdrop-blur-md border
                    px-3.5 py-2.5 shadow-lg
                    ${
                      isError
                        ? 'bg-red-950/70 border-red-400/40 text-red-100'
                        : 'bg-black/55 border-white/10 text-white'
                    }`}
      >
        {/* Lade-Status (wenn nicht ready) */}
        {loadingMessage && (
          <div className="text-xs leading-relaxed">{loadingMessage}</div>
        )}

        {/* Stats-Inhalt nur im Ready-Zustand */}
        {status === 'ready' && (
          <>
            {/* Erste Zeile: große FPS-Zahl + Sparkline rechts daneben */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-1">
                {/* FPS-Wert als prominente Zahl */}
                <span className="text-2xl font-semibold leading-none tabular-nums">
                  {Math.round(fps)}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-white/60">
                  FPS
                </span>
              </div>
              <Sparkline values={fpsHistory} width={70} height={20} />
            </div>

            {/* Backend + Modell-Name in einer Zeile (Phase-8-Polishing) */}
            <div className="flex items-center justify-between gap-2 mt-2 pt-2
                            border-t border-white/10">
              <BackendBadge backend={backend} />
              {currentModel && (
                <span
                  className="text-[10px] text-white/55 truncate"
                  title={currentModel.name}
                >
                  {currentModel.displayName}
                </span>
              )}
            </div>

            {/* Detail-Zeile: Inferenzzeit + Detection-Count */}
            <div className="flex items-center justify-between gap-2 mt-1.5
                            text-[11px] text-white/60 font-mono tabular-nums">
              <span>{inferenceMs.toFixed(0)} ms</span>
              <span>
                {detectionCount} {detectionCount === 1 ? 'Objekt' : 'Objekte'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
