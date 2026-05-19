/**
 * ============================================================================
 * types.ts — Typdefinitionen für die Inferenz-Pipeline
 * ============================================================================
 *
 * Diese Datei sammelt alle TypeScript-Typen, die zwischen den Modulen der
 * Inferenz-Pipeline geteilt werden. Vorteile einer zentralen Typdatei:
 *   1. Keine Zirkular-Imports.
 *   2. Eine Quelle der Wahrheit für die Datenstruktur.
 *   3. Worker und Main-Thread nutzen exakt die gleichen Message-Typen.
 *
 * In Python wäre das vergleichbar mit einem `types.py` oder Pydantic-
 * Models-Modul, das von mehreren anderen Modulen importiert wird.
 */

/**
 * Eine einzelne erkannte Detektion nach Postprocessing.
 *
 * Koordinaten beziehen sich auf das ORIGINALBILD (nach Rück-Skalierung
 * vom Modell-Input zurück auf die Eingabegröße).
 *
 * Felder:
 *   - x, y:       Linke obere Ecke der Bounding Box (in Pixeln, Originalbild).
 *   - width:      Breite der Box in Pixeln.
 *   - height:     Höhe der Box in Pixeln.
 *   - classId:    Index der erkannten Klasse (0..79 für COCO).
 *   - className:  Englischer Klassenname (wird im UI deutsch übersetzt).
 *   - score:      Konfidenz im Bereich [0..1].
 */
export type Detection = {
  x: number;
  y: number;
  width: number;
  height: number;
  classId: number;
  className: string;
  score: number;
};

/**
 * Metadaten eines verfügbaren Modells, wie sie in manifest.json stehen.
 *
 * Die Felder spiegeln die JSON-Struktur, die das Python-Export-Skript
 * (scripts/export_yolo.py) erzeugt.
 */
export type ModelSpec = {
  /** Eindeutige ID, z.B. "yolo11n-coco". */
  id: string;
  /** Technischer Name, z.B. "YOLO11N (COCO)". */
  name: string;
  /** Anzeigename für UI, z.B. "YOLO v11 Nano". */
  displayName: string;
  /** Pfad relativ zu public/models/, z.B. "yolo11n-coco.onnx". */
  path: string;
  /** Input-Shape im NCHW-Format: [batch, channels, height, width]. */
  inputSize: [number, number, number, number];
  /** Genauigkeit: "fp32" | "fp16" | "int8". */
  precision: string;
  /** Dateigröße in Byte. */
  sizeBytes: number;
  /** Beschreibung für die Modell-Auswahl. */
  description: string;
  /** Klassen-Liste in Indexreihenfolge (englisch). */
  classes: string[];
};

/**
 * Gesamtes Manifest (Top-Level der manifest.json).
 */
export type ModelManifest = {
  version: number;
  models: ModelSpec[];
};

/**
 * Backend-Identifikation für die Stats-Anzeige.
 *
 * - webgpu: Hardware-beschleunigt via WebGPU (schnellster Fall).
 * - wasm:   WebAssembly-Backend (Fallback, langsamer aber breit kompatibel).
 */
export type InferenceBackend = 'webgpu' | 'wasm';

// ===========================================================================
//   Web-Worker-Nachrichten
// ===========================================================================
//
// Worker und Main-Thread kommunizieren ausschließlich über postMessage().
// Wir definieren ein striktes Message-Protokoll, damit beide Seiten typsicher
// arbeiten. Das `type`-Feld dient als "Discriminator" für TypeScripts
// Type-Narrowing — ähnlich einem Pydantic-Tagged-Union.
// ===========================================================================

/**
 * Postprocessing-Settings, die pro Frame mitgesendet werden.
 *
 * Wir schicken sie mit dem Frame statt sie im Worker zu cachen — damit
 * Settings-Updates atomar mit dem nächsten Frame wirksam werden und es
 * keine Race-Conditions zwischen "Settings ändern" und "Frame inferieren" gibt.
 */
export type InferenceSettings = {
  /** Konfidenz-Schwelle: Detektionen unter diesem Score werden verworfen. */
  scoreThreshold: number;
  /** IoU-Schwelle für Non-Maximum-Suppression. */
  iouThreshold: number;
  /** Sortiertes Array erlaubter Klassen-IDs (oder undefined für "alle"). */
  enabledClassIds?: number[];
};

/**
 * Nachrichten, die vom Main-Thread an den Worker geschickt werden.
 */
export type MainToWorkerMessage =
  /** Lade ein neues Modell (z.B. beim Modell-Switch). */
  | {
      type: 'load-model';
      modelSpec: ModelSpec;
      modelUrl: string;
    }
  /** Führe Inferenz auf einem Frame aus. */
  | {
      type: 'infer';
      /** Frame-Daten als planar RGB (Float32Array, normalisiert auf 0..1). */
      input: Float32Array;
      /** Eindeutige Frame-ID, wird vom Main-Thread vergeben. */
      frameId: number;
      /** Originale Bildmaße (vor Letterbox), für Box-Rück-Skalierung. */
      originalWidth: number;
      originalHeight: number;
      /** Letterbox-Parameter (Padding + Scale), für Postprocessing. */
      letterbox: LetterboxParams;
      /** Settings für Postprocessing dieses Frames. */
      settings: InferenceSettings;
    };

/**
 * Nachrichten, die der Worker zurück an den Main-Thread schickt.
 */
export type WorkerToMainMessage =
  /** Worker meldet sich initial mit dem aktiven Backend. */
  | {
      type: 'ready';
      backend: InferenceBackend;
    }
  /** Modell wurde geladen — bereit für Inferenz. */
  | {
      type: 'model-loaded';
      modelId: string;
    }
  /** Inferenz-Ergebnis. */
  | {
      type: 'inference-result';
      frameId: number;
      detections: Detection[];
      /** Reine Modell-Inferenzzeit in ms (ohne Pre/Postprocess). */
      inferenceMs: number;
    }
  /** Fehler im Worker (kann nicht über throw kommuniziert werden). */
  | {
      type: 'error';
      message: string;
      cause?: string;
    };

/**
 * Letterbox-Parameter, die das Preprocessing produziert und das
 * Postprocessing braucht, um Boxen zurück zu skalieren.
 *
 * Letterbox = das Originalbild proportional in ein Quadrat einbetten
 * (640×640) und die Ränder mit einer neutralen Farbe (grau) füllen.
 * Damit bleibt das Seitenverhältnis erhalten.
 */
export type LetterboxParams = {
  /** Skalierungsfaktor: modelSize / max(origW, origH). */
  scale: number;
  /** Horizontaler Pad (Pixel, an LINKER Seite eingefügt). */
  padX: number;
  /** Vertikaler Pad (Pixel, an OBERER Seite eingefügt). */
  padY: number;
};
