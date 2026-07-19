import * as THREE from 'three';

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

    // Stream through an <audio> element instead of THREE.AudioLoader, which fetches the
    // whole file and decodes it to raw PCM up front (~10MB per minute of stereo, and no
    // sound until the last byte lands). The element also owns the playhead, so its
    // `currentTime`/`duration` replace all manual transport bookkeeping.
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const el = new Audio();
    el.crossOrigin = 'anonymous';
    el.preload = 'metadata';

    // createMediaElementSource may only be called once per element, so the graph is wired
    // up front — loading another track just swaps `el.src` and the routing still holds.
    const analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = fftSize;
    audioCtx.createMediaElementSource(el).connect(analyserNode);
    analyserNode.connect(audioCtx.destination);
    const freqData = new Uint8Array(analyserNode.frequencyBinCount);

    // ---- transport controls (Swiss player in index.html) ----
    const player = document.getElementById('player');
    const pp = document.getElementById('pp');
    const seek = document.getElementById('seek');
    const fill = document.getElementById('fill');
    const knob = document.getElementById('knob');
    const curEl = document.getElementById('cur');
    const totEl = document.getElementById('tot');
    const titleEl = document.getElementById('title');
    const srcEl = document.getElementById('src');
    const openBtn = document.getElementById('open');
    const fileInput = document.getElementById('file');
    const dropEl = document.getElementById('drop');

    const fmt = (s) => {
        s = Math.max(0, Math.floor(s || 0));
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    };
    // Streams and some VBR mp3s report Infinity/NaN until enough has buffered.
    const dur = () => (isFinite(el.duration) ? el.duration : 0);

    function setPlaying(state) {
        player.classList.toggle('is-playing', state);
        pp.setAttribute('aria-label', state ? 'Pause' : 'Play');
    }

    el.addEventListener('loadedmetadata', () => {
        totEl.textContent = fmt(dur());
        pp.disabled = false;
    });
    el.addEventListener('play', () => setPlaying(true));
    el.addEventListener('pause', () => setPlaying(false));
    el.addEventListener('ended', () => { el.currentTime = 0; });

    // The first click doubles as the user gesture that unblocks the AudioContext.
    pp.addEventListener('click', () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        if (el.paused) el.play(); else el.pause();
    });

    // Click the hairline to scrub.
    seek.addEventListener('click', (e) => {
        if (!dur()) return;
        const r = seek.getBoundingClientRect();
        el.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * dur();
        updateTransport();
    });

    function updateTransport() {
        const ratio = dur() ? el.currentTime / dur() : 0;
        fill.style.width = (ratio * 100) + '%';
        knob.style.left = (ratio * 100) + '%';
        curEl.textContent = fmt(el.currentTime);
    }

    // ---- track loading ----
    // Split "foo.mp3" across two lines the way the masthead sets the default track.
    function setTitle(name, source) {
        const dot = name.lastIndexOf('.');
        titleEl.textContent = '';   // .append() keeps arbitrary file names out of innerHTML
        titleEl.append(
            dot > 0 ? name.slice(0, dot) : name,
            document.createElement('br'),
            dot > 0 ? name.slice(dot) : ''
        );
        srcEl.textContent = source;
    }

    let objectUrl = null;
    function loadTrack(src, name, source) {
        // Revoke the previous blob so dropping track after track doesn't leak them.
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = src.startsWith('blob:') ? src : null;
        pp.disabled = true;
        el.src = src;
        setTitle(name, source);
        updateTransport();
    }

    function loadFile(file) {
        if (!file || !file.type.startsWith('audio/')) return;
        loadTrack(URL.createObjectURL(file), file.name, 'Local file');
        if (audioCtx.state === 'suspended') audioCtx.resume();
        el.play();   // a drop or picker choice is itself the required user gesture
    }

    openBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        loadFile(fileInput.files[0]);
        fileInput.value = '';   // so re-picking the same file fires 'change' again
    });

    // Drag-and-drop anywhere on the page. dragenter/dragleave fire per descendant, so
    // count depth rather than toggling on the first leave.
    let dragDepth = 0;
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('dragenter', (e) => {
        e.preventDefault();
        if (++dragDepth === 1) dropEl.classList.add('on');
    });
    window.addEventListener('dragleave', () => {
        if (--dragDepth <= 0) { dragDepth = 0; dropEl.classList.remove('on'); }
    });
    window.addEventListener('drop', (e) => {
        e.preventDefault();
        dragDepth = 0;
        dropEl.classList.remove('on');
        loadFile(e.dataTransfer.files[0]);
    });

    // Opus is ~1/3 the size of the mp3, but Safari below 15 can't decode it. canPlayType
    // returns 'probably' / 'maybe' / '' — the empty string is the only falsy answer.
    const defaultTrack = el.canPlayType('audio/webm; codecs=opus')
        ? 'visualise.webm'
        : 'visualise.mp3';
    loadTrack('./assets/' + defaultTrack, defaultTrack, 'Track 01 / 01');

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

        // Sample the live frequency spectrum every frame, reusing one array (0..255 per bin).
        analyserNode.getByteFrequencyData(freqData);
        const data = freqData;

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