import { useEffect, useRef } from 'react';
import body from './assets/lyre-body.png';
import { ASSET_WIDTH, ASSET_HEIGHT, STRINGS, STRING_TOP, STRING_BOTTOM, HIT_WIDTH, type StringId } from './instrument';

type Props = {
  highlighted?: boolean;
  revisions?: readonly number[];
  onPluck: (id: StringId) => void;
};

function LyreString({ id, highlighted, revision, onPluck }: {
  id: StringId; highlighted: boolean; revision: number; onPluck: Props['onPluck'];
}) {
  const path = useRef<SVGPathElement>(null);
  const string = STRINGS[id];
  const rest = `M ${string.x} ${STRING_TOP} Q ${string.x} ${(STRING_TOP + STRING_BOTTOM) / 2} ${string.x} ${STRING_BOTTOM}`;

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
      element.setAttribute('d', `M ${string.x} ${STRING_TOP} Q ${string.x + displacement} ${(STRING_TOP + STRING_BOTTOM) / 2} ${string.x} ${STRING_BOTTOM}`);
      if (t < 1) frame = requestAnimationFrame(tick);
      else element.setAttribute('d', rest);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); element.setAttribute('d', rest); };
  }, [revision, rest, string.x]);

  const tone = !highlighted ? 'neutral' : string.highlighted ? 'highlighted' : 'muted';
  return (
    <g className={`lyre-string ${tone}`} data-string-id={id} data-tone={tone}>
      <path ref={path} className="string-line" d={rest} data-revision={revision} aria-hidden="true" />
      <rect
        className="string-target" x={string.x - HIT_WIDTH / 2} y={STRING_TOP}
        width={HIT_WIDTH} height={STRING_BOTTOM - STRING_TOP}
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
    <div className="lyre" role="group" aria-label="Seven-string lyre">
      <img className="lyre-body" src={body} width={ASSET_WIDTH} height={ASSET_HEIGHT} alt="" draggable={false} />
      <svg className="lyre-overlay" viewBox={`0 0 ${ASSET_WIDTH} ${ASSET_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
        {STRINGS.map(({ id }) => <LyreString key={id} id={id} highlighted={highlighted} revision={revisions[id] ?? 0} onPluck={onPluck} />)}
      </svg>
    </div>
  );
}
