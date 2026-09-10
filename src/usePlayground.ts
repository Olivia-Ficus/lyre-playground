import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioEngine } from './audio';
import { AUDIO_UNAVAILABLE } from './copy';
import { initialDiscovery, NOTICE_DELAY_MS, transition } from './discovery';
import type { EventLogger } from './events';
import type { StringId } from './instrument';

type PendingPluck = { id: StringId; timestamp: number; result: boolean | null };

export function usePlayground(logger: EventLogger) {
  const current = useRef(initialDiscovery());
  const [snapshot, setSnapshot] = useState(current.current);
  const [revisions, setRevisions] = useState(Array<number>(7).fill(0));
  const [audioError, setAudioError] = useState<string | null>(null);
  const [noticeReady, setNoticeReady] = useState(false);
  const [audio] = useState(createAudioEngine);
  const queue = useRef<PendingPluck[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; queue.current = []; audio.dispose(); logger.flush(); };
  }, [audio, logger]);

  useEffect(() => {
    setNoticeReady(false);
    if (snapshot.state !== 'NOTICE') return;
    const timer = setTimeout(() => setNoticeReady(true), NOTICE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [snapshot.state]);

  const pluck = useCallback((id: StringId) => {
    const ticket: PendingPluck = { id, timestamp: Date.now(), result: null };
    queue.current.push(ticket);
    const complete = (success: boolean) => {
      if (!mounted.current) return;
      ticket.result = success;
      // Preserve activation order even if an initial resume finishes asynchronously.
      while (queue.current.length && queue.current[0].result !== null) {
        const next = queue.current.shift()!;
        if (!next.result) { setAudioError(AUDIO_UNAVAILABLE); continue; }
        setAudioError(null);
        const previous = current.current;
        logger.pluck(next.id, previous.state, next.timestamp);
        const result = transition(previous, { type: 'PLUCK', stringId: next.id });
        current.current = result.snapshot;
        for (const event of result.events) logger.milestone(event, result.snapshot.state, next.timestamp);
        setSnapshot(result.snapshot);
        setRevisions((old) => old.map((value, index) => value + Number(index === next.id)));
      }
    };
    const result = audio.play(id);
    if (typeof result === 'boolean') complete(result);
    else void result.then(complete, () => complete(false));
  }, [audio, logger]);

  const continueDiscovery = useCallback(() => {
    const result = transition(current.current, { type: 'CONTINUE' });
    if (!result.events.length) return;
    current.current = result.snapshot;
    for (const event of result.events) logger.milestone(event, result.snapshot.state);
    setSnapshot(result.snapshot);
  }, [logger]);

  return { snapshot, revisions, noticeReady, audioError, pluck, continueDiscovery };
}
