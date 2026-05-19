/**
 * ============================================================================
 * worker.ts — Web-Worker für ONNX-Inferenz
 * ============================================================================
 *
 * Dieser Worker läuft in einem eigenen Thread (separat vom UI-Thread).
 * Er bekommt vorverarbeitete Frames vom Main-Thread und führt die
 * KI-Inferenz auf ihnen aus.
 *
 * Vorteil: Die Modell-Inferenz blockiert NIE die UI — sie läuft parallel.
 * In Python wäre das vergleichbar mit einem multiprocessing.Process
 * (echter Parallelismus, nicht nur threading wegen GIL).
 *
 * --- Worker-Konzept kurz erklärt ---
 *
 * Ein Worker ist ein separater JavaScript-Kontext mit eigenem globalen
 * Scope. Kommunikation läuft NUR über postMessage() / onmessage —
 * geteilte Variablen gibt es NICHT.
 *
 * Aktiviert wird er über `new Worker(...)` im Main-Thread.
 * Vite bündelt diese Datei automatisch zum eigenständigen Worker-Modul.
 *
 * --- ONNX Runtime Web ---
 *
 * `onnxruntime-web` ist die offizielle JS-Library von Microsoft.
 *   - Im WebGPU-Modus: nutzt GPU-Shader (schnell, modern)
 *   - Im WASM-Modus: WebAssembly + SIMD + Threads (Fallback)
 *
 * Wir versuchen zuerst WebGPU; klappt das nicht, nehmen wir WASM.
 */

import * as ort from 'onnxruntime-web';
import { postprocessYolo11 } from './postprocess';
import type {
  Detection,
  InferenceBackend,
  MainToWorkerMessage,
  ModelSpec,
  WorkerToMainMessage,
} from './types';

/**
 * Aktuell aktive ONNX-Session (oder null, falls noch kein Modell geladen).
 *
 * Pro Modell-Wechsel wird die alte Session disposed und eine neue erstellt.
 */
let activeSession: ort.InferenceSession | null = null;

/**
 * Spezifikation des aktuell geladenen Modells (für Postprocessing-Parameter).
 */
let activeModelSpec: ModelSpec | null = null;

/**
 * Welches Backend ist aktiv? Wird beim Init bestimmt.
 */
let activeBackend: InferenceBackend = 'wasm';

/**
 * Hilfsfunktion: typsicher eine Nachricht ans Main-Thread schicken.
 *
 * `self` ist im Worker-Scope das globale Objekt — entspricht `window`
 * im Main-Thread. `postMessage` schickt JSON-serialisierbare Daten zurück.
 */
function send(message: WorkerToMainMessage): void {
  self.postMessage(message);
}

/**
 * Prüft, ob WebGPU im aktuellen Browser/Gerät verfügbar ist.
 *
 * @returns true, wenn WebGPU genutzt werden kann.
 */
async function isWebGpuAvailable(): Promise<boolean> {
  // 'gpu' existiert auf navigator nur in WebGPU-fähigen Browsern.
  // Wir nutzen einen Typ-Cast statt @ts-expect-error, weil moderne
  // TS-Versionen die WebGPU-Typen kennen, ältere aber nicht.
  const nav = navigator as Navigator & {
    gpu?: { requestAdapter(): Promise<unknown | null> };
  };
  if (!nav.gpu) return false;
  try {
    const adapter = await nav.gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

/**
 * Initialisiert die ONNX Runtime mit dem bestmöglichen Backend.
 *
 * Wird einmalig beim Worker-Start aufgerufen. Bestimmt das aktive Backend
 * und meldet sich beim Main-Thread mit einer "ready"-Nachricht.
 */
async function initialize(): Promise<void> {
  // Multi-Threaded WASM braucht crossOriginIsolated=true (= spezielle
  // HTTP-Header COOP/COEP). GitHub Pages liefert die NICHT, daher
  // zwingen wir Single-Thread.
  // WebGPU funktioniert unabhängig davon — beste Option.
  ort.env.wasm.numThreads = 1;
  // SIMD aktivieren — das geht ohne Cross-Origin-Isolation und bringt
  // 2-4x Speedup für WASM-Backend.
  ort.env.wasm.simd = true;

  // Backend wählen
  if (await isWebGpuAvailable()) {
    activeBackend = 'webgpu';
  } else {
    activeBackend = 'wasm';
  }

  send({ type: 'ready', backend: activeBackend });
}

/**
 * Lädt ein ONNX-Modell von der angegebenen URL und erstellt eine Session.
 *
 * @param modelSpec Metadaten des Modells (für Postprocessing).
 * @param modelUrl URL der .onnx-Datei (kommt vom Main-Thread).
 */
async function loadModel(modelSpec: ModelSpec, modelUrl: string): Promise<void> {
  try {
    // Bestehende Session aufräumen (gibt GPU-Ressourcen frei).
    if (activeSession) {
      await activeSession.release();
      activeSession = null;
    }

    // ExecutionProvider gemäß gewähltem Backend.
    // 'webgpu' nutzt die GPU; 'wasm' läuft auf der CPU mit SIMD.
    const executionProviders: ort.InferenceSession.SessionOptions['executionProviders'] =
      activeBackend === 'webgpu' ? ['webgpu'] : ['wasm'];

    activeSession = await ort.InferenceSession.create(modelUrl, {
      executionProviders,
      // graphOptimizationLevel: 'all' aktiviert alle ORT-Optimierungen.
      graphOptimizationLevel: 'all',
    });

    activeModelSpec = modelSpec;
    send({ type: 'model-loaded', modelId: modelSpec.id });
  } catch (err) {
    const error = err as Error;
    send({
      type: 'error',
      message: `Modell-Ladung fehlgeschlagen: ${error.message}`,
      cause: error.name,
    });
  }
}

/**
 * Führt eine Inferenz auf einem einzelnen Frame aus.
 *
 * @param msg Inferenz-Nachricht vom Main-Thread (enthält Input + Metadaten).
 */
async function runInference(msg: MainToWorkerMessage & { type: 'infer' }): Promise<void> {
  if (!activeSession || !activeModelSpec) {
    send({
      type: 'error',
      message: 'Inferenz angefordert, aber kein Modell geladen.',
    });
    return;
  }

  try {
    // Inferenz-Zeit messen (für die Stats-Anzeige).
    const tStart = performance.now();

    // Input-Tensor erzeugen. Shape ist die im manifest definierte.
    const inputTensor = new ort.Tensor('float32', msg.input, activeModelSpec.inputSize);

    // ONNX-Modelle haben benannte Inputs/Outputs — der erste Input-Name
    // wird typischerweise 'images' (für YOLO11) sein. Wir greifen
    // dynamisch zu, damit es robust gegen Umbenennungen ist.
    const feeds: Record<string, ort.Tensor> = {};
    feeds[activeSession.inputNames[0]] = inputTensor;

    const results = await activeSession.run(feeds);
    const outputTensor = results[activeSession.outputNames[0]];

    const inferenceMs = performance.now() - tStart;

    // Output-Daten als Float32Array extrahieren.
    const outputData = outputTensor.data as Float32Array;

    // Klassenfilter: Wenn enabledClassIds gesetzt ist, in ein Set umwandeln
    // (für O(1)-Lookup im Postprocessing-Loop). Wenn undefined → alle erlaubt.
    const allowedClassIds = msg.settings.enabledClassIds
      ? new Set(msg.settings.enabledClassIds)
      : undefined;

    // Postprocessing: rohe Modell-Ausgabe → strukturierte Detektionen.
    const detections: Detection[] = postprocessYolo11(outputData, {
      classNames: activeModelSpec.classes,
      scoreThreshold: msg.settings.scoreThreshold,
      iouThreshold: msg.settings.iouThreshold,
      letterbox: msg.letterbox,
      originalWidth: msg.originalWidth,
      originalHeight: msg.originalHeight,
      modelSize: activeModelSpec.inputSize[2], // height (= width für YOLO11)
      allowedClassIds,
    });

    send({
      type: 'inference-result',
      frameId: msg.frameId,
      detections,
      inferenceMs,
    });
  } catch (err) {
    const error = err as Error;
    send({
      type: 'error',
      message: `Inferenz fehlgeschlagen: ${error.message}`,
      cause: error.name,
    });
  }
}

/**
 * Message-Dispatcher: empfängt Nachrichten vom Main-Thread und ruft
 * die passende Handler-Funktion auf.
 *
 * In Python wäre das vergleichbar mit einem if/elif-Switch über einen
 * Message-Typ-String, der von einem Queue-Consumer aufgerufen wird.
 */
self.onmessage = async (event: MessageEvent<MainToWorkerMessage>): Promise<void> => {
  const msg = event.data;
  switch (msg.type) {
    case 'load-model':
      await loadModel(msg.modelSpec, msg.modelUrl);
      break;
    case 'infer':
      await runInference(msg);
      break;
    default:
      // TypeScript stellt sicher, dass dieser Fall unmöglich ist
      // (exhaustive check über das Discriminator-Union).
      break;
  }
};

// Beim Worker-Start einmalig initialisieren.
// Eine Top-Level-Await wäre eleganter, aber Worker-Module-Support für
// top-level await ist nicht überall stabil — daher fire-and-forget.
initialize().catch((err: Error) => {
  send({
    type: 'error',
    message: `Worker-Init fehlgeschlagen: ${err.message}`,
    cause: err.name,
  });
});
