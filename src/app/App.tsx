/**
 * ============================================================================
 * App.tsx — Wurzelkomponente der Anwendung
 * ============================================================================
 *
 * Diese Komponente ist der oberste UI-Knoten. Sie entscheidet, ob der
 * Disclaimer noch zu zeigen ist oder ob die eigentliche App freigegeben ist.
 *
 * Logik:
 *   - Hat der Nutzer die AKTUELLE Disclaimer-Version akzeptiert? → App zeigen.
 *   - Sonst                                                       → Disclaimer.
 *
 * Der "App-Inhalt" ist in Phase 2 noch ein Platzhalter — ab Phase 3 wird
 * dort die Kamera-Komponente angezeigt.
 *
 * --- React-Konzept: Conditional Rendering ---
 *
 * In JSX kann man mit dem ternären Operator `condition ? A : B` zwei
 * verschiedene UI-Bäume rendern. Vergleichbar mit Python-Inline-Conditional:
 *   x = "ja" if bedingung else "nein"
 */

import { DisclaimerModal } from '@/components/disclaimer/DisclaimerModal';
import { useDisclaimerStore, selectHasAcceptedCurrent } from '@/stores/disclaimerStore';

/**
 * Wurzelkomponente — entscheidet zwischen Disclaimer und App-Inhalt.
 *
 * @returns JSX-Element des gesamten App-UI-Baums.
 */
export default function App(): JSX.Element {
  // Wir lesen aus dem Store, ob die aktuelle Disclaimer-Version zugestimmt wurde.
  // Der Selector sorgt dafür, dass diese Komponente nur neu rendert, wenn sich
  // genau dieses Boolean-Ergebnis ändert.
  const hasAccepted = useDisclaimerStore(selectHasAcceptedCurrent);

  return (
    // Wurzel-Layout: dunkler Hintergrund, vollflächig.
    <main className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      {/* Conditional Rendering:
          - Wenn NICHT akzeptiert → Disclaimer-Modal anzeigen.
          - Wenn akzeptiert        → App-Platzhalter anzeigen. */}
      {!hasAccepted ? (
        <DisclaimerModal />
      ) : (
        // App-Inhalt — wird in Phase 3 mit Kamera ersetzt.
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <h1 className="text-3xl font-semibold tracking-tight">VisionLab</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Disclaimer akzeptiert — Phase 2 abgeschlossen.
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            In Phase 3 erscheint hier der Kamera-Stream.
          </p>
        </div>
      )}
    </main>
  );
}
