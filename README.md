# Lyre Playground

Lyre Playground explores a different way of learning music:

**Play → Notice → Discover**

Instead of teaching theory first, it lets you interact with a seven-string lyre and discover musical ideas through sound before naming them.

## Current MVP

The current prototype contains one Discovery:

**Discover a pentatonic scale through play.**

Play freely → explore five highlighted strings → notice the sound → discover the pentatonic scale → choose whether to discover another sound.

All seven strings remain playable throughout. Choosing **Discover another sound** ends this prototype with “More discoveries coming soon.”

## Demo

Live demo: https://lyre-playground.vercel.app

## Tech Stack

- React
- TypeScript
- Vite
- Web Audio API
- SVG
- CSS

The supplied stringless lyre image is bundled locally, with seven interactive SVG strings above it. Audio is synthesized in the browser. Events are stored locally in the browser; no backend or external analytics service is used.

## Run Locally

Requires Node.js 22.12+ and npm.

```bash
npm install
npm run dev
```

For a clean install using the committed lockfile, use `npm ci`.

## Production Build

```bash
npm run build
```

The build runs TypeScript checking and creates the static site in `dist/`.

Preview the build locally:

```bash
npm run preview
```

Existing checks:

```bash
npm test
npx playwright install chromium
npm run test:e2e
```

## MVP Scope

This prototype currently validates one question:

> Can someone discover a musical concept by playing before being taught it?

It includes one Discovery, with no account system, second Discovery, or course progression.

## Status

Experimental MVP.
Currently testing the Play → Notice → Discover interaction model.
