"""
Erzeugt PWA-Icons und Favicons aus dem PINGEL-Logo.

Eingabe: ../temp/Logo/*.png (Original-Logo-Dateien)
Ausgabe: ../public/icons/*.png (quadratische Icons mit Brand-Hintergrund)

Generierte Größen:
    - favicon-32.png       (Browser-Tab)
    - favicon-64.png
    - apple-touch-icon.png (180×180, iOS-Homescreen)
    - icon-192.png         (PWA-Manifest, Standard-Größe)
    - icon-512.png         (PWA-Manifest, High-Res)
    - icon-512-maskable.png (PWA-Manifest, mit Safe-Area für adaptive Icons)

Aufruf:
    cd scripts
    uv run python generate_icons.py
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

# Pfade relativ zum Skript-Standort.
SCRIPT_DIR = Path(__file__).parent.resolve()
LOGO_SOURCE_WHITE = SCRIPT_DIR.parent / "temp" / "Logo" / "Weiß auf Transparenz .png"
LOGO_SOURCE_ORIGINAL = SCRIPT_DIR.parent / "temp" / "Logo" / "Original auf Transparenz.png"
OUTPUT_DIR = SCRIPT_DIR.parent / "public" / "icons"

# Brand-Hintergrund für die Icons (entspricht --color-background in tokens.css).
BRAND_BG = (11, 16, 36, 255)  # #0b1024

# Welche Icons werden generiert? Größe → (Logo-Quelle, Padding-Faktor, Dateiname).
# Padding-Faktor = wie viel "Luft" ums Logo (0.15 = 15% Rand auf jeder Seite).
# Maskable-Icons brauchen MEHR Padding (mind. 20%), damit das Logo in der
# Safe-Area liegt — Adaptive-Icons croppen die Ränder kreisförmig.
ICON_SPECS: dict[str, dict[str, object]] = {
    "favicon-32.png": {"size": 32, "padding": 0.10, "use_white_logo": True},
    "favicon-64.png": {"size": 64, "padding": 0.10, "use_white_logo": True},
    "apple-touch-icon.png": {"size": 180, "padding": 0.15, "use_white_logo": True},
    "icon-192.png": {"size": 192, "padding": 0.15, "use_white_logo": True},
    "icon-512.png": {"size": 512, "padding": 0.15, "use_white_logo": True},
    "icon-512-maskable.png": {"size": 512, "padding": 0.22, "use_white_logo": True},
}


def render_icon(
    logo_path: Path,
    size: int,
    padding_factor: float,
    background: tuple[int, int, int, int],
) -> Image.Image:
    """
    Erzeugt ein quadratisches Icon mit zentriertem Logo auf Brand-Hintergrund.

    Algorithmus:
        1. Erzeuge ein leeres RGBA-Quadrat in der gewünschten Größe.
        2. Fülle es mit der Brand-Hintergrundfarbe.
        3. Skaliere das Logo proportional auf (1 - 2 * padding) der Icon-Größe.
        4. Platziere es mittig.

    Args:
        logo_path: Pfad zur Logo-PNG (transparent).
        size: Kantenlänge des Icons in Pixeln.
        padding_factor: Abstand zwischen Logo-Rand und Icon-Rand (0..0.5).
        background: RGBA-Tupel der Hintergrundfarbe.

    Returns:
        Pillow-Image (RGBA) im gewünschten Format.
    """
    # Hintergrund anlegen
    canvas = Image.new("RGBA", (size, size), background)

    # Logo laden und in passende Größe skalieren — proportional, mit Padding.
    logo = Image.open(logo_path).convert("RGBA")
    inner_size = int(size * (1 - 2 * padding_factor))

    # Skalierungsfaktor anhand der längeren Seite (Logo ist breiter als hoch).
    logo_aspect = logo.width / logo.height
    if logo_aspect >= 1:
        # Logo ist breiter — Breite bestimmt
        new_w = inner_size
        new_h = int(inner_size / logo_aspect)
    else:
        new_h = inner_size
        new_w = int(inner_size * logo_aspect)

    # LANCZOS = hochwertige Resampling-Methode, wichtig bei kleinen Icons.
    logo_resized = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Mittig platzieren — Offsets in (x, y).
    offset = ((size - new_w) // 2, (size - new_h) // 2)
    # alpha_composite kombiniert RGBA-Bilder korrekt (respektiert Transparenz).
    canvas.alpha_composite(logo_resized, dest=offset)

    return canvas


def main() -> int:
    """
    Haupt-Einstiegspunkt: erzeugt alle Icons gemäß ICON_SPECS.

    Returns:
        Exit-Code: 0 bei Erfolg, 1 bei fehlender Quelle.
    """
    if not LOGO_SOURCE_WHITE.exists() or not LOGO_SOURCE_ORIGINAL.exists():
        print(f"Fehler: Logo-Quellen nicht gefunden in {LOGO_SOURCE_WHITE.parent}",
              file=sys.stderr)
        return 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Zielverzeichnis: {OUTPUT_DIR}")

    for filename, spec in ICON_SPECS.items():
        size: int = spec["size"]  # type: ignore[assignment]
        padding: float = spec["padding"]  # type: ignore[assignment]
        use_white: bool = spec["use_white_logo"]  # type: ignore[assignment]

        source = LOGO_SOURCE_WHITE if use_white else LOGO_SOURCE_ORIGINAL
        icon = render_icon(source, size, padding, BRAND_BG)
        out_path = OUTPUT_DIR / filename
        icon.save(out_path, format="PNG", optimize=True)
        print(f"  - {filename} ({size}x{size}, {out_path.stat().st_size // 1024} KB)")

    print(f"\nFertig: {len(ICON_SPECS)} Icons erstellt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
