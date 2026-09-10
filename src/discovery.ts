import { STRINGS, type StringId } from './instrument';

export type DiscoveryState = 'ARRIVAL' | 'FREE_PLAY' | 'FIVE_NOTE_PLAY' | 'NOTICE' | 'DISCOVER' | 'CONTINUE_INTENT' | 'END';
export type Milestone = 'first_string_played' | 'discovery_started' | 'five_note_exploration_completed' | 'discovery_completed' | 'discover_another_shown' | 'discover_another_clicked';
export type DiscoverySnapshot = {
  state: DiscoveryState;
  totalPlucks: number;
  fiveNotePlucks: number;
  fiveNoteStringIds: readonly StringId[];
  noticePlucks: number;
  discoverPlucks: number;
};
export type DiscoveryAction = { type: 'PLUCK'; stringId: StringId } | { type: 'CONTINUE' };
export const THRESHOLDS = { freePlay: 3, fiveNotes: 5, uniqueNotes: 3, notice: 3, discover: 2 } as const;
export const NOTICE_DELAY_MS = 1500;

export const initialDiscovery = (): DiscoverySnapshot => ({
  state: 'ARRIVAL', totalPlucks: 0, fiveNotePlucks: 0, fiveNoteStringIds: [], noticePlucks: 0, discoverPlucks: 0,
});

export function transition(previous: DiscoverySnapshot, action: DiscoveryAction): { snapshot: DiscoverySnapshot; events: Milestone[] } {
  if (action.type === 'CONTINUE') {
    return previous.state === 'CONTINUE_INTENT'
      ? { snapshot: { ...previous, state: 'END' }, events: ['discover_another_clicked'] }
      : { snapshot: previous, events: [] };
  }
  const next = { ...previous, totalPlucks: previous.totalPlucks + 1 };
  const target = STRINGS[action.stringId].highlighted;
  const enter = (state: DiscoveryState, event: Milestone) => ({ snapshot: { ...next, state }, events: [event] });

  // Select exactly one branch from the state BEFORE this pluck.
  switch (previous.state) {
    case 'ARRIVAL': return enter('FREE_PLAY', 'first_string_played');
    case 'FREE_PLAY':
      if (next.totalPlucks >= THRESHOLDS.freePlay) return enter('FIVE_NOTE_PLAY', 'discovery_started');
      break;
    case 'FIVE_NOTE_PLAY':
      if (target) {
        next.fiveNotePlucks++;
        if (!previous.fiveNoteStringIds.includes(action.stringId)) next.fiveNoteStringIds = [...previous.fiveNoteStringIds, action.stringId];
      }
      if (next.fiveNotePlucks >= THRESHOLDS.fiveNotes && next.fiveNoteStringIds.length >= THRESHOLDS.uniqueNotes) return enter('NOTICE', 'five_note_exploration_completed');
      break;
    case 'NOTICE':
      if (target) next.noticePlucks++;
      if (next.noticePlucks >= THRESHOLDS.notice) return enter('DISCOVER', 'discovery_completed');
      break;
    case 'DISCOVER':
      next.discoverPlucks++;
      if (next.discoverPlucks >= THRESHOLDS.discover) return enter('CONTINUE_INTENT', 'discover_another_shown');
      break;
    case 'CONTINUE_INTENT':
    case 'END': break;
  }
  return { snapshot: next, events: [] };
}

export const hasHighlights = (state: DiscoveryState) => state !== 'ARRIVAL' && state !== 'FREE_PLAY';
