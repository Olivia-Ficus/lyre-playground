export const ASSET_WIDTH = 1122;
export const ASSET_HEIGHT = 1402;
export const STRING_TOP = 180;
export const STRING_BOTTOM = 1138;
export const HIT_WIDTH = 50;

export const STRINGS = [
  { id: 0, pitch: 'D4', midi: 62, x: 410, highlighted: true },
  { id: 1, pitch: 'E4', midi: 64, x: 460, highlighted: true },
  { id: 2, pitch: 'F#4', midi: 66, x: 510, highlighted: true },
  { id: 3, pitch: 'G4', midi: 67, x: 560, highlighted: false },
  { id: 4, pitch: 'A4', midi: 69, x: 610, highlighted: true },
  { id: 5, pitch: 'B4', midi: 71, x: 660, highlighted: true },
  { id: 6, pitch: 'C#5', midi: 73, x: 710, highlighted: false },
] as const;

export type StringId = (typeof STRINGS)[number]['id'];
export type Pitch = (typeof STRINGS)[number]['pitch'];
export const frequencyFor = (id: StringId) => 440 * 2 ** ((STRINGS[id].midi - 69) / 12);
