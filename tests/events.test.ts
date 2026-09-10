import { describe, expect, it, vi } from 'vitest';
import { createEventLogger } from '../src/events';

describe('local session records', () => {
  it('records ordered typed plucks with the pre-transition state and retains session data', () => {
    const setItem = vi.fn();
    const log = createEventLogger('example-session', { setItem }, () => 100);
    log.pluck(2, 'ARRIVAL', 101);
    log.milestone('first_string_played', 'FREE_PLAY', 101);
    expect(log.read()).toEqual([
      { event: 'session_started', session_id: 'example-session', sequence: 1, timestamp: 100, discovery_state: 'ARRIVAL' },
      { event: 'string_played', string_id: 2, pitch: 'F#4', session_id: 'example-session', sequence: 2, timestamp: 101, discovery_state: 'ARRIVAL' },
      { event: 'first_string_played', session_id: 'example-session', sequence: 3, timestamp: 101, discovery_state: 'FREE_PLAY' },
    ]);
    expect(setItem).toHaveBeenLastCalledWith('lyre-playground:events:example-session', JSON.stringify(log.read()));
    expect(log.storageStatus()).toBe('localStorage');
  });

  it('retains inspectable records when storage is absent or throws', () => {
    for (const storage of [null, { setItem: () => { throw new Error('Quota exceeded'); } }]) {
      const log = createEventLogger('private-session', storage);
      log.pluck(6, 'END', 200);
      expect(() => log.flush()).not.toThrow();
      expect(log.read()).toHaveLength(2);
      expect(log.storageStatus()).toBe('memory');
    }
  });

  it('does not expose mutable records through the developer inspector', () => {
    const log = createEventLogger('readonly', null);
    const events = log.read();
    events[0].timestamp = -1;
    events.pop();
    expect(log.read()).toHaveLength(1);
    expect(log.read()[0].timestamp).toBeGreaterThan(0);
    log.flush();
  });
});
