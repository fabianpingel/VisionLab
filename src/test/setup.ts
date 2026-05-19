/**
 * setup.ts — Wird vor jedem Test-File automatisch geladen
 *
 * Hier registrieren wir globale Test-Helper, z.B. die jest-dom-Matcher
 * (expect(element).toBeInTheDocument(), .toHaveClass(), ...).
 *
 * Vergleichbar mit `conftest.py` in pytest, das bei Test-Start geladen wird.
 */

import '@testing-library/jest-dom';
