import { describe, expect, it } from 'vitest';
import { initialDiscovery, transition, type DiscoverySnapshot, type Milestone } from '../src/discovery';
import { STRINGS, type StringId } from '../src/instrument';

function play(ids: StringId[], start = initialDiscovery()) {
  let snapshot = start;
  const events: Milestone[] = [];
  for (const stringId of ids) {
    const result = transition(snapshot, { type: 'PLUCK', stringId });
    snapshot = result.snapshot;
    events.push(...result.events);
  }
  return { snapshot, events };
}
const palette = () => play([0, 1, 2]).snapshot;
const notice = () => play([0, 1, 2, 0, 1], palette()).snapshot;
const discover = () => play([0, 4, 5], notice()).snapshot;

describe('Discovery behavior', () => {
  it('uses three total initial plucks, never six or a boundary double count', () => {
    const first = play([0]);
    expect(first.snapshot.state).toBe('FREE_PLAY');
    expect(first.events).toEqual(['first_string_played']);
    expect(play([1], first.snapshot).snapshot.state).toBe('FREE_PLAY');
    expect(palette()).toMatchObject({ state: 'FIVE_NOTE_PLAY', totalPlucks: 3, fiveNotePlucks: 0, fiveNoteStringIds: [] });
  });

  it('requires both five target plucks and three distinct targets', () => {
    const two = play([0, 1, 0, 1, 0, 1, 0], palette()).snapshot;
    expect(two.state).toBe('FIVE_NOTE_PLAY');
    expect(two.fiveNoteStringIds).toEqual([0, 1]);
    expect(play([2], two).snapshot.state).toBe('NOTICE');
    expect(play([0, 1, 2], palette()).snapshot.state).toBe('FIVE_NOTE_PLAY');
    expect(notice()).toMatchObject({ state: 'NOTICE', fiveNotePlucks: 5, noticePlucks: 0 });
  });

  it('never counts muted strings toward exploration or resets target progress', () => {
    const result = play([0, 3, 1, 6, 2, 3, 6, 0], palette());
    expect(result.snapshot).toMatchObject({ state: 'FIVE_NOTE_PLAY', fiveNotePlucks: 4, fiveNoteStringIds: [0, 1, 2] });
    expect(play([5], result.snapshot).snapshot.state).toBe('NOTICE');
  });

  it('requires three NEW highlighted plucks in Notice and two NEW any-string plucks after reveal', () => {
    const beforeReveal = play([0, 3, 6, 1], notice()).snapshot;
    expect(beforeReveal).toMatchObject({ state: 'NOTICE', noticePlucks: 2, discoverPlucks: 0 });
    const revealed = play([4], beforeReveal);
    expect(revealed.snapshot).toMatchObject({ state: 'DISCOVER', noticePlucks: 3, discoverPlucks: 0 });
    expect(revealed.events).toEqual(['discovery_completed']);
    expect(play([3], revealed.snapshot).snapshot.state).toBe('DISCOVER');
    expect(play([3, 6], revealed.snapshot)).toMatchObject({ snapshot: { state: 'CONTINUE_INTENT' }, events: ['discover_another_shown'] });
  });

  it('completes the 13-pluck funnel only with a voluntary CTA action', () => {
    const result = play([0, 1, 2, 0, 1, 2, 0, 1, 0, 4, 5, 3, 6]);
    expect(result.snapshot).toMatchObject({ totalPlucks: 13, state: 'CONTINUE_INTENT' });
    expect(result.events).toEqual(['first_string_played', 'discovery_started', 'five_note_exploration_completed', 'discovery_completed', 'discover_another_shown']);
    const stillPlaying = play([0, 3, 6], result.snapshot);
    expect(stillPlaying.snapshot.state).toBe('CONTINUE_INTENT');
    expect(stillPlaying.events).toEqual([]);
    const end = transition(stillPlaying.snapshot, { type: 'CONTINUE' });
    expect(end.snapshot.state).toBe('END');
    expect(end.events).toEqual(['discover_another_clicked']);
    expect(transition(end.snapshot, { type: 'CONTINUE' }).events).toEqual([]);
    expect(play([0, 1, 2, 3, 4, 5, 6], end.snapshot).snapshot).toMatchObject({ state: 'END', totalPlucks: 23 });
  });

  it('ignores premature CTA actions in every earlier state', () => {
    for (const snapshot of [initialDiscovery(), play([0]).snapshot, palette(), notice(), discover()]) {
      expect(transition(snapshot, { type: 'CONTINUE' })).toEqual({ snapshot, events: [] });
    }
  });

  it('does not mutate prior state or unique string arrays', () => {
    const previous: DiscoverySnapshot = palette();
    Object.freeze(previous);
    Object.freeze(previous.fiveNoteStringIds);
    expect(play([0, 1, 2, 0, 1], previous).snapshot.state).toBe('NOTICE');
    expect(previous.fiveNoteStringIds).toEqual([]);
  });

  it('fixes pitches and highlighted membership to the PRD', () => {
    expect(STRINGS.map(s => s.pitch)).toEqual(['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5']);
    expect(STRINGS.filter(s => s.highlighted).map(s => s.pitch)).toEqual(['D4', 'E4', 'F#4', 'A4', 'B4']);
  });
});
