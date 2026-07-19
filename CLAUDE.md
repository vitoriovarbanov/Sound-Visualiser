# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A browser-based audio visualiser: it plays `assets/visualise.mp3`, runs an FFT over it via
the Web Audio API, and renders the frequency data as animated graphics. No frameworks,
no bundler, no TypeScript — plain ES modules served as static files.

## Running

There is no build step. The runtime dependency is Three.js; `live-server` provides the
dev server with auto-reload.

```bash
npm install                 # pulls three@^0.185.1 (gitignored) + live-server dev dep
npm run dev                 # live-server: serves ., opens browser, hot-reloads on file change
```

A static server is **required** — do not open `index.html` via `file://`. ES module
imports, media fetching, and the Web Audio API all need an HTTP origin. Any static server
works (e.g. `npx serve .`); `npm run dev` is preferred because it auto-reloads on edits
to `index.html`, `js/*.js`, and `styles.css`.

There are no tests, linter, or formatter configured. `js/3d.js` imports Three via the
bare `'three'` specifier, resolved by the **import map** in `index.html` to
`./node_modules/three/build/three.module.js` — so `node_modules` must be installed.

## Architecture

Two pieces working together:

- **`index.html` + `styles.css`** — a fixed-position "Swiss" player overlay (`#player`):
  editorial cream/ink/vermilion theme, condensed-Helvetica masthead, and a bottom
  transport (play/pause `#pp`, hairline seek `#seek`, times `#cur`/`#tot`). This is just
  markup + CSS; all behaviour is wired from `3d.js`.
- **`js/3d.js`** — the Three.js visualiser *and* the audio/transport logic. It imports
  Three via the `'three'` specifier (see the import map above) and appends its own
  `renderer.domElement`, which sits behind the overlay (`canvas { z-index: 0 }`,
  `.player { z-index: 2 }`).

Audio pipeline: an HTML `<audio>` element (`new Audio()`) is the source — it *streams* the
file rather than fetching+decoding it whole. It's routed through Web Audio for analysis:
`createMediaElementSource(el) → AnalyserNode → destination`. `analyserNode.getByteFrequencyData()`
fills `freqData` each frame. (`createMediaElementSource` may be called only once per element,
so the graph is wired once and track changes just swap `el.src`.)

Visualiser core (a **Sunburst** — radial bars forming a circular equaliser):
- `buildSunburst()` creates the bar meshes **once** around a circle (thin `PlaneGeometry`
  translated so scaling `.y` grows each bar outward from the inner ring). `buildBands()`
  gives one log-spaced band per side; `bandForBar()` mirrors it around the circle so
  adjacent bars share a frequency (no seam discontinuity).
- `animate()` reads `freqData` every frame, smooths per bar (fast attack / slow release via
  `levels`), and drives each bar's length + color (ink→vermilion lerp) from its band.
  Build-once / mutate-per-frame is the core pattern — do not recreate meshes inside the loop.

Transport wiring (in `3d.js`): the `<audio>` element owns the playhead, so `el.currentTime`
/ `el.duration` drive the DOM transport directly — no manual bookkeeping. Play/pause toggle
`el.play()`/`el.pause()`; the seek bar writes `el.currentTime`; `el` events (`loadedmetadata`,
`play`, `pause`, `ended`) keep the UI in sync. `loadTrack()` swaps `el.src` (revoking the
previous blob URL); tracks arrive from the bundled default, the "Open file" button, or a
drag-and-drop anywhere on the page.

**Browser autoplay policy:** playback starts on a user gesture — the first play-button
click (or an Open-file / drop choice), which also resumes the suspended `AudioContext`.
There is no auto-play.

## Notes

- The default track is `assets/visualise.webm` (Opus 96k), with `assets/visualise.mp3` as
  the fallback for browsers that can't decode Opus (Safari < 15); `canPlayType` picks at
  startup. Users can also load their own file via the "Open file" button or by dropping
  one on the page, so the bundled track is a default rather than the only source.
  To re-encode after replacing the source mp3:

  ```bash
  ffmpeg -i assets/visualise.mp3 -c:a libopus -b:a 96k -map_metadata -1 assets/visualise.webm
  ```
- The git log ("experimenting with…", "added 3d spheres") reflects an iterative,
  scratch-driven history; the working tree is now trimmed to just the active code.
