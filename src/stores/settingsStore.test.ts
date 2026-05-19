/**
 * settingsStore.test.ts — Tests für den Settings-Store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, selectEnabledClassIdSet } from './settingsStore';

describe('useSettingsStore', () => {
  // Vor jedem Test: Store auf Default zurücksetzen, damit Tests isoliert sind.
  beforeEach(() => {
    useSettingsStore.getState().reset();
  });

  it('startet mit allen 80 Klassen aktiv', () => {
    const state = useSettingsStore.getState();
    expect(state.enabledClassIds.length).toBe(80);
  });

  it('clampt confidenceThreshold auf [0, 1]', () => {
    const { setConfidenceThreshold } = useSettingsStore.getState();
    setConfidenceThreshold(-0.5);
    expect(useSettingsStore.getState().confidenceThreshold).toBe(0);
    setConfidenceThreshold(1.5);
    expect(useSettingsStore.getState().confidenceThreshold).toBe(1);
    setConfidenceThreshold(0.3);
    expect(useSettingsStore.getState().confidenceThreshold).toBe(0.3);
  });

  it('toggelt eine Klasse korrekt (aktiv → inaktiv → aktiv)', () => {
    const { toggleClass } = useSettingsStore.getState();

    // Person (ID 0) ist initial aktiv → erste Toggle deaktiviert.
    toggleClass(0);
    expect(useSettingsStore.getState().enabledClassIds).not.toContain(0);

    // Zweite Toggle aktiviert wieder.
    toggleClass(0);
    expect(useSettingsStore.getState().enabledClassIds).toContain(0);
  });

  it('hält die enabledClassIds sortiert nach Toggle', () => {
    // Wir starten mit allen, deaktivieren mehrere, aktivieren in willkürlicher Reihenfolge wieder.
    const { disableAllClasses, toggleClass } = useSettingsStore.getState();
    disableAllClasses();
    toggleClass(5);
    toggleClass(1);
    toggleClass(8);
    toggleClass(3);

    const ids = useSettingsStore.getState().enabledClassIds;
    expect(ids).toEqual([1, 3, 5, 8]);
  });

  it('deaktiviert/aktiviert alle Klassen mit den Bulk-Aktionen', () => {
    const { disableAllClasses, enableAllClasses } = useSettingsStore.getState();
    disableAllClasses();
    expect(useSettingsStore.getState().enabledClassIds).toEqual([]);

    enableAllClasses();
    expect(useSettingsStore.getState().enabledClassIds.length).toBe(80);
  });

  it('setzt setSelectedModelId korrekt', () => {
    const { setSelectedModelId } = useSettingsStore.getState();
    setSelectedModelId('yolo11n-coco');
    expect(useSettingsStore.getState().selectedModelId).toBe('yolo11n-coco');
  });

  it('selectEnabledClassIdSet liefert ein Set mit denselben IDs', () => {
    const { toggleClass } = useSettingsStore.getState();
    toggleClass(0); // 0 deaktivieren
    const set = selectEnabledClassIdSet(useSettingsStore.getState());
    expect(set.has(0)).toBe(false);
    expect(set.has(1)).toBe(true);
    expect(set.size).toBe(79);
  });
});
