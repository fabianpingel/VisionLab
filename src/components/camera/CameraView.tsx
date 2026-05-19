/**
 * ============================================================================
 * CameraView.tsx — Vollflächige Kamera-Ansicht mit Inferenz-Anbindung
 * ============================================================================
 *
 * Diese Komponente:
 *   - Startet beim Mount automatisch die Kamera (useCamera-Hook)
 *   - Bindet den MediaStream an ein <video>-Element
 *   - Startet parallel die Inferenz-Pipeline (useInference)
 *   - Zeigt je nach Permission-Zustand unterschiedliche UI:
 *       requesting → Hinweis "Kamera wird gestartet …"
 *       granted    → Vollflächiges Video + Inferenz-Stats
 *       denied     → Hinweis "Erlaubnis verweigert" + Erklärung
 *       error      → Generische Fehlermeldung
 *
 * Phase 5: Bounding Boxes werden NOCH NICHT gezeichnet — wir zeigen aber
 * eine kleine Debug-Pille mit FPS und Detection-Count, damit wir
 * verifizieren können, dass die Inferenz tatsächlich läuft.
 * Das hübsche Box-Overlay kommt in Phase 6.
 */

import { useEffect, useRef } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useInference } from '@/hooks/useInference';
import { Button } from '@/components/ui/Button';
import { BoxOverlay } from '@/components/overlay/BoxOverlay';

/**
 * Komponente, die das Kamerabild vollflächig darstellt und Inferenz fährt.
 *
 * @returns JSX-Element der Kamera-Ansicht.
 */
export function CameraView(): JSX.Element {
  // Kamera-Hook
  const { stream, status: camStatus, error: camError, facingMode, start, switchFacing } =
    useCamera({ initialFacing: 'environment' });

  // Ref auf das <video>-Element für die Stream-Bindung.
  const videoRef = useRef<HTMLVideoElement>(null);

  // Inferenz-Hook. Wird aktiviert, sobald die Kamera läuft.
  const {
    status: infStatus,
    error: infError,
    backend,
    detections,
    fps,
    inferenceMs,
    currentModelId,
  } = useInference({
    videoRef,
    enabled: camStatus === 'granted',
  });

  /**
   * Beim ersten Render der Komponente: Kamera starten.
   */
  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Wenn sich der Stream ändert: an das <video>-Element binden.
   */
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // --- UI-Auswahl je nach Kamera-Status ---

  if (camStatus === 'requesting' || camStatus === 'idle') {
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

  if (camStatus === 'denied') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-6">
        <h2 className="text-xl font-semibold mb-3">Kamera-Erlaubnis fehlt</h2>
        <p className="text-sm text-white/70 text-center max-w-md leading-relaxed">
          Diese Demo benötigt Zugriff auf die Kamera, um Objekte erkennen zu können.
          Bitte erlauben Sie den Zugriff in den Browser-Einstellungen für diese Seite
          und laden Sie die Seite anschließend neu.
        </p>
        <Button variant="primary" className="mt-6" onClick={() => start()}>
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (camStatus === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-6">
        <h2 className="text-xl font-semibold mb-3">Kamera nicht verfügbar</h2>
        <p className="text-sm text-white/70 text-center max-w-md leading-relaxed">
          Es konnte keine Kamera initialisiert werden. Möglicherweise ist keine
          Kamera angeschlossen oder wird gerade von einer anderen Anwendung verwendet.
        </p>
        {camError && (
          <p className="text-xs text-white/40 mt-3 font-mono">
            {camError.name}: {camError.message}
          </p>
        )}
        <Button variant="secondary" className="mt-6" onClick={() => start()}>
          Erneut versuchen
        </Button>
      </div>
    );
  }

  // camStatus === 'granted' — Stream läuft, Video + Stats anzeigen.
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Video-Stream im Hintergrund */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover ${
          facingMode === 'user' ? 'scale-x-[-1]' : ''
        }`}
      />

      {/* Bounding-Box-Overlay über dem Video (Phase 6).
          mirror=true bei Frontkamera — Overlay-Mathematik kompensiert die
          CSS-Spiegelung, damit Boxen über den richtigen Objekten landen. */}
      <BoxOverlay
        videoRef={videoRef}
        detections={detections}
        mirror={facingMode === 'user'}
      />

      {/* Inferenz-Status-Pille (oben links) — Phase-5-Debug-Anzeige.
          Wird in Phase 8 durch ein schöneres Stats-Panel ersetzt. */}
      <div className="absolute top-4 left-4 px-3 py-2 rounded-2xl
                      bg-black/60 backdrop-blur-md border border-white/10
                      text-xs text-white font-mono leading-relaxed
                      pointer-events-none select-none">
        {/* Status-Zeile */}
        {infStatus === 'loading-manifest' && <div>Lade Modell-Liste …</div>}
        {infStatus === 'spawning-worker' && <div>Starte Inferenz-Worker …</div>}
        {infStatus === 'loading-model' && <div>Lade Modell …</div>}
        {infStatus === 'error' && (
          <div className="text-red-300">Fehler: {infError}</div>
        )}
        {infStatus === 'ready' && (
          <>
            <div>{Math.round(fps)} FPS · {inferenceMs.toFixed(0)} ms</div>
            <div className="text-white/60">{backend?.toUpperCase()} · {currentModelId}</div>
            <div className="text-white/40">{detections.length} Detektion(en)</div>
          </>
        )}
      </div>

      {/* Kamera-Switch-Button: schwebend unten rechts */}
      <button
        type="button"
        onClick={switchFacing}
        aria-label={
          facingMode === 'environment'
            ? 'Zur Frontkamera wechseln'
            : 'Zur Rückkamera wechseln'
        }
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full
                   bg-white/10 backdrop-blur-glass border border-white/20
                   flex items-center justify-center text-white
                   hover:bg-white/15 active:scale-95
                   transition-all duration-200 shadow-lg"
      >
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
