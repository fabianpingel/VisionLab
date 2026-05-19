/**
 * ============================================================================
 * privacyText.ts — Inhalte für das App-spezifische Datenschutz-Modal
 * ============================================================================
 *
 * Dies ist eine ergänzende Mini-Datenschutzerklärung, die spezifische
 * Datenverarbeitungs-Aspekte dieser App beschreibt — vor allem die
 * Browser-lokalen Punkte, die in der Haupt-Datenschutzerklärung der
 * Marken-Website (www.fabian-pingel.de) typischerweise nicht so detailliert
 * stehen.
 *
 * WICHTIG: Dieser Text wurde technisch korrekt formuliert, aber NICHT von
 * einem Juristen geprüft. Vor Go-Live durch Anwalt prüfen lassen.
 */

/** Stand-Datum der Datenschutzerklärung. */
export const PRIVACY_DATE = '19. Mai 2026';

/** Überschrift des Datenschutz-Modals. */
export const PRIVACY_TITLE = 'Datenschutz für diese Anwendung';

/**
 * Hinweis-Text vor den Detail-Sektionen.
 */
export const PRIVACY_INTRO =
  'Diese Ergänzung erläutert die App-spezifischen Aspekte der Datenverarbeitung. ' +
  'Die allgemeine Datenschutzerklärung des Anbieters finden Sie auf der ' +
  'Marken-Website unter www.fabian-pingel.de.';

/**
 * Strukturierte Sektionen der Datenschutzerklärung.
 *
 * Jede Sektion hat eine Überschrift und einen Text-Block. So bleibt das Modal
 * gut scrollbar und übersichtlich gerendert.
 */
export const PRIVACY_SECTIONS: ReadonlyArray<{
  title: string;
  body: string;
}> = [
  {
    title: '1. Anbieter',
    body:
      'Fabian Pingel, PINGEL AI Solutions. Kontaktdaten und Anschrift finden Sie ' +
      'im Impressum unter www.fabian-pingel.de/impressum.html.',
  },
  {
    title: '2. Zweck der Anwendung',
    body:
      'VisionLab ist eine Demonstrationsanwendung für die Möglichkeiten neuronaler ' +
      'Netze zur Objekterkennung. Sie wird ausschließlich zu Vorführ- und ' +
      'Beratungszwecken bereitgestellt.',
  },
  {
    title: '3. Verarbeitung von Kamerabildern',
    body:
      'Bei aktivierter Kameraerlaubnis werden Einzelbilder lokal in den ' +
      'Arbeitsspeicher Ihres Browsers übertragen und durch ein neuronales Netz ' +
      'analysiert. Es findet keine dauerhafte Speicherung und keine Übertragung ' +
      'an Server statt. Audio wird nicht erfasst.',
  },
  {
    title: '4. Speicherung auf Ihrem Gerät',
    body:
      'Zur Funktion der App werden gespeichert: (a) Die heruntergeladenen KI-Modell- ' +
      'Dateien im Browser-Cache bzw. in der IndexedDB, damit beim erneuten Aufruf ' +
      'keine Neuübertragung nötig ist. (b) Ein Eintrag im localStorage, der ' +
      'dokumentiert, dass Sie diesen Hinweisen zugestimmt haben. (c) Optional ' +
      'Ihre Konfiguration (Konfidenz-Schwelle, Klassenfilter, Modellwahl). Diese ' +
      'Daten verlassen Ihr Gerät nicht.',
  },
  {
    title: '5. Rechtsgrundlage',
    body:
      'Die Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung gemäß Art. 6 Abs. 1 ' +
      'lit. a DSGVO. Sie können diese Einwilligung jederzeit widerrufen, indem Sie ' +
      'die App schließen und in den Browser-Einstellungen die Kameraerlaubnis ' +
      'entziehen sowie den Browser-Cache für diese Website löschen.',
  },
  {
    title: '6. Drittanbieter',
    body:
      'Es werden keine externen Analyse-, Werbe- oder Tracking-Dienste eingesetzt. ' +
      'Die Anwendung wird statisch über GitHub Pages ausgeliefert; dabei werden ' +
      'durch GitHub übliche Server-Logs erstellt (IP-Adresse, Zeitstempel). ' +
      'Details hierzu in der Datenschutzerklärung von GitHub Inc.',
  },
  {
    title: '7. Ihre Rechte',
    body:
      'Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung ' +
      'der Verarbeitung und Datenübertragbarkeit gemäß Art. 15–21 DSGVO sowie ' +
      'das Recht auf Beschwerde bei einer Aufsichtsbehörde. Da diese Anwendung ' +
      'jedoch keine personenbezogenen Daten dauerhaft speichert, beschränken ' +
      'sich Ihre Rechte praktisch auf die in Punkt 5 beschriebenen Maßnahmen.',
  },
];

/** Schluss-Hinweis am Ende des Modals. */
export const PRIVACY_FOOTER =
  `Stand: ${PRIVACY_DATE}. Bei Fragen wenden Sie sich an den Anbieter über die ` +
  'Kontaktdaten im Impressum.';

/** Beschriftung des "Schließen"-Buttons im Privacy-Modal. */
export const PRIVACY_CLOSE_BUTTON = 'Schließen';
