import { Lyre } from './Lyre';
import { DiscoveryPrompt, DiscoveryFeedback } from './DiscoveryPresentation';
import { hasHighlights } from './discovery';
import type { EventLogger } from './events';
import { usePlayground } from './usePlayground';

export default function App({ logger }: { logger: EventLogger }) {
  const { snapshot, revisions, noticeReady, audioError, pluck, continueDiscovery } = usePlayground(logger);
  return (
    <main className="playground" data-discovery-state={snapshot.state}>
      <div className="wordmark">Lyre Playground</div>
      <DiscoveryPrompt state={snapshot.state} noticeReady={noticeReady} />
      <Lyre highlighted={hasHighlights(snapshot.state)} revisions={revisions} onPluck={pluck} />
      <DiscoveryFeedback state={snapshot.state} onContinue={continueDiscovery} audioError={audioError} />
    </main>
  );
}
