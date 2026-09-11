import { useEffect, useId, useRef } from 'react';
import body from './assets/lyre-body.png';
import { ASSET_WIDTH, ASSET_HEIGHT, STRINGS, INSTRUMENT_CENTER, stringPath, stringHitArea, type StringId } from './instrument';

type Props = {
  highlighted?: boolean;
  revisions?: readonly number[];
  onPluck: (id: StringId) => void;
};

function LyreString({ id, highlighted, revision, onPluck }: {
  id: StringId; highlighted: boolean; revision: number; onPluck: Props['onPluck'];
}) {
  const path = useRef<SVGPathElement>(null);
  const pathId = useId();
  const string = STRINGS[id];
  const rest = stringPath(id);

  useEffect(() => {
    if (!revision || !path.current) return;
    const element = path.current;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const animation = element.animate([{ opacity: 1 }, { opacity: 0.65 }, { opacity: 1 }], { duration: 180 });
      return () => animation.cancel();
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 450, 1);
      const displacement = Math.sin(t * Math.PI * 14) * 18 * (1 - t) ** 2;
      element.setAttribute('d', stringPath(id, displacement));
      if (t < 1) frame = requestAnimationFrame(tick);
      else element.setAttribute('d', rest);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); element.setAttribute('d', rest); };
  }, [revision, rest, id]);

  const tone = !highlighted ? 'neutral' : string.highlighted ? 'highlighted' : 'muted';
  return (
    <g className={`lyre-string ${tone}`} data-string-id={id} data-tone={tone}>
      <path id={pathId} ref={path} className="string-line" d={rest} data-revision={revision} aria-hidden="true" />
      <use href={`#${pathId}`} className="string-core" aria-hidden="true" />
      <polygon
        className="string-target" points={stringHitArea(id)}
        role="button" tabIndex={0} aria-label={`String ${id + 1}`}
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          onPluck(id);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!event.repeat) onPluck(id);
          }
        }}
        onClick={(event) => { if (event.detail === 0) onPluck(id); }}
      />
    </g>
  );
}

export function Lyre({ highlighted = false, revisions = [], onPluck }: Props) {
  return (
    <div className="lyre" role="group" aria-label="Seven-string lyre" style={{ transform: `translateX(${(ASSET_WIDTH / 2 - INSTRUMENT_CENTER) / ASSET_WIDTH * 100}%)` }}>
      <img className="lyre-body" src={body} width={ASSET_WIDTH} height={ASSET_HEIGHT} alt="" draggable={false} />
      <svg className="lyre-overlay" viewBox={`0 0 ${ASSET_WIDTH} ${ASSET_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
        {STRINGS.map(({ id }) => <LyreString key={id} id={id} highlighted={highlighted} revision={revisions[id] ?? 0} onPluck={onPluck} />)}
      </svg>
    </div>
  );
}
