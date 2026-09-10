# Lyre Playground MVP

A single musical experience: play seven strings, explore five, notice, discover, and voluntarily ask for another sound. The project has no application backend, accounts, remote analytics, or second Discovery.

## Run

Requires Node 22.12+ and npm.

```sh
npm ci
npm run dev
```

Vite prints the local URL. To serve the production build: `npm run build` then `npm run preview`.

## Verify

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Vitest covers transition boundaries, unique-target counters, milestone guards, storage failure, and synthesized signal pitch/decay at 44.1/48kHz. Playwright covers the full desktop and emulated-touch flow, negative thresholds, keyboard activation, fixed responsive overlay geometry, unchanged asset checksum, audio failure, in-memory logging, and real Web Audio voice scheduling/overlap. Emulation does not replace physical-device listening and touch validation.

## Approved visual asset

`src/assets/lyre-body.png` is an unmodified copy of the supplied **ChatGPT Image Sep 10, 2026, 03_35_59 PM.png** (1122 × 1402, RGBA).

SHA-256: `bf4fa6c6162445ee4753908a1379ca70b0105974516736cb6782342444df8aa9`.

The responsive image preserves its natural aspect ratio. The SVG overlay uses `viewBox="0 0 1122 1402"` and the same bounds. It contains exactly seven visible string paths and seven invisible rectangular interaction targets, with no instrument-body or decorative geometry. Endpoints attach at y=180 and y=1138; x positions are 410–710 in 50-unit steps. Vibration changes only the path midpoint; endpoints and hit targets remain fixed.

The bridge is narrow. Distinct hit lanes are about 20.5 CSS pixels wide at the 460px desktop image size, and 12.5px at a 320px viewport (88vw image). They span almost the full playable string length. Achieving seven separate ~40px widths would require changing this geometry or the prescribed mobile image size; neither is done. Physical touch usability is an explicit acceptance item.

## State and copy ownership

- `src/discovery.ts`: seven states, thresholds and pure transitions.
- `src/copy.ts`: exact PRD copy.
- `src/usePlayground.ts`: ordered accepted plucks, React state, audio status and Notice timer.
- `src/instrument.ts`: pitches, target membership, image-space string coordinates.
- `src/audio.ts`: reusable synthesized pluck buffers and independent voices.
- `src/events.ts`: session and browser-local event records.
- `IMPLEMENTATION_PLAN.md`: complete updated plan, assumptions and AC-01–AC-12 mapping.

The first pluck enters FREE_PLAY; the third total enters FIVE_NOTE_PLAY. The next five highlighted plucks must use at least three unique target strings. The next three highlighted plucks reveal. Two additional plucks on any strings show the CTA. Only activating the CTA records the Goal and enters END. A pluck counts toward its starting state only. The Notice delay is auxiliary copy only, not a time gate.

## Local event inspection

In the browser developer console:

```js
window.lyreDebug.events()
window.lyreDebug.storage()
```

`events()` returns a copy, not mutable live state. It cannot play strings or advance Discovery. Each page load has a fresh session ID. Records persist under `lyre-playground:events:<sessionId>` when localStorage is available; otherwise they remain in memory for that page load. Normal pluck writes are deferred; milestones/CTA and page hiding flush immediately. Reload starts a fresh Discovery and does not delete previous stored sessions.

Every record includes session ID, sequence, timestamp (epoch milliseconds) and discovery state. A `string_played` includes string ID and pitch and records the state before its transition. Required milestone events occur once per session. Audio failures do not produce successful pluck records or advance the funnel.

Continue Intent Rate is sessions with `discover_another_clicked` divided by sessions with `discovery_completed`. Collect non-developer test-session records manually for the first ≥20 real sessions. No collection service or metrics UI is included; developer test sessions are not evidence of product success.

## Manual acceptance still required

- Listen on physical iOS Safari and Android Chrome: first-touch unlock, warm plucked timbre, low perceived latency, natural decay, repeated-note overlap, and resuming after background interruption.
- Check that visible vibration feels tied to the sound; check reduced-motion feedback.
- Complete the flow using fingers on small phones, especially adjacent strings with the approved narrow bridge.
- Check desktop/mobile visual fidelity and enlarged text: Prompt → Lyre → Feedback/CTA, no clipped instrument or controls, with vertical scrolling allowed on short screens.

Shortest manual path (string numbers left to right): **1,2,3 → 1,2,3,1,2 → 1,5,6 → 4,7 → Discover another sound**. End displays “More discoveries coming soon.” / “You found your first sound.” All seven strings remain playable.

Implementation checks completed September 10, 2026: 13 logic/event/audio tests passed; all 14 browser cases passed across desktop and emulated touch (the two added overlap cases and updated checksum cases were run as a focused follow-up). TypeScript and production build passed. The supplied and repository asset checksums match. The in-app browser was also used to complete the funnel and inspect image/string attachment; mobile image and overlay bounds matched exactly at a 360px viewport. Physical-phone checks above remain outstanding.

## Scope and deployment

Static Vite output goes to `dist/`. The optional `.openai/hosting.json` identifies the private Sites hosting target; it adds no application backend or analytics. No WebMCP flow controls are added: the product explicitly requires user instrument interaction and a voluntary CTA, and excludes additional generic systems.

Do not add a second Discovery, courses, scores, saved progress, accounts, MIDI, microphone access, commerce, extra theory, navigation, decorative SVG body geometry, or external analytics.
