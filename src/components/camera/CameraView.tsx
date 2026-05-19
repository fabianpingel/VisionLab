/**
 * ============================================================================
 * CameraView.tsx — Vollflächige Kamera-Ansicht mit Status-Behandlung
 * ============================================================================
 *
 * Diese Komponente:
 *   - Startet beim Mount automatisch die Kamera (useCamera-Hook)
 *   - Bindet den MediaStream an ein <video>-Element
 *   - Zeigt je nach Permission-Zustand unterschiedliche UI:
 *       requesting → Hinweis "Kamera wird gestartet …"
 *       granted    → Vollflächiges Video + Switch-Button
 *       denied     → Hinweis "Erlaubnis verweigert" + Erklärung
 *       error      → Generische Fehlermeldung
 *
 * --- React-Konzept: useRef für DOM-Zugriff ---
 *
 * In klassischem HTML/JS würde man `document.getElementById(...)` nutzen.
 * In React greift man stattdessen mit `useRef` auf ein DOM-Element zu:
 *
 *   const videoRef = useRef<HTMLVideoElement>(null);
 *   ...
 *   <video ref={videoRef} ... />
 *
 * Beim Mount setzt React `videoRef.current` auf das echte <video>-Element.
 * So können wir z.B. `videoRef.current.srcObject = stream` setzen.
 */

import { useEffect, useRef } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { Button } from '@/components/ui/Button';

/**
 * Komponente, die das Kamerabild vollflächig darstellt.
 *
 * Nimmt keine Props entgegen — sie ist ein in sich abgeschlossener Baustein,
 * der bei Mount automatisch die Kamera anfordert.
 *
 * @returns JSX-Element der Kamera-Ansicht.
 */
export function CameraView(): JSX.Element {
  // Hook aufrufen — die gesamte Kamera-Logik kommt aus diesem Aufruf.
  const { stream, status, error, facingMode, start, switchFacing } = useCamera({
    initialFacing: 'environment',
  });

  // Referenz auf das <video>-Element für die Stream-Bindung.
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Beim ersten Render der Komponente: Kamera starten.
   *
   * Das leere dependency-Array [] sorgt dafür, dass dieser Effect NUR EINMAL
   * läuft (analog zu `if __name__ == "__main__":`-Block in Python, nur dass
   * es beim Komponenten-Mount läuft).
   */
  useEffect(() => {
    start();
    // Cleanup wird vom useCamera-Hook selbst beim Unmount erledigt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Wenn sich der Stream ändert: an das <video>-Element binden.
   *
   * Hier nutzen wir `srcObject` statt `src` — das ist der moderne Weg,
   * MediaStreams (nicht URLs) ans Video zu hängen.
   */
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // --- UI-Auswahl je nach Status ---

  if (status === 'requesting' || status === 'idle') {
    // Anzeige während die Permission noch verhandelt wird.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-6">
        <div className="animate-pulse text-sm text-white/70">
          Kamera wird gestartet …
        </div>
        <p className="text-xs text-white/40 mt-3 text-center max-w-sm">
          Bitte erteilen Sie die Kamera-Erlaubnis im Browser, sobald die Abfrage erscheint.
        </p>
      </div>
    );
  }

  if (status === 'denied') {
    // Permission verweigert — Erklärung + Retry-Button.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-6">
        <h2 className="text-xl font-semibold mb-3">Kamera-Erlaubnis fehlt</h2>
        <p className="text-sm text-white/70 text-center max-w-md leading-relaxed">
          Diese Demo benötigt Zugriff auf die Kamera, um Objekte erkennen zu können.
          Bitte erlauben Sie den Zugriff in den Browser-Einstellungen für diese Seite
          und laden Sie die Seite anschließend neu.
        </p>
        <Button
          variant="primary"
          className="mt-6"
          onClick={() => start()}
        >
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (status === 'error') {
    // Sonstiger Fehler — z.B. keine Kamera, Hardware-Konflikt.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-6">
        <h2 className="text-xl font-semibold mb-3">Kamera nicht verfügbar</h2>
        <p className="text-sm text-white/70 text-center max-w-md leading-relaxed">
          Es konnte keine Kamera initialisiert werden. Möglicherweise ist keine
          Kamera angeschlossen oder wird gerade von einer anderen Anwendung verwendet.
        </p>
        {error && (
          <p className="text-xs text-white/40 mt-3 font-mono">
            {error.name}: {error.message}
          </p>
        )}
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => start()}
        >
          Erneut versuchen
        </Button>
      </div>
    );
  }

  // status === 'granted' — Stream läuft, Video anzeigen.
  return (
    // Wurzel: Vollbild, schwarzer Hintergrund (falls Video-Aspect nicht passt).
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Das Video-Element:
          - autoPlay startet das Abspielen sobald srcObject gesetzt ist
          - muted ist Pflicht für autoPlay in iOS Safari
          - playsInline verhindert Vollbild-Übernahme durch iOS Safari
          - object-cover sorgt für vollflächigen Fit (mit ggf. leichtem Crop)
          - Die Front-Kamera spiegeln wir, weil Nutzer das so erwarten
            (Selfie-Mirror) */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover ${
          facingMode === 'user' ? 'scale-x-[-1]' : ''
        }`}
      />

      {/* Kamera-Switch-Button: schwebend unten rechts.
          Glaspille als Tap-Target — Touch-freundlich groß (>= 44 px). */}
      <button
        type="button"
        onClick={switchFacing}
        aria-label={
          facingMode === 'environment' ? 'Zur Frontkamera wechseln' : 'Zur Rückkamera wechseln'
        }
        // Glas-Look + Position
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full
                   bg-white/10 backdrop-blur-glass border border-white/20
                   flex items-center justify-center text-white
                   hover:bg-white/15 active:scale-95
                   transition-all duration-200 shadow-lg"
      >
        {/* Inline-SVG-Icon (Kamera-Tausch-Pfeil).
            Quelle: Heroicons "arrows-right-left" — frei (MIT). */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
          />
        </svg>
      </button>
    </div>
  );
}
