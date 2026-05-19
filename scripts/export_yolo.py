"""
Exportiert YOLO-Modelle nach ONNX für die Verwendung in VisionLab.

Das Skript lädt vortrainierte YOLO-Modelle vom Ultralytics-Hub, exportiert
sie ins ONNX-Format und legt sie samt Metadaten-Manifest in
``../public/models/`` ab, sodass die Web-App sie zur Laufzeit laden kann.

Beispielaufrufe:
    uv run python export_yolo.py                       # Default: yolov11n + yolov11s
    uv run python export_yolo.py --models yolov11n     # Nur ein Modell
    uv run python export_yolo.py --imgsz 480           # Kleinere Eingabegröße
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

# Ultralytics wird erst spät importiert, damit `--help` ohne Installation läuft.

# Standard-Eingabegröße für YOLO (quadratisch, optimal für ONNX-Web).
DEFAULT_IMG_SIZE = 640

# Standard-Set zu exportierender Modelle.
DEFAULT_MODELS = ("yolo11n", "yolo11s")

# Zielverzeichnis relativ zum Skript-Standort.
SCRIPT_DIR = Path(__file__).parent.resolve()
OUTPUT_DIR = SCRIPT_DIR.parent / "public" / "models"

# Anzeigenamen pro Modell-ID für die UI.
DISPLAY_NAMES: dict[str, str] = {
    "yolo11n": "YOLO v11 Nano",
    "yolo11s": "YOLO v11 Small",
    "yolo11m": "YOLO v11 Medium",
    "yolo12n": "YOLO v12 Nano",
    "yolo12s": "YOLO v12 Small",
}

# Kurzbeschreibungen für die Modellauswahl.
DESCRIPTIONS: dict[str, str] = {
    "yolo11n": "Sehr schnell, kompakte Variante — beste Wahl für ältere Smartphones.",
    "yolo11s": "Mittlere Variante, bessere Genauigkeit bei moderater Last.",
    "yolo11m": "Große Variante, hohe Genauigkeit, nur für leistungsstarke Geräte.",
    "yolo12n": "Neueste Architektur, Nano-Variante.",
    "yolo12s": "Neueste Architektur, Small-Variante.",
}


@dataclass
class ModelManifestEntry:
    """Repräsentiert einen Eintrag im manifest.json."""

    id: str
    name: str
    display_name: str
    path: str
    input_size: tuple[int, int, int, int]  # NCHW
    precision: str
    size_bytes: int
    description: str
    classes: list[str]


def parse_args() -> argparse.Namespace:
    """
    Parst die Kommandozeilen-Argumente.

    Returns:
        Namespace mit den Feldern: models, imgsz, opset, force.
    """
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--models",
        nargs="+",
        default=list(DEFAULT_MODELS),
        help="Modell-Namen, die exportiert werden sollen (z.B. yolo11n yolo11s).",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=DEFAULT_IMG_SIZE,
        help=f"Eingabegröße in Pixel (Default: {DEFAULT_IMG_SIZE}).",
    )
    parser.add_argument(
        "--opset",
        type=int,
        default=17,
        help="ONNX-Opset-Version (Default: 17, kompatibel mit ORT Web 1.21).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Vorhandene Modell-Dateien überschreiben.",
    )
    return parser.parse_args()


def export_model(
    model_id: str,
    imgsz: int,
    opset: int,
    output_dir: Path,
    force: bool,
) -> ModelManifestEntry:
    """
    Exportiert ein einzelnes Modell nach ONNX und gibt seinen Manifest-Eintrag zurück.

    Args:
        model_id: Ultralytics-Modell-Kennung (z.B. "yolo11n").
        imgsz: Quadratische Eingabegröße in Pixel.
        opset: Ziel-Opset-Version für ONNX.
        output_dir: Verzeichnis, in das die .onnx-Datei kopiert wird.
        force: Wenn True, wird eine bestehende Datei überschrieben.

    Returns:
        Manifest-Eintrag mit Pfad, Größe und Klassennamen.

    Raises:
        FileExistsError: Wenn das Ziel existiert und force=False ist.
        RuntimeError: Bei Export-Fehlern.
    """
    # Später importieren, damit das Skript ohne installierte Abhängigkeiten
    # zumindest --help anzeigen kann.
    from ultralytics import YOLO

    target_path = output_dir / f"{model_id}-coco.onnx"

    if target_path.exists() and not force:
        raise FileExistsError(
            f"{target_path} existiert bereits. --force zum Überschreiben verwenden."
        )

    print(f"[{model_id}] Lade vortrainiertes Modell …")
    model = YOLO(f"{model_id}.pt")

    print(f"[{model_id}] Exportiere nach ONNX (imgsz={imgsz}, opset={opset}) …")
    t_start = time.time()

    # Ultralytics legt die exportierte Datei neben der .pt-Datei ab, im Cache.
    onnx_path_str = model.export(
        format="onnx",
        imgsz=imgsz,
        opset=opset,
        simplify=True,
        dynamic=False,  # Feste Shape — wichtig für ORT-Web-Performance.
        nms=False,  # NMS machen wir im Browser selbst (volle Kontrolle).
    )
    elapsed = time.time() - t_start
    print(f"[{model_id}] Export fertig in {elapsed:.1f}s → {onnx_path_str}")

    # Datei ins Zielverzeichnis kopieren — und Original-Zwischendatei
    # löschen, damit der scripts/-Ordner sauber bleibt.
    onnx_path = Path(onnx_path_str)
    output_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(onnx_path, target_path)
    onnx_path.unlink(missing_ok=True)
    print(f"[{model_id}] Kopiert nach {target_path}")

    # Klassennamen aus dem Modell extrahieren.
    # model.names ist ein dict {0: 'person', 1: 'bicycle', ...}.
    class_names = [model.names[i] for i in sorted(model.names.keys())]

    entry = ModelManifestEntry(
        id=f"{model_id}-coco",
        name=f"{model_id.upper()} (COCO)",
        display_name=DISPLAY_NAMES.get(model_id, model_id),
        path=target_path.name,
        input_size=(1, 3, imgsz, imgsz),
        precision="fp32",
        size_bytes=target_path.stat().st_size,
        description=DESCRIPTIONS.get(model_id, ""),
        classes=class_names,
    )
    return entry


def write_manifest(entries: list[ModelManifestEntry], output_dir: Path) -> Path:
    """
    Schreibt die Manifest-Datei mit allen exportierten Modellen.

    Bestehende Einträge mit gleicher ID werden ersetzt, andere bleiben erhalten —
    so können Modelle inkrementell exportiert werden.

    Args:
        entries: Neue oder aktualisierte Manifest-Einträge.
        output_dir: Verzeichnis, in dem manifest.json liegt.

    Returns:
        Pfad zur geschriebenen Manifest-Datei.
    """
    manifest_path = output_dir / "manifest.json"
    existing: dict[str, dict[str, Any]] = {}

    # Bestehendes Manifest einlesen, falls vorhanden.
    if manifest_path.exists():
        with manifest_path.open(encoding="utf-8") as f:
            data = json.load(f)
        for item in data.get("models", []):
            existing[item["id"]] = item

    # Neue Einträge eintragen / überschreiben (camelCase für JS-Konsistenz).
    for entry in entries:
        d = asdict(entry)
        # snake_case → camelCase für JS-Konsumenten
        existing[entry.id] = {
            "id": d["id"],
            "name": d["name"],
            "displayName": d["display_name"],
            "path": d["path"],
            "inputSize": list(d["input_size"]),
            "precision": d["precision"],
            "sizeBytes": d["size_bytes"],
            "description": d["description"],
            "classes": d["classes"],
        }

    # Zusammenführen und sortiert schreiben.
    payload = {
        "version": 1,
        "models": sorted(existing.values(), key=lambda m: m["id"]),
    }
    manifest_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return manifest_path


def main() -> int:
    """
    Haupt-Einstiegspunkt des Skripts.

    Returns:
        Exit-Code: 0 bei Erfolg, 1 bei Fehlern.
    """
    args = parse_args()

    print(f"Zielverzeichnis: {OUTPUT_DIR}")
    print(f"Modelle: {', '.join(args.models)}")
    print()

    entries: list[ModelManifestEntry] = []
    for model_id in args.models:
        try:
            entry = export_model(
                model_id=model_id,
                imgsz=args.imgsz,
                opset=args.opset,
                output_dir=OUTPUT_DIR,
                force=args.force,
            )
            entries.append(entry)
            print()
        except FileExistsError as e:
            print(f"  Übersprungen: {e}", file=sys.stderr)
        except Exception as e:  # noqa: BLE001
            print(f"  Fehler beim Export von {model_id}: {e}", file=sys.stderr)
            return 1

    if entries:
        manifest_path = write_manifest(entries, OUTPUT_DIR)
        print(f"Manifest geschrieben: {manifest_path}")
        print(f"Erfolgreich exportiert: {len(entries)} Modell(e).")
    else:
        print("Keine Modelle exportiert.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
