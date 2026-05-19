/**
 * ============================================================================
 * useInference.ts — React-Hook für die Inferenz-Pipeline
 * ============================================================================
 *
 * Dieser Hook orchestriert das Zusammenspiel zwischen UI (Main-Thread) und
 * dem Inferenz-Worker:
 *   1. Lädt das Modell-Manifest (Liste verfügbarer Modelle).
 *   2. Spawn-t den Web-Worker.
 *   3. Lädt das initial gewählte Modell.
 *   4. Startet die Frame-Pump (rendert pro animationFrame eine Inferenz an).
 *   5. Empfängt Detektionen vom Worker und stellt sie als State zur Verfügung.
 *
 * --- Frame-Pump-Strategie: Drop, nicht Queue ---
 *
 * Wenn der Worker noch am Vorgänger-Frame arbeitet und ein neuer Frame
 * kommt: Wir schicken NICHT, sondern überspringen den Frame.
 *
 * Warum?
 *   - Queue-Strategie: Frames stauen sich, Latenz wächst → ruckelt sich auf
 *   - Drop-Strategie: konstante Latenz, etwas weniger FPS, aber "live"-Feeling
 *
 * Bei 30 ms Inferenzzeit kommen wir auf ~30 FPS — das ist für die meisten
 * Anwendungsfälle deutlich genug.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
// Vite-Spezial: das ?worker-Suffix sagt Vite "bundle das als Web-Worker".
// Der Default-Export ist eine Klasse, die mit `new` einen Worker erzeugt.
import InferenceWorker from '@/inference/worker?worker';
import { preprocessFrame } from '@/inference/preprocess';
import type {
  Detection,
  InferenceBackend,
  ModelManifest,
  ModelSpec,
  WorkerToMainMessage,
} from '@/inference/types';

/**
 * Mögliche Zustände des Hooks (für die Status-Anzeige im UI).
 */
export type InferenceStatus =
  | 'idle'             // Hook gerade montiert, noch nichts initialisiert
  | 'loading-manifest' // Modell-Liste wird geladen
  | 'spawning-worker'  // Worker wird gestartet
  | 'loading-model'    // Modell-Datei wird in den Worker geladen
  | 'ready'            // Bereit für Inferenz
  | 'error';           // Fehlerzustand

/**
 * Optionen für den Hook.
 */
export type UseInferenceOptions = {
  /** Ref auf das <video>-Element, von dem Frames gelesen werden. */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Aktiv? Wenn false → Pump pausiert. */
  enabled: boolean;
};

/**
 * Rückgabewert des Hooks.
 */
export type UseInferenceReturn = {
  status: InferenceStatus;
  error: string | null;
  /** Aktives Backend ('webgpu' oder 'wasm'). */
  backend: InferenceBackend | null;
  /** Liste verfügbarer Modelle (aus manifest.json). */
  availableModels: ModelSpec[];
  /** ID des aktuell geladenen Modells. */
  currentModelId: string | null;
  /** Aktuelle Detektionen (vom Worker). */
  detections: Detection[];
  /** Rollender FPS-Mittelwert. */
  fps: number;
  /** Letzte reine Modell-Inferenzzeit in ms. */
  inferenceMs: number;
  /** Wechselt aktiv das geladene Modell. */
  switchModel: (modelId: string) => void;
};

/**
 * Pfad zum Manifest auf dem Server.
 * Vite serviert public/-Dateien unter `/`.
 */
const MANIFEST_URL = '/models/manifest.json';

/** Wie viele Frame-Zeiten halten wir für den FPS-Mittelwert vor? */
const FPS_WINDOW_SIZE = 30;

/**
 * React-Hook für die Inferenz-Pipeline.
 *
 * @param options Konfiguration (videoRef + enabled).
 * @returns Aktueller Status, Detektionen, Stats und Modell-Switcher.
 */
export function useInference(options: UseInferenceOptions): UseInferenceReturn {
  const { videoRef, enabled } = options;

  // --- Reactive State (löst Re-Renders aus) ---
  const [status, setStatus] = useState<InferenceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [backend, setBackend] = useState<InferenceBackend | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelSpec[]>([]);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [fps, setFps] = useState<number>(0);
  const [inferenceMs, setInferenceMs] = useState<number>(0);

  // --- Refs (NICHT reaktiv, persistieren zwischen Renders) ---
  // Worker-Instanz — wird einmalig angelegt.
  const workerRef = useRef<Worker | null>(null);
  // Wiederverwendbares OffscreenCanvas für Preprocessing.
  const canvasRef = useRef<OffscreenCanvas | null>(null);
  // Modell-Spezifikation des aktuell geladenen Modells.
  const currentModelSpecRef = useRef<ModelSpec | null>(null);
  // Flag: arbeitet der Worker gerade an einem Frame?
  const isProcessingRef = useRef<boolean>(false);
  // Monotone Frame-ID, damit verspätete Antworten ignoriert werden können.
  const nextFrameIdRef = useRef<number>(0);
  // requestAnimationFrame-Handle für Cleanup.
  const rafHandleRef = useRef<number | null>(null);
  // Frame-Zeitpunkte für FPS-Berechnung.
  const frameTimestampsRef = useRef<number[]>([]);
  // Spiegelt den aktuellen Status, damit Closures (im RAF-Loop) immer
  // den frischen Wert lesen ohne neue Loops zu starten.
  const statusRef = useRef<InferenceStatus>('idle');
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  /**
   * Lädt das Manifest von /models/manifest.json.
   */
  const loadManifest = useCallback(async (): Promise<ModelSpec[]> => {
    setStatus('loading-manifest');
    const response = await fetch(MANIFEST_URL);
    if (!response.ok) {
      throw new Error(`Manifest-Ladung fehlgeschlagen: HTTP ${response.status}`);
    }
    const manifest = (await response.json()) as ModelManifest;
    return manifest.models;
  }, []);

  /**
   * Schickt einen Load-Model-Auftrag an den Worker.
   */
  const sendLoadModel = useCallback((spec: ModelSpec): void => {
    if (!workerRef.current) return;
    setStatus('loading-model');
    // Modell-URL relativ zum public/-Stamm.
    const modelUrl = `/models/${spec.path}`;
    workerRef.current.postMessage({
      type: 'load-model',
      modelSpec: spec,
      modelUrl,
    });
    currentModelSpecRef.current = spec;
    setCurrentModelId(spec.id);
  }, []);

  /**
   * Modell-Switch von außen (UI-Action).
   */
  const switchModel = useCallback(
    (modelId: string): void => {
      const spec = availableModels.find((m) => m.id === modelId);
      if (spec) {
        // Vorher pending Inferenzen "abräumen" — alte Antworten werden
        // dann durch Frame-ID-Check ignoriert.
        isProcessingRef.current = false;
        nextFrameIdRef.current += 1000; // Sprung, damit alte IDs verworfen werden
        sendLoadModel(spec);
      }
    },
    [availableModels, sendLoadModel],
  );

  /**
   * Empfangs-Handler für Worker-Nachrichten.
   */
  const onWorkerMessage = useCallback((ev: MessageEvent<WorkerToMainMessage>): void => {
    const msg = ev.data;
    switch (msg.type) {
      case 'ready':
        setBackend(msg.backend);
        // Sobald Worker bereit ist: erstes Modell laden (das erste
        // im Manifest, kann später per UI gewechselt werden).
        if (availableModelsRef.current.length > 0) {
          sendLoadModel(availableModelsRef.current[0]);
        }
        break;
      case 'model-loaded':
        setStatus('ready');
        setError(null);
        break;
      case 'inference-result':
        isProcessingRef.current = false;
        // FPS-Berechnung: Zeitstempel ins rollende Fenster eintragen
        // und durch die Spannweite teilen.
        {
          const now = performance.now();
          const window = frameTimestampsRef.current;
          window.push(now);
          if (window.length > FPS_WINDOW_SIZE) {
            window.shift();
          }
          if (window.length >= 2) {
            const span = window[window.length - 1] - window[0];
            const frames = window.length - 1;
            setFps((frames * 1000) / span);
          }
        }
        setInferenceMs(msg.inferenceMs);
        setDetections(msg.detections);
        break;
      case 'error':
        setStatus('error');
        setError(msg.message);
        isProcessingRef.current = false;
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Spiegelt availableModels in einer Ref, damit der ready-Handler den
  // aktuellen Wert sieht (Closure würde sonst alten Wert lesen).
  const availableModelsRef = useRef<ModelSpec[]>([]);
  useEffect(() => {
    availableModelsRef.current = availableModels;
  }, [availableModels]);

  /**
   * Initial-Effect: Manifest laden, Worker spawnen, Modell laden.
   *
   * Läuft nur einmal pro Hook-Lebenszyklus.
   */
  useEffect(() => {
    let cancelled = false;

    (async (): Promise<void> => {
      try {
        // Schritt 1: Manifest holen
        const models = await loadManifest();
        if (cancelled) return;
        setAvailableModels(models);
        availableModelsRef.current = models;

        // Schritt 2: Worker spawnen
        setStatus('spawning-worker');
        const worker = new InferenceWorker();
        worker.onmessage = onWorkerMessage;
        worker.onerror = (errEvent) => {
          setStatus('error');
          setError(`Worker-Fehler: ${errEvent.message}`);
        };
        workerRef.current = worker;

        // Schritt 3: OffscreenCanvas für Preprocessing vorbereiten.
        // Größe = Modell-Input (640×640 für YOLO11). Sicherheitshalber
        // aus dem ersten Modell ablesen — alle YOLO-Varianten haben
        // ohnehin 640×640.
        const firstModel = models[0];
        if (firstModel) {
          const size = firstModel.inputSize[2];
          canvasRef.current = new OffscreenCanvas(size, size);
        }

        // Modell-Laden wird vom 'ready'-Event des Workers getriggert.
      } catch (err) {
        if (cancelled) return;
        const error = err as Error;
        setStatus('error');
        setError(error.message);
      }
    })();

    // Cleanup beim Unmount: Worker beenden, RAF stoppen.
    return () => {
      cancelled = true;
      if (rafHandleRef.current !== null) {
        cancelAnimationFrame(rafHandleRef.current);
        rafHandleRef.current = null;
      }
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Frame-Pump-Effect: läuft, sobald der Hook "ready" und enabled ist.
   *
   * Die Schleife:
   *   - Wenn Status NICHT ready → nur RAF requeue, nichts tun
   *   - Wenn Worker noch beschäftigt → Drop Frame
   *   - Sonst: Frame preprocessen + an Worker schicken
   */
  useEffect(() => {
    if (!enabled) return;

    const pump = (): void => {
      // Nächsten Frame anfordern (Endlos-Loop).
      rafHandleRef.current = requestAnimationFrame(pump);

      const video = videoRef.current;
      const worker = workerRef.current;
      const canvas = canvasRef.current;
      const modelSpec = currentModelSpecRef.current;

      // Bedingungen prüfen, bevor wir Frame anfassen.
      if (
        statusRef.current !== 'ready' ||
        !video ||
        !worker ||
        !canvas ||
        !modelSpec ||
        video.videoWidth === 0 // Video noch nicht geladen
      ) {
        return;
      }

      // Drop-Strategie: wenn Worker noch arbeitet → Frame überspringen.
      if (isProcessingRef.current) {
        return;
      }

      try {
        // Preprocess: Letterbox + Float32-Konvertierung
        const modelSize = modelSpec.inputSize[2];
        const pre = preprocessFrame(video, canvas, modelSize);

        const frameId = nextFrameIdRef.current++;
        isProcessingRef.current = true;

        // postMessage mit Transferable: der Float32Array-Buffer wird
        // an den Worker übergeben, OHNE zu kopieren — viel schneller.
        worker.postMessage(
          {
            type: 'infer',
            input: pre.input,
            frameId,
            originalWidth: pre.originalWidth,
            originalHeight: pre.originalHeight,
            letterbox: pre.letterbox,
          },
          [pre.input.buffer], // Transferable Liste
        );
      } catch (err) {
        // Fehler beim Preprocess — z.B. wenn Canvas-Kontext stirbt.
        isProcessingRef.current = false;
        console.error('Preprocess-Fehler:', err);
      }
    };

    rafHandleRef.current = requestAnimationFrame(pump);

    return () => {
      if (rafHandleRef.current !== null) {
        cancelAnimationFrame(rafHandleRef.current);
        rafHandleRef.current = null;
      }
    };
  }, [enabled, videoRef]);

  return {
    status,
    error,
    backend,
    availableModels,
    currentModelId,
    detections,
    fps,
    inferenceMs,
    switchModel,
  };
}
