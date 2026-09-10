import type { DiscoveryState, Milestone } from './discovery';
import { STRINGS, type StringId, type Pitch } from './instrument';

export type EventName = 'session_started' | 'string_played' | Milestone;
type CommonEvent = { session_id: string; sequence: number; timestamp: number; discovery_state: DiscoveryState };
export type EventRecord = CommonEvent & (
  | { event: 'string_played'; string_id: StringId; pitch: Pitch }
  | { event: Exclude<EventName, 'string_played'> }
);
export type LocalStorageWriter = Pick<Storage, 'setItem'>;

export function createEventLogger(sessionId: string, storage: LocalStorageWriter | null, now = Date.now) {
  const records: EventRecord[] = [];
  const key = `lyre-playground:events:${sessionId}`;
  let pending: ReturnType<typeof setTimeout> | undefined;
  let persistent = storage !== null;
  function flush() {
    if (pending !== undefined) clearTimeout(pending);
    pending = undefined;
    if (!storage) return;
    try { storage.setItem(key, JSON.stringify(records)); persistent = true; }
    catch { persistent = false; }
  }
  function append(event: EventRecord) {
    records.push(event);
    if (pending === undefined) pending = setTimeout(flush, 0);
  }
  const common = (state: DiscoveryState, timestamp: number) => ({ session_id: sessionId, sequence: records.length + 1, timestamp, discovery_state: state });
  function milestone(event: Exclude<EventName, 'string_played'>, state: DiscoveryState, timestamp = now()) {
    append({ ...common(state, timestamp), event });
    flush();
  }
  function pluck(id: StringId, state: DiscoveryState, timestamp: number) {
    append({ ...common(state, timestamp), event: 'string_played', string_id: id, pitch: STRINGS[id].pitch });
  }
  milestone('session_started', 'ARRIVAL');
  return {
    pluck, milestone, flush,
    read: () => records.map((record) => ({ ...record })),
    storageStatus: () => persistent ? 'localStorage' as const : 'memory' as const,
  };
}
export type EventLogger = ReturnType<typeof createEventLogger>;

export function createBrowserLogger() {
  let storage: Storage | null = null;
  try { storage = window.localStorage; } catch { /* In-memory events remain available. */ }
  const logger = createEventLogger(crypto.randomUUID(), storage);
  const onHidden = () => { if (document.visibilityState === 'hidden') logger.flush(); };
  document.addEventListener('visibilitychange', onHidden);
  window.addEventListener('pagehide', logger.flush);
  window.lyreDebug = Object.freeze({ events: logger.read, storage: logger.storageStatus });
  return logger;
}

declare global {
  interface Window { lyreDebug: { events: EventLogger['read']; storage: EventLogger['storageStatus'] } }
}
