/**
 * ============================================================================
 * disclaimerText.ts — Inhalte für das Disclaimer-Modal
 * ============================================================================
 *
 * Wir packen die Texte in eine eigene Datei, damit sie:
 *   1. Leicht zu redaktionell anpassen sind, ohne den Komponentencode anzufassen
 *   2. Versioniert werden können (Änderung am Text → Major-Bump bei DISCLAIMER_VERSION)
 *   3. In Tests einzeln referenziert werden können
 *
 * In Python wäre das vergleichbar mit `from copy import text as t` in einem
 * `texts.py`-Modul.
 */

/**
 * Aktuelle Version des Disclaimer-Inhalts.
 *
 * Wichtig: Wird in localStorage gespeichert. Bei inhaltlichen Änderungen am
 * Disclaimer-Text muss diese Version erhöht werden — dann muss jeder Nutzer
 * erneut zustimmen (alter Eintrag im localStorage zählt nicht mehr).
 *
 * Beispiel: v1 → v2 nach textueller Anpassung an neue DSGVO-Auslegung.
 */
export const DISCLAIMER_VERSION = 'v1' as const;

/**
 * Externe Links, die im Disclaimer auftauchen.
 *
 * Hinweis zur Domain-Struktur:
 *   - Die App selbst läuft unter vision.pingel-ai-solutions.de.
 *   - Die Marken-Website von PINGEL AI Solutions liegt unter www.fabian-pingel.de.
 *   - Impressum und Datenschutz sind dort hinterlegt — historisch gewachsen.
 *
 * Der "privacy"-Link verweist derzeit auf die Marken-Website. Wir nutzen ihn
 * aktuell nicht im Disclaimer-Modal direkt (dort öffnet der Klick auf
 * "Datenschutz" das interne PrivacyModal), sondern referenzieren ihn im
 * Privacy-Modal selbst als Quelle der allgemeinen Datenschutzerklärung.
 *
 * TODO: Vor Go-Live von Fabian bestätigen lassen, dass datenschutz.html
 *       unter www.fabian-pingel.de existiert (oder URL anpassen).
 */
export const EXTERNAL_LINKS = {
  privacy: 'https://www.fabian-pingel.de/datenschutz.html',
  imprint: 'https://www.fabian-pingel.de/impressum.html',
  source: 'https://github.com/fabianpingel/VisionLab',
} as const;

/**
 * Haupttitel des Disclaimer-Modals.
 */
export const DISCLAIMER_TITLE = 'Willkommen bei VisionLab';

/**
 * Untertitel mit Hinweis auf den Anbieter.
 */
export const DISCLAIMER_SUBTITLE = 'Eine Demo-Anwendung von PINGEL AI Solutions';

/**
 * Absätze des Disclaimer-Textes als strukturiertes Array.
 *
 * Jeder Eintrag wird im Modal als eigener Absatz dargestellt.
 * Die Liste mit "list" wird als Aufzählung gerendert.
 */
export const DISCLAIMER_PARAGRAPHS: ReadonlyArray<{
  kind: 'text' | 'list';
  content: string | ReadonlyArray<string>;
}> = [
  {
    kind: 'text',
    content:
      'Diese Anwendung führt eine KI-basierte Objekterkennung durch. Die gesamte ' +
      'Verarbeitung findet ausschließlich lokal auf Ihrem Gerät statt.',
  },
  {
    kind: 'list',
    content: [
      'Es werden keine Bilder oder Videos an Server übertragen.',
      'Es findet keine Speicherung auf externen Systemen statt.',
      'KI-Modelle werden im Browser-Cache Ihres Gerätes abgelegt.',
      'Es werden keine Cookies gesetzt und kein Tracking eingesetzt.',
    ],
  },
  {
    kind: 'text',
    content:
      'Bitte richten Sie die Kamera nur auf Bereiche, für deren Aufnahme Sie ' +
      'berechtigt sind. Werden Personen erkennbar abgebildet, sollten Sie vorab ' +
      'deren Zustimmung einholen.',
  },
  {
    kind: 'text',
    content:
      'Diese Anwendung ist eine Demonstration der technischen Möglichkeiten und ' +
      'erhebt keinen Anspruch auf Vollständigkeit oder Fehlerfreiheit der Erkennungsergebnisse.',
  },
];

/**
 * Text der Pflicht-Checkbox vor dem "App starten"-Button.
 */
export const DISCLAIMER_CHECKBOX_LABEL =
  'Ich habe die Hinweise gelesen und stimme der Nutzung zu.';

/**
 * Text des primären "App starten"-Buttons.
 */
export const DISCLAIMER_ACCEPT_BUTTON = 'App starten';

/**
 * Beschriftungen der drei Link-Buttons unter dem Disclaimer-Text.
 */
export const DISCLAIMER_LINK_LABELS = {
  privacy: 'Datenschutz',
  imprint: 'Impressum',
  source: 'Quellcode',
} as const;
