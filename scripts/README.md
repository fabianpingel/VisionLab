# scripts/ — Python-Werkzeuge für VisionLab

Hier liegen Build-/Wartungs-Skripte, die nicht zur Web-App selbst gehören,
aber für die Vorbereitung der Modelle gebraucht werden.

## Voraussetzungen

- Python ≥ 3.11
- [uv](https://docs.astral.sh/uv/) als Paketmanager (`pip install uv` oder via `winget install astral-sh.uv`)

## Erste Einrichtung

```powershell
cd D:\VisionLab\scripts
uv sync
```

`uv sync` legt eine virtuelle Umgebung in `scripts/.venv/` an und installiert
alle Abhängigkeiten aus `pyproject.toml`. Erste Installation dauert 2–5 Minuten
(PyTorch + Ultralytics sind groß).

## Modelle exportieren

```powershell
# Standard: yolov11n + yolov11s nach ../public/models/
uv run python export_yolo.py

# Nur ein Modell
uv run python export_yolo.py --models yolo11n

# Mehrere mit anderer Eingabegröße
uv run python export_yolo.py --models yolo11n yolo11s --imgsz 640

# Vorhandene Dateien überschreiben
uv run python export_yolo.py --force
```

Der erste Lauf lädt vortrainierte YOLO-Gewichte vom Ultralytics-Hub (10–30 MB
pro Modell). Diese werden im Ultralytics-Cache von `uv`s venv abgelegt.

Nach dem Lauf finden sich in `../public/models/`:

```
public/models/
├── manifest.json
├── yolo11n-coco.onnx
└── yolo11s-coco.onnx
```

`manifest.json` enthält Metadaten (Name, Größe, Input-Shape, alle 80
Klassennamen) — die Web-App liest sie zur Laufzeit.

## Linting

```powershell
uv run ruff check .
uv run ruff format .
```
