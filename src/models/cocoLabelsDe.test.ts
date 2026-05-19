/**
 * cocoLabelsDe.test.ts — Tests für die deutsche COCO-Labelliste
 */

import { describe, it, expect } from 'vitest';
import { COCO_LABELS_DE, translateClassName } from './cocoLabelsDe';

describe('COCO_LABELS_DE', () => {
  it('enthält genau 80 Klassen (COCO-Standard)', () => {
    expect(COCO_LABELS_DE.length).toBe(80);
  });

  it('hat keine leeren oder doppelten Einträge', () => {
    const seen = new Set<string>();
    for (const label of COCO_LABELS_DE) {
      expect(label.length).toBeGreaterThan(0);
      // Duplikate sind erlaubt im realen Code (kein Bug), aber für COCO
      // wäre das verdächtig — Listen-Hygiene-Check.
      expect(seen.has(label)).toBe(false);
      seen.add(label);
    }
  });
});

describe('translateClassName', () => {
  it('übersetzt bekannte IDs auf den deutschen Namen', () => {
    expect(translateClassName(0, 'person')).toBe('Person');
    expect(translateClassName(16, 'dog')).toBe('Hund');
    expect(translateClassName(67, 'cell phone')).toBe('Handy');
  });

  it('gibt den Fallback zurück bei unbekannter ID', () => {
    expect(translateClassName(999, 'unknown')).toBe('unknown');
    expect(translateClassName(-1, 'foo')).toBe('foo');
  });
});
