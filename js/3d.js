import * as THREE from '../node_modules/three/src/Three.js';

function main() {
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 10

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.setClearColor(0xf2f0ea, 1)   // Swiss cream ground
    document.body.appendChild(renderer.domElement)

    // Sphere palette: ink at rest, warming to vermilion on loud bands.
    const inkColor = new THREE.Color(0x15120e);
    const redColor = new THREE.Color(0xe5352b);

    const fftSize = 2048
    const listener = new THREE.AudioListener()
    camera.add(listener)
    const sound = new THREE.Audio(listener)
    const audioLoader = new THREE.AudioLoader()

    // ---- transport state ----
    const audioCtx = listener.context;
    let ready = false;
    let duration = 0;
    let playing = false;
    let position = 0;    // playhead (s) when not actively counting
    let startedAt = 0;   // audioCtx time when the current play segment began

    // ---- transport controls (Swiss player in index.html) ----
    const player = document.getElementById('player');
    const pp = document.getElementById('pp');
    const seek = document.getElementById('seek');
    const fill = document.getElementById('fill');
    const knob = document.getElementById('knob');
    const curEl = document.getElementById('cur');
    const totEl = document.getElementById('tot');

    const fmt = (s) => {
        s = Math.max(0, Math.floor(s || 0));
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    };
    // Live playhead: add the elapsed context time while a segment is playing.
    const headPos = () => {
        const p = playing ? position + (audioCtx.currentTime - startedAt) : position;
        return Math.max(0, Math.min(duration, p));
    };

    audioLoader.load('../assets/test.mp3', function (buffer) {
        sound.setBuffer(buffer);
        sound.setVolume(1);
        duration = buffer.duration;
        totEl.textContent = fmt(duration);
        ready = true;
        pp.disabled = false;
    })

    function setPlaying(state) {
        playing = state;
        player.classList.toggle('is-playing', state);
        pp.setAttribute('aria-label', state ? 'Pause' : 'Play');
    }

    // Always stop() before starting so THREE.Audio's internal progress resets to 0
    // and `sound.offset` alone sets the start point — our `position` stays the single
    // source of truth for the playhead. The first click also satisfies the browser
    // autoplay policy by resuming the suspended AudioContext.
    function play() {
        if (!ready) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        if (position >= duration) position = 0;
        try { sound.stop(); } catch (e) { /* no source yet */ }
        sound.offset = position;
        sound.play();
        startedAt = audioCtx.currentTime;
        setPlaying(true);
    }

    function pause() {
        position = headPos();
        try { sound.stop(); } catch (e) { /* already stopped */ }
        setPlaying(false);
    }

    pp.addEventListener('click', () => (playing ? pause() : play()));

    // Click the hairline to scrub.
    seek.addEventListener('click', (e) => {
        if (!ready) return;
        const r = seek.getBoundingClientRect();
        position = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * duration;
        if (playing) play();   // restart from the new position
        else updateTransport();
    });

    function updateTransport() {
        const p = headPos();
        const ratio = duration ? p / duration : 0;
        fill.style.width = (ratio * 100) + '%';
        knob.style.left = (ratio * 100) + '%';
        curEl.textContent = fmt(p);
    }

    const analyser = new THREE.AudioAnalyser(sound, fftSize);

    // FFT bins are spaced linearly but hearing is logarithmic, so a linear map
    // crams every musical detail into the first handful of spheres. Precompute a
    // log-spaced [start, end) bin range per sphere instead; each sphere then averages
    // its whole band, which also smooths the noisy wide bands at the top end.
    const minBin = 1;                    // skip bin 0 (DC offset, carries no pitch)
    const maxBin = (fftSize / 2) * 0.5;  // lower half of the spectrum, ~0-11kHz
    function buildBands(count) {
        const edges = [];
        for (let i = 0; i <= count; i++) {
            edges.push(minBin * Math.pow(maxBin / minBin, i / count));
        }
        return edges.slice(0, -1).map((lo, i) => {
            const start = Math.floor(lo);
            // Guarantee at least one bin per band — the low end rounds to the same
            // integer for several spheres in a row otherwise.
            return [start, Math.max(Math.floor(edges[i + 1]), start + 1)];
        });
    }

    // ---- Sunburst: radial bars forming a circular equaliser ----
    const BARS = 72;
    const HALF = BARS / 2;       // spectrum runs low→high→low, mirrored around the circle
    const innerRadius = 1.8;     // still ring the bars grow out from
    const barWidth = 0.06;       // world units
    const baseLen = 0.12;        // bar length at rest
    const maxLen = 3.2;          // added length at full amplitude

    // A unit bar whose base sits at the local origin and extends up +Y, so scaling Y
    // grows it radially outward from the inner ring.
    const barGeo = new THREE.PlaneGeometry(barWidth, 1);
    barGeo.translate(0, 0.5, 0);

    const bars = buildSunburst(BARS, innerRadius);
    // One band per side; mirrored so adjacent bars share a frequency (no seam jump).
    const bands = buildBands(HALF + 1);
    const bandForBar = (j) => (j <= HALF ? j : BARS - j);
    // Per-bar smoothed level (fast attack, slow release) so bars pulse, not jitter.
    const levels = new Float32Array(BARS);

    // Faint guide ring at the inner radius.
    scene.add(new THREE.Mesh(
        new THREE.RingGeometry(innerRadius - 0.05, innerRadius - 0.01, 96),
        new THREE.MeshBasicMaterial({ color: 0x15120e, transparent: true, opacity: 0.1 })
    ));

    // Place `count` bars evenly around the circle, each pointing radially outward.
    function buildSunburst(count, r0) {
        const created = [];
        for (let j = 0; j < count; j++) {
            const angle = (j / count) * Math.PI * 2;
            const bar = new THREE.Mesh(barGeo, new THREE.MeshBasicMaterial({ color: 0x15120e }));
            bar.rotation.z = angle - Math.PI / 2;   // aim the bar's +Y axis outward
            bar.position.set(Math.cos(angle) * r0, Math.sin(angle) * r0, 0);
            scene.add(bar);
            created.push(bar);
        }
        return created;
    }

    function animate() {
        requestAnimationFrame(animate);

        // Sample the live frequency spectrum every frame. AudioAnalyser.getFrequencyData()
        // fills and returns the byte-frequency array (0..255 per bin).
        const data = analyser.getFrequencyData();

        for (let j = 0; j < bars.length; j++) {
            // Average this bar's log-spaced band, then normalise to 0..1.
            const [start, end] = bands[bandForBar(j)];
            let sum = 0;
            for (let b = start; b < end; b++) sum += data[b];
            const amplitude = sum / (end - start) / 255;

            // Smooth per bar: snap up on transients, ease back down. Calmer than raw data.
            const s = levels[j] + (amplitude - levels[j]) * (amplitude > levels[j] ? 0.5 : 0.12);
            levels[j] = s;

            const bar = bars[j];
            bar.scale.y = baseLen + s * maxLen;   // grow outward from the inner ring
            // Ink at rest, warming to vermilion on loud bands (squared so only peaks pop).
            bar.material.color.copy(inkColor).lerp(redColor, Math.min(1, s * s * 1.8));
        }

        // Reached the end — reset to the start, paused.
        if (playing && headPos() >= duration - 0.03) {
            try { sound.stop(); } catch (e) { /* already stopped */ }
            position = 0;
            setPlaying(false);
        }
        updateTransport();

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

main()