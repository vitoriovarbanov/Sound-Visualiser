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

The whole app is `js/3d.js`, loaded via the single `<script type="module">` tag in
`index.html`. It's a Three.js scene that visualises audio:

- Audio loads through `THREE.AudioLoader` / `THREE.Audio` and is analysed with
  `THREE.AudioAnalyser`.
- `buildSpiral()` creates the sphere meshes **once** along an Archimedean spiral.
- `animate()` samples `analyser.getFrequencyData()` every frame and drives each sphere's
  scale and HSL color from its frequency bin. This build-once / mutate-per-frame split is
  the core pattern — do not recreate meshes inside the loop.

It imports Three from `../node_modules/three/src/Three.js` directly (hence `npm install`
is required) and appends its own `renderer.domElement` to the body — `index.html` is just
a bare shell that loads the module.

**Browser autoplay policy:** the audio — and therefore the animation — only reacts once
the AudioContext is unblocked by a user gesture (any click/keypress on the page).

## Notes

- Audio source is hardcoded to `./assets/test.mp3`.
- The git log ("experimenting with…", "added 3d spheres") reflects an iterative,
  scratch-driven history; the working tree is now trimmed to just the active code.
