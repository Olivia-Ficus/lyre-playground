export const ASSET_WIDTH = 1122;
export const ASSET_HEIGHT = 1402;
// Image A coordinates. Adjust attachment geometry here without changing pitches.
export const STRING_TOP = 194;
export const STRING_FREE_TOP = 246;
export const STRING_BRIDGE = 936;
export const STRING_BOTTOM = 1240;
export const INSTRUMENT_CENTER = 526;
export const TOP_SPACING = 52;
export const BRIDGE_SPACING = 35;
export const TAIL_SPACING = 12;

export const STRINGS = [
  { id: 0, pitch: 'D4', midi: 62, highlighted: true },
  { id: 1, pitch: 'E4', midi: 64, highlighted: true },
  { id: 2, pitch: 'F#4', midi: 66, highlighted: true },
  { id: 3, pitch: 'G4', midi: 67, highlighted: false },
  { id: 4, pitch: 'A4', midi: 69, highlighted: true },
  { id: 5, pitch: 'B4', midi: 71, highlighted: true },
  { id: 6, pitch: 'C#5', midi: 73, highlighted: false },
] as const;

export type StringId = (typeof STRINGS)[number]['id'];
export type Pitch = (typeof STRINGS)[number]['pitch'];
export const frequencyFor = (id: StringId) => 440 * 2 ** ((STRINGS[id].midi - 69) / 12);

export function stringGeometry(id: StringId) {
  const offset = id - 3;
  const topX = INSTRUMENT_CENTER + offset * TOP_SPACING;
  const bridgeX = INSTRUMENT_CENTER + offset * BRIDGE_SPACING;
  const tailX = INSTRUMENT_CENTER + offset * TAIL_SPACING;
  // Follow the rounded top of the existing anchor, symmetrically.
  const tailY = STRING_BOTTOM + Math.abs(offset) * 2;
  return { topX, bridgeX, tailX, tailY };
}

export function stringPath(id: StringId, displacement = 0) {
  const { topX, bridgeX, tailX, tailY } = stringGeometry(id);
  return `M ${topX} ${STRING_TOP} L ${topX} ${STRING_FREE_TOP} Q ${(topX + bridgeX) / 2 + displacement} ${(STRING_FREE_TOP + STRING_BRIDGE) / 2} ${bridgeX} ${STRING_BRIDGE} L ${tailX} ${tailY}`;
}

// Fixed, non-overlapping lanes follow the entire string including its afterlength.
export function stringHitArea(id: StringId) {
  const { topX, bridgeX, tailX } = stringGeometry(id);
  return [
    [topX - TOP_SPACING / 2, STRING_TOP], [topX + TOP_SPACING / 2, STRING_TOP],
    [topX + TOP_SPACING / 2, STRING_FREE_TOP], [bridgeX + BRIDGE_SPACING / 2, STRING_BRIDGE],
    [tailX + TAIL_SPACING / 2, STRING_BOTTOM + 10], [tailX - TAIL_SPACING / 2, STRING_BOTTOM + 10],
    [bridgeX - BRIDGE_SPACING / 2, STRING_BRIDGE], [topX - TOP_SPACING / 2, STRING_FREE_TOP],
  ].map(point => point.join(',')).join(' ');
}
