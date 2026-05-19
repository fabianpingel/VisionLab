/**
 * ============================================================================
 * App.tsx — Wurzelkomponente der Anwendung
 * ============================================================================
 *
 * Diese Komponente entscheidet, welcher Hauptbildschirm angezeigt wird:
 *
 *   - Disclaimer noch nicht akzeptiert → DisclaimerModal
 *   - Disclaimer akzeptiert            → CameraView (Live-Stream)
 *
 * Ab Phase 3 ist die Kamera-Ansicht der "App-Inhalt". In späteren Phasen
 * legen wir hier ein Overlay (Bounding Boxes, Stats-Pille, Controls) drüber.
 *
 * --- React-Konzept: Conditional Rendering ---
 *
 * In JSX rendert man verschiedene UI-Bäume mit dem ternären Operator
 * `condition ? A : B`. Vergleichbar mit Python-Inline-Conditional:
 *   x = A if bedingung else B
 */

import { DisclaimerModal } from '@/components/disclaimer/DisclaimerModal';
import { CameraView } from '@/components/camera/CameraView';
import { useDisclaimerStore, selectHasAcceptedCurrent } from '@/stores/disclaimerStore';

/**
 * Wurzelkomponente — Disclaimer-Gate vor der Kamera-Ansicht.
 *
 * @returns JSX-Element des gesamten App-UI-Baums.
 */
export default function App(): JSX.Element {
  // Hat der Nutzer die aktuelle Disclaimer-Version akzeptiert?
  const hasAccepted = useDisclaimerStore(selectHasAcceptedCurrent);

  return (
    // Wurzel-Layout: vollflächig, Brand-Hintergrund (tiefes Navy aus den Design-Tokens).
    <main className="min-h-screen w-full bg-background text-white font-sans">
      {hasAccepted ? <CameraView /> : <DisclaimerModal />}
    </main>
  );
}
