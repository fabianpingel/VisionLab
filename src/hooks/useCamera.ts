/**
 * ============================================================================
 * useCamera.ts — React-Hook für Kamera-Zugriff via getUserMedia
 * ============================================================================
 *
 * Was ist ein "Hook"?
 *   Ein Hook ist eine wiederverwendbare Funktion, die React-State und
 *   Side-Effects in eine Komponente einklinkt. Hooks beginnen IMMER mit
 *   "use" — z.B. useState, useEffect, useRef.
 *
 *   Eigene Hooks (custom hooks) sind nichts anderes als Funktionen, die
 *   andere Hooks aufrufen. Vorteil: Logik ist von der UI getrennt und
 *   wiederverwendbar.
 *
 *   In Python wäre die Analogie ein Context-Manager + Property-Combo:
 *   etwas, das Lifecycle (start/stop) UND Zustand (active/error) bündelt.
 *
 * Warum dieser Hook?
 *   Kamera-Zugriff im Browser ist asynchron, kann mehrere Fehlerzustände
 *   haben (Permission, kein Gerät, ...) und braucht sauberes Aufräumen
 *   (Stream-Tracks stoppen). Diesen Kram packen wir in einen Hook, damit
 *   die UI-Komponente sich nur um Darstellung kümmern muss.
 *
 * --- getUserMedia-Konzepte kurz erklärt ---
 *
 * navigator.mediaDevices.getUserMedia(constraints) gibt eine Promise<MediaStream>.
 * Ein MediaStream besteht aus Tracks (Video-Track, Audio-Track).
 * Wir fordern AUSSCHLIESSLICH Video an (audio: false) — kein Audio jemals!
 *
 * "Constraints" sind die Wunsch-Einstellungen:
 *   { video: { facingMode: 'environment', width: { ideal: 1280 } } }
 *
 * facingMode:
 *   'user'        → Frontkamera (Selfie)
 *   'environment' → Rückkamera (Welt) — Default für Objekterkennung
 */

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Mögliche Zustände des Kamera-Hooks.
 *
 * - idle:       Initial — noch nicht versucht.
 * - requesting: getUserMedia läuft — Browser fragt Erlaubnis.
 * - granted:    Stream läuft.
 * - denied:     Nutzer hat Erlaubnis verweigert.
 * - error:      Sonstiger Fehler (keine Kamera vorhanden, Hardware-Fehler).
 */
export type CameraStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

/**
 * Richtung der Kamera.
 *
 * - user:        Frontkamera (vorne, Richtung Nutzer).
 * - environment: Rückkamera (hinten, Richtung Umgebung).
 */
export type FacingMode = 'user' | 'environment';

/**
 * Rückgabewert des Hooks — alles, was die UI-Komponente braucht.
 */
export type UseCameraReturn = {
  /** Der aktive MediaStream oder null, wenn nicht aktiv. */
  stream: MediaStream | null;
  /** Aktueller Status der Kamera. */
  status: CameraStatus;
  /** Letzter Fehler (falls vorhanden) — für Debug-Anzeige. */
  error: Error | null;
  /** Aktive Kamera-Richtung. */
  facingMode: FacingMode;
  /** Startet die Kamera (oder schaltet auf die neue Richtung um). */
  start: (facing?: FacingMode) => Promise<void>;
  /** Stoppt die Kamera und gibt den Stream frei. */
  stop: () => void;
  /** Wechselt zwischen Front- und Rückkamera. */
  switchFacing: () => Promise<void>;
};

/**
 * Optionen für den Hook.
 */
export type UseCameraOptions = {
  /** Initiale Kamera-Richtung. Default: 'environment' (Rückkamera). */
  initialFacing?: FacingMode;
  /** Wunsch-Auflösung — Browser darf abweichen falls nicht verfügbar. */
  idealResolution?: {
    width: number;
    height: number;
  };
};

/**
 * Baut das Constraints-Objekt für getUserMedia.
 *
 * Wir trennen das in eine reine Funktion, weil sie:
 *   1. Leicht testbar ist (keine React-Hooks darin).
 *   2. Konfigurations-Änderungen an einer Stelle.
 *
 * @param facing Gewünschte Kamera-Richtung.
 * @param resolution Wunsch-Auflösung (ideal).
 * @returns MediaStreamConstraints-Objekt für getUserMedia.
 */
export function buildConstraints(
  facing: FacingMode,
  resolution: { width: number; height: number },
): MediaStreamConstraints {
  return {
    // WICHTIG: audio: false — niemals Audio aufzeichnen (DSGVO-Hygiene).
    audio: false,
    video: {
      // facingMode als "ideal" statt "exact": Browser darf alternative
      // Kamera nehmen, falls die gewünschte nicht existiert (z.B. Desktop
      // hat nur eine Webcam).
      facingMode: { ideal: facing },
      width: { ideal: resolution.width },
      height: { ideal: resolution.height },
    },
  };
}

/**
 * Stoppt alle Tracks eines MediaStreams.
 *
 * Wichtig: Wenn man einen Stream nicht mehr braucht, MÜSSEN die Tracks
 * gestoppt werden — sonst bleibt die Kamera aktiv (rote Aufnahme-LED
 * leuchtet weiter, Stromverbrauch). Garbage-Collection reicht NICHT.
 *
 * @param stream Der zu stoppende MediaStream (oder null).
 */
function stopStreamTracks(stream: MediaStream | null): void {
  if (!stream) return;
  // forEach iteriert über die Tracks (Video + Audio falls vorhanden).
  // stop() ist die explizite Freigabe-Methode der WebRTC-API.
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * React-Hook für Kamera-Zugriff.
 *
 * @param options Optionale Konfiguration.
 * @returns Stream, Status, Methoden — siehe UseCameraReturn.
 *
 * @example
 * const { stream, status, start, switchFacing } = useCamera();
 * useEffect(() => { start(); }, []);
 */
export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { initialFacing = 'environment', idealResolution = { width: 1280, height: 720 } } =
    options;

  // --- React-State (löst Re-Renders der nutzenden Komponente aus) ---
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>(initialFacing);

  // --- useRef = Referenz, die KEINEN Re-Render auslöst ---
  // Wir merken uns den aktuellen Stream als Ref, damit der Cleanup-Effect
  // beim Unmount den richtigen Stream stoppen kann (auch wenn State
  // bereits zurückgesetzt wurde).
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Startet die Kamera mit der gewünschten Richtung.
   *
   * `useCallback` memoiziert die Funktion, damit Identität stabil bleibt —
   * sonst würde jedes Re-Render eine NEUE Funktion erzeugen, und useEffect-
   * Abhängigkeiten in Konsumenten würden ständig neu feuern.
   *
   * In Python wäre das vergleichbar mit einem @cache-Dekorator.
   */
  const start = useCallback(
    async (facing?: FacingMode): Promise<void> => {
      const targetFacing = facing ?? facingMode;
      setStatus('requesting');
      setError(null);

      // Vor dem neuen Stream den alten freigeben (falls vorhanden).
      stopStreamTracks(streamRef.current);
      streamRef.current = null;

      try {
        // getUserMedia ist async — wirft bei Permission-Denied oder
        // wenn keine Kamera vorhanden ist.
        const constraints = buildConstraints(targetFacing, idealResolution);
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);

        // Erfolg: Stream merken und State aktualisieren.
        streamRef.current = newStream;
        setStream(newStream);
        setFacingMode(targetFacing);
        setStatus('granted');
      } catch (err) {
        // getUserMedia kann verschiedene DOMException-Namen werfen.
        // Wir interessieren uns vor allem für NotAllowedError = "User Denied".
        const error = err as Error;
        if (
          error.name === 'NotAllowedError' ||
          error.name === 'PermissionDeniedError'
        ) {
          setStatus('denied');
        } else {
          // Andere Fehler: NotFoundError (keine Kamera), NotReadableError
          // (Kamera durch andere App belegt), OverconstrainedError, ...
          setStatus('error');
        }
        setError(error);
        setStream(null);
      }
    },
    // Abhängigkeiten: idealResolution-Inhalt + facingMode-Default.
    // Wir nehmen NICHT facingMode direkt in die deps — sonst würde sich
    // start() bei jedem Switch ändern. Stattdessen lesen wir es bei Aufruf.
    [facingMode, idealResolution],
  );

  /**
   * Stoppt die Kamera und setzt den State zurück.
   */
  const stop = useCallback((): void => {
    stopStreamTracks(streamRef.current);
    streamRef.current = null;
    setStream(null);
    setStatus('idle');
    setError(null);
  }, []);

  /**
   * Wechselt zwischen Front- und Rückkamera.
   * Funktioniert nur, wenn aktuell ein Stream läuft.
   */
  const switchFacing = useCallback(async (): Promise<void> => {
    const newFacing: FacingMode = facingMode === 'user' ? 'environment' : 'user';
    await start(newFacing);
  }, [facingMode, start]);

  /**
   * Cleanup beim Unmount der nutzenden Komponente.
   *
   * useEffect mit leerem dependency-Array läuft nur einmal:
   *   - Erste Render: Effect-Body läuft (hier leer).
   *   - Unmount: Return-Funktion läuft (= Cleanup).
   *
   * Das ist DIE Methode in React, um Ressourcen sauber freizugeben.
   */
  useEffect(() => {
    return () => {
      // Bei Komponent-Unmount: Stream stoppen.
      // streamRef nutzen (nicht stream-State), weil der State eventuell
      // schon stale ist.
      stopStreamTracks(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  return {
    stream,
    status,
    error,
    facingMode,
    start,
    stop,
    switchFacing,
  };
}
