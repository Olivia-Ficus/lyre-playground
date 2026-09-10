import { COPY, CTA, CTA_SUPPORTING, NOTICE_SUPPORTING } from './copy';
import type { DiscoveryState } from './discovery';

export function DiscoveryPrompt({ state, noticeReady }: { state: DiscoveryState; noticeReady: boolean }) {
  const { prompt, supporting } = COPY[state];
  return (
    <section className="prompt" aria-live="polite" aria-atomic="true">
      <div key={prompt} className="copy-fade">
        <h1>{prompt}</h1>
        {supporting && <p>{supporting}</p>}
        {state === 'NOTICE' && noticeReady && <p className="copy-fade">{NOTICE_SUPPORTING}</p>}
      </div>
    </section>
  );
}

export function DiscoveryFeedback({ state, onContinue, audioError }: {
  state: DiscoveryState; onContinue: () => void; audioError: string | null;
}) {
  const { explanation, invitation } = COPY[state];
  return (
    <section className="feedback" aria-live="polite">
      <div key={explanation} className="copy-fade">
        {explanation && <p>{explanation}</p>}
        {invitation && <p className="keep-playing">{invitation}</p>}
      </div>
      {state === 'CONTINUE_INTENT' && (
        <div className="cta-area copy-fade">
          <button type="button" className="cta" onClick={onContinue}>{CTA}</button>
          <p>{CTA_SUPPORTING}</p>
        </div>
      )}
      {audioError && <p className="audio-status" role="status">{audioError}</p>}
    </section>
  );
}
