# Sound Visualiser

A browser audio visualiser built with the Web Audio API and Three.js. It plays an
MP3, runs an FFT over it, and renders the live frequency spectrum as a **Sunburst** —
radial bars forming a circular equaliser — inside a "Swiss" editorial player
(play / pause, seek, elapsed time) styled in ink-on-cream with vermilion peaks.

## Run

```bash
npm install    # pulls Three.js
npm run dev     # live-server with hot reload
```

A static server is required — don't open `index.html` over `file://`. Playback starts
on the first click of the play button (browser autoplay policy).

## Layout

- `index.html` + `styles.css` — the player overlay (markup + theme)
- `js/3d.js` — the Three.js visualiser and audio/transport logic
- `assets/visualise.webm` — the bundled track (Opus 96k, ~4.8 MB)
- `assets/visualise.mp3` — mp3 fallback for Safari < 15
