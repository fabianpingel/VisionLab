/**
 * ============================================================================
 * cocoLabelsDe.ts — Deutsche Übersetzung der 80 COCO-Klassennamen
 * ============================================================================
 *
 * YOLO11 ist auf dem COCO-Datensatz vortrainiert. Die Klassennamen sind
 * dort englisch ("person", "car", "remote", ...). Für die UI brauchen wir
 * deutsche Bezeichnungen.
 *
 * Reihenfolge entspricht der COCO-Klassen-ID (0..79) — diese Liste KANN
 * direkt als `string[]` für Index-Zugriff genutzt werden.
 *
 * Quelle: offizielle COCO-Klassen-Liste (cocodataset.org), übersetzt.
 */

/**
 * Liste der deutschen Klassennamen in COCO-Reihenfolge.
 * Index = COCO-Klassen-ID.
 */
export const COCO_LABELS_DE: ReadonlyArray<string> = [
  'Person', // 0
  'Fahrrad', // 1
  'Auto', // 2
  'Motorrad', // 3
  'Flugzeug', // 4
  'Bus', // 5
  'Zug', // 6
  'LKW', // 7
  'Boot', // 8
  'Ampel', // 9
  'Hydrant', // 10
  'Stoppschild', // 11
  'Parkuhr', // 12
  'Bank', // 13
  'Vogel', // 14
  'Katze', // 15
  'Hund', // 16
  'Pferd', // 17
  'Schaf', // 18
  'Kuh', // 19
  'Elefant', // 20
  'Bär', // 21
  'Zebra', // 22
  'Giraffe', // 23
  'Rucksack', // 24
  'Regenschirm', // 25
  'Handtasche', // 26
  'Krawatte', // 27
  'Koffer', // 28
  'Frisbee', // 29
  'Ski', // 30
  'Snowboard', // 31
  'Ball', // 32
  'Drachen', // 33
  'Baseballschläger', // 34
  'Baseballhandschuh', // 35
  'Skateboard', // 36
  'Surfbrett', // 37
  'Tennisschläger', // 38
  'Flasche', // 39
  'Weinglas', // 40
  'Tasse', // 41
  'Gabel', // 42
  'Messer', // 43
  'Löffel', // 44
  'Schüssel', // 45
  'Banane', // 46
  'Apfel', // 47
  'Sandwich', // 48
  'Orange', // 49
  'Brokkoli', // 50
  'Karotte', // 51
  'Hotdog', // 52
  'Pizza', // 53
  'Donut', // 54
  'Kuchen', // 55
  'Stuhl', // 56
  'Sofa', // 57
  'Topfpflanze', // 58
  'Bett', // 59
  'Esstisch', // 60
  'Toilette', // 61
  'Fernseher', // 62
  'Laptop', // 63
  'Maus', // 64
  'Fernbedienung', // 65
  'Tastatur', // 66
  'Handy', // 67
  'Mikrowelle', // 68
  'Backofen', // 69
  'Toaster', // 70
  'Spüle', // 71
  'Kühlschrank', // 72
  'Buch', // 73
  'Uhr', // 74
  'Vase', // 75
  'Schere', // 76
  'Teddybär', // 77
  'Föhn', // 78
  'Zahnbürste', // 79
];

/**
 * Liefert den deutschen Namen für eine COCO-Klassen-ID.
 *
 * Fallback: Wenn die ID außerhalb des Bereichs liegt, wird der englische
 * Original-Name zurückgegeben (z.B. bei Custom-Modellen mit anderen Klassen).
 *
 * @param classId Numerische Klassen-ID aus dem Modell.
 * @param fallbackEnglish Englischer Name als Fallback.
 * @returns Deutscher Name oder Fallback.
 */
export function translateClassName(classId: number, fallbackEnglish: string): string {
  if (classId >= 0 && classId < COCO_LABELS_DE.length) {
    return COCO_LABELS_DE[classId];
  }
  return fallbackEnglish;
}
