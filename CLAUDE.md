# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A browser-based audio visualiser: it plays `assets/test.mp3`, runs an FFT over it via
the Web Audio API, and renders the frequency data as animated graphics. No frameworks,
no bundler, no TypeScript — plain ES modules served as static files.

## Running

There is no build step. The runtime dependency is Three.js; `live-server` provides the
dev server with auto-reload.

```bash
npm install                 # pulls three@0.126.1 (gitignored) + live-server dev dep
npm run dev                 # live-server: serves ., opens browser, hot-reloads on file change
```

A static server is **required** — do not open `index.html` via `file://`. ES module
imports, MP3 fetching, and the Web Audio API all need an HTTP origin. Any static server
works (e.g. `npx serve .`); `npm run dev` is preferred because it auto-reloads on edits
to `index.html`, `js/*.js`, and `styles.css`.

There are no tests, linter, or formatter configured. Do not run `npm audit fix --force`:
it would bump Three.js past `0.126.1` and break the `../node_modules/three/src/Three.js`
import in `js/3d.js`.

## Architecture

Two pieces working together:

- **`index.html` + `styles.css`** — a fixed-position "Swiss" player overlay (`#player`):
  editorial cream/ink/vermilion theme, condensed-Helvetica masthead, and a bottom
  transport (play/pause `#pp`, hairline seek `#seek`, times `#cur`/`#tot`). This is just
  markup + CSS; all behaviour is wired from `3d.js`.
- **`js/3d.js`** — the Three.js visualiser *and* the audio/transport logic. It imports
  Three from `../node_modules/three/src/Three.js` directly (hence `npm install` is
  required) and appends its own `renderer.domElement`, which sits behind the overlay
  (`canvas { z-index: 0 }`, `.player { z-index: 2 }`).

Visualiser core (a **Sunburst** — radial bars forming a circular equaliser):
- Audio loads through `THREE.AudioLoader` / `THREE.Audio`, analysed with `THREE.AudioAnalyser`.
- `buildSunburst()` creates the bar meshes **once** around a circle (thin `PlaneGeometry`
  translated so scaling `.y` grows each bar outward from the inner ring). `buildBands()`
  gives one log-spaced band per side; `bandForBar()` mirrors it around the circle so
  adjacent bars share a frequency (no seam discontinuity).
- `animate()` samples `analyser.getFrequencyData()` every frame, smooths per bar (fast
  attack / slow release via `levels`), and drives each bar's length + color (ink→vermilion
  lerp) from its band. Build-once / mutate-per-frame is the core pattern — do not recreate
  meshes inside the loop.

Transport wiring (in `3d.js`): `position` (seconds) is the single source of truth for the
playhead; `headPos()` adds live `AudioContext` time while playing. `play()` always
`sound.stop()`s first so `sound.offset` alone sets the start point (keeps our bookkeeping
authoritative); seeking restarts from the new `position`. `animate()` updates the DOM
transport and resets to paused at end-of-track.

**Browser autoplay policy:** playback starts on the first click of the play button (a user
gesture), which also resumes the suspended `AudioContext`. There is no auto-play.

## Notes

- Audio source is hardcoded to `./assets/test.mp3`.
- The git log ("experimenting with…", "added 3d spheres") reflects an iterative,
  scratch-driven history; the working tree is now trimmed to just the active code.
