# Lyre Playground MVP — implementation plan

Updated September 10, 2026, before implementation. The user's approved body image replaces the previous SVG-body plan. All Discovery, audio, event and acceptance requirements remain unchanged. The PRD is product reference; the user's latest request controls this asset decision.

## 1. Current Repository Assessment

Greenfield Git repository, no commits or application files. Use React, TypeScript, Vite, plain CSS, native Web Audio, Vitest and a small Playwright suite. No application server, router or UI framework.

## 2. Implementation Assumptions

- First pluck enters FREE_PLAY; the third cumulative pluck enters FIVE_NOTE_PLAY (three total, not six).
- Reduce the Palette and Play Within Five Notes map to FIVE_NOTE_PLAY.
- A boundary pluck belongs only to its starting state, never the next state too.
- NOTICE auxiliary copy appears after 1,500ms; this is not a mandatory wait before the three new target plucks can reveal.
- G4/C#5 do not advance or reset target counters. Any two new plucks after reveal show the CTA.
- Highlighting persists through END. All seven strings stay playable throughout.
- One page load is one session. discovery_started means entry to FIVE_NOTE_PLAY; exploration_completed means entry to NOTICE; discovery_completed means entry to DISCOVER.
- Preserve the required sentence “There is no wrong note.” despite AC-08's ban on evaluative Wrong feedback.
- Count successful audio scheduling on a running context, not failed audio attempts. Hardware audibility cannot be detected.
- The approved 1122 × 1402 transparent PNG is immutable. Seven vertical strings attach at y=180 on the crossbar and y=1138 on the existing bridge, at x=410,460,510,560,610,660,710. No body geometry is added.
- The image's narrow bridge constrains vertical string spacing. Use tall, distinct 50-asset-unit hit lanes; the recommended ~40 CSS-pixel width cannot be achieved on small phones without overlapping targets or changing the approved geometry. This remains a documented manual touch-usability risk, not a reason to distort the image.

## 3. Architecture Decision

App composes presentation and Lyre. Lyre renders the supplied image as its base layer and a same-aspect SVG overlay containing only strings, vibration, highlight/de-emphasis and invisible targets. No arms, crossbar, soundbox, bridge, grain or decorative SVG shapes are drawn.

UI → usePlayground controller → audio engine + pure discovery transition + local event logger → React snapshot.

Lyre owns string animation. The controller owns ordered accepted plucks, state and Notice timer. discovery.ts owns every threshold and milestone. audio.ts owns all sound internals. events.ts owns local records and persistence. copy.ts owns exact product copy. No event bus or global-state library.

## 4. Proposed File Structure

- package.json / package-lock.json: scripts and reproducible dependencies.
- index.html / tsconfig.json / vite.config.ts: app entry and strict Vite/TS configuration.
- playwright.config.ts: compact browser test configuration.
- .gitignore: generated files excluded.
- IMPLEMENTATION_PLAN.md: this authoritative execution plan and approved visual amendment.
- README.md: running, checks, local log inspection and manual limitations.
- src/main.tsx: session construction and React mount.
- src/App.tsx: prompt → instrument → feedback/CTA composition.
- src/assets/lyre-body.png: byte-for-byte copy of the approved supplied PNG.
- src/instrument.ts: typed pitch map, target membership and asset-space attachment coordinates.
- src/Lyre.tsx: fixed body image plus interactive SVG strings and stationary targets only.
- src/DiscoveryPresentation.tsx: state-specific prompt, feedback, CTA and End.
- src/copy.ts: exact PRD copy.
- src/discovery.ts: pure seven-state deterministic transition function.
- src/usePlayground.ts: ordered plucks, audio/status coordination and Notice timer.
- src/audio.ts: local plucked-string synthesis and overlapping voice lifecycle.
- src/events.ts: session log, sequence, persistence and developer read function.
- src/styles.css: warm page tokens, typography, aligned image/overlay layout and permitted motion.
- tests/discovery.test.ts: counters, transitions and milestones.
- tests/events.test.ts: record shape and persistence failure.
- tests/audio.test.ts: generated signal pitch and decay at common browser sample rates.
- tests/playground.spec.ts: complete browser funnel, touch, overlay geometry and accessibility checks.

## 5. Discovery State Model

Every accepted pluck emits string_played with its pitch, original activation timestamp and PRE-transition discovery_state. Milestones identify the entered state. Every state permits all seven strings.

| State | UI | Required interaction data | Transition | Entry event |
|---|---|---|---|---|
| ARRIVAL | Play something. / There is no wrong note. Equal strings. | total=0 | First pluck → FREE_PLAY | session_started |
| FREE_PLAY | Same Arrival copy; equal strings | total | Third total pluck → FIVE_NOTE_PLAY | first_string_played |
| FIVE_NOTE_PLAY | Now try only these five. / Any order. Any rhythm. D E F# A B highlighted | fresh target count + unique target IDs | ≥5 target plucks AND ≥3 unique → NOTICE | discovery_started |
| NOTICE | Notice anything? / after 1500ms: Try mixing them again. | fresh notice target count | ≥3 new target plucks → DISCOVER | five_note_exploration_completed |
| DISCOVER | You just found a pentatonic scale. / Five notes that naturally leave a lot of room to play. / Keep playing for a moment. | fresh post-reveal count | ≥2 new plucks, any string → CONTINUE_INTENT | discovery_completed |
| CONTINUE_INTENT | Retain reveal, add Discover another sound / There are many more ways to change how these seven strings feel. | none | Explicit CTA activation → END | discover_another_shown |
| END | More discoveries coming soon. / You found your first sound. No CTA. | only ongoing pluck log | terminal | discover_another_clicked |

Process one state branch per action. Never cascade transitions. The shortest path takes 13 plucks and a CTA click. Duplicate CTA actions outside CONTINUE_INTENT do nothing.

## 6. Audio Strategy

Use native Web Audio synthesis: cached, locally generated Karplus–Strong-style plucked buffers, fractional pitch tuning, brief attack and 2–3 second natural decay. Unlike external samples this needs no recordings, asset licensing or network loading. It needs early listening/timbre tuning. Each pluck creates a new source so even repeated same-string notes overlap. Conservative gain and a shared compressor prevent harsh summed peaks. Initialize/resume on the actual gesture; retry failed initialization without advancing Discovery. Validate iOS/Android physically; automated tests cannot prove perceived latency or audibility.

## 7. Visual Implementation Plan

Use the approved image directly; do not crop, stretch, filter, redraw or approximate it. A single responsive wrapper has aspect-ratio 1122 / 1402. The img fills its width with auto height; the absolute SVG occupies the same bounds with viewBox="0 0 1122 1402" and preserveAspectRatio="xMidYMid meet". Both scale together. Desktop width approximately 460px; mobile approximately 88vw.

Seven straight strings run from the visible crossbar at y=180 to the existing lower bridge at y=1138, using the x coordinates in instrument.ts. Visible string paths bend around a vibrating midpoint while endpoints remain fixed. Invisible hit rectangles never animate and remain siblings of visible paths. No decorative overlay geometry is permitted.

Keep background #F3EFE6, primary #2C2924, secondary #736D63, strings #B8AA93, highlights #D3A65A. Dim other strings but keep them playable. Warm body color comes from the supplied image, not CSS recoloring. Georgia prompt at 32–40px desktop / 26–32px mobile, supporting text 16–18px. Only 450ms damped vibration and subtle prompt/highlight/CTA fades. Reduced motion uses a restrained string pulse.

Quiet wordmark → Prompt → largest visual object (lyre) → Feedback/CTA. Allow vertical scrolling on short screens. Mouse/touch pointerdown once per pluck, keyboard Enter/Space, neutral String 1–7 accessible names. No drag strumming, visible pitch labels, progress UI or body decoration.

## 8. Implementation Sequence

1. Shell: scaffold Vite/React/TS, copy approved asset unchanged, build aspect-matched image + SVG strings, render Arrival. Files: configuration, main, App, Lyre, instrument, styles, asset. Done: dev/build run and aligned body/string shell is visible.
2. Interaction/audio: string activation, stationary targets, vibration and synthesized overlap. Files: Lyre, audio, controller. Done: seven independent pitches play from direct activation.
3. Discovery: pure state machine, thresholds and exact copy. Files: discovery, controller, copy, presentation, logic tests. Done: 13 plucks reach CTA with no premature reveal.
4. Events/End: browser-local log, guarded voluntary CTA, terminal copy and persistent instrument. Files: events, controller, main, event tests. Done: complete ordered funnel and exactly one Goal Event.
5. Responsive/acceptance: browser tests and visual QA across viewports. Files: CSS, Lyre, browser tests, README. Done: aligned unchanged asset, no target motion, full desktop/touch funnel, build and tests pass; remaining physical-device checks clearly recorded.

Each increment leaves the application runnable.

## 9. Acceptance Mapping

- AC-01: browser opens Arrival and plucks without a Start/auth/tutorial control.
- AC-02: exact seven pitches verified in definitions and per-string event/audio scheduling tests.
- AC-03: source overlap checked automatically; natural decay, real latency and timbre checked manually.
- AC-04: pluck animates only its corresponding visible string, endpoints and hit targets stay fixed; manual sound/motion alignment.
- AC-05: pure state guards, no cascades, no timer-only progression and full pluck-driven browser path.
- AC-06: no forbidden theory in rendered or accessible pre-reveal UI; negative threshold tests.
- AC-07: exact five targets visually distinguished; G/C# remain playable and do not advance target counters.
- AC-08: no evaluative copy; exact required Arrival sentence is exempt.
- AC-09: all eight event types, proper order, one milestone each and per-pluck payloads in browser tests.
- AC-10: CTA alone emits goal and enters exact End copy; repeated clicks cannot duplicate; End instrument still plays.
- AC-11: desktop and mobile layouts show all targets, readable prompts and usable final CTA; physical touch checks remain manual.
- AC-12: Prompt → Lyre → Feedback/CTA; approved asset copied byte-for-byte; image natural ratio equals SVG coordinate ratio; attachment positions and overlay bounds checked at desktop/mobile; no SVG body/decorative geometry, prohibited chrome or decorative sections. Manual visual inspection confirms the supplied image is unchanged and dominant.

## 10. Risks / Unknowns

Timbre/first-note mobile latency: tune early, verify on real devices. Rapid input: synchronous current snapshot and ordered activation handling. localStorage failure: in-memory fallback. Approved bridge width: long distinct hit lanes and explicit small-phone usability check; never distort or repaint the asset to widen targets. Product sample collection: manual log collection, no external analytics.

## 11. Out-of-Scope Guardrail

No second Discovery, lessons/Next flow, modes, songs, notation, rhythm/chord course, alternate tuning, microphone/MIDI, accounts, saved progress, streaks, scoring, achievements, favorites, AI teacher, community, affiliate/products, newsletter, payment, backend/database/CMS/analytics SaaS, SEO content, navbar/sidebar/cards/dashboard/progress/decorations. No body regeneration or decorative SVG additions. No new generic framework or workflow engine.

## 12. Execution Ready Check

READY FOR IMPLEMENTATION. First step: scaffold the Vite shell, copy the supplied PNG to src/assets/lyre-body.png unchanged, and overlay seven strings in the asset's 1122 × 1402 coordinate space.
