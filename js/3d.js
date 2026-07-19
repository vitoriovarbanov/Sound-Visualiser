import * as THREE from '../node_modules/three/src/Three.js';

function main() {
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 10

    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    const fftSize = 2048
    const listener = new THREE.AudioListener()
    camera.add(listener)
    const sound = new THREE.Audio(listener)
    const audioLoader = new THREE.AudioLoader()

    let ready = false;
    audioLoader.load('../assets/test.mp3', function (buffer) {
        sound.setBuffer(buffer);
        sound.setVolume(1);
        ready = true;
    })

    // Browsers block audio until the user interacts with the page (autoplay policy).
    // Start playback — and resume the AudioContext — on the first click or key press.
    const hint = document.createElement('div');
    hint.textContent = 'click anywhere to play';
    hint.style.cssText =
        'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;' +
        'font:600 24px sans-serif;color:#fff;background:rgba(0,0,0,.6);cursor:pointer;z-index:10';
    document.body.appendChild(hint);

    function startAudio() {
        if (!ready || sound.isPlaying) return;
        if (listener.context.state === 'suspended') listener.context.resume();
        sound.play();
        hint.remove();
        window.removeEventListener('click', startAudio);
        window.removeEventListener('keydown', startAudio);
    }
    window.addEventListener('click', startAudio);
    window.addEventListener('keydown', startAudio);

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

    const radius = 0.15;
    const sides = 100;
    const coils = 555;
    const rotation = 0; // ('0'=no rotation, '1'=360 degrees, '180/360'=180 degrees)

    const geometry = new THREE.SphereGeometry(radius)

    // Build the spiral ONCE, keeping a reference to every sphere so the animation
    // loop can mutate them instead of recreating them each frame.
    const spheres = buildSpiral(0, 0, radius, sides, coils, rotation);
    const bands = buildBands(spheres.length);

    function makeInstance(color, posX, posY) {
        const material = new THREE.MeshBasicMaterial({ color })
        const sphere = new THREE.Mesh(geometry, material)

        sphere.position.x = posX;
        sphere.position.y = posY;
        scene.add(sphere)
        return sphere
    }

    // Arrange `sides` spheres along an Archimedean spiral and return them in order,
    // so index 0 is at the center and the last index is at the outer edge.
    function buildSpiral(centerX, centerY, radius, sides, coils, rotation) {
        const awayStep = radius / sides;              // radial step per sphere
        const aroundStep = coils / sides;             // angular step per sphere (turns)
        const aroundRadians = aroundStep * 2 * Math.PI;
        const rotationRadians = rotation * 2 * Math.PI;

        const created = [];
        for (let i = 1; i <= sides; i++) {
            const away = i * awayStep;
            const around = i * aroundRadians + rotationRadians;
            const x = centerX + Math.cos(around) * away * 50;
            const y = centerY + Math.sin(around) * away * 50;
            created.push(makeInstance(0x44aa88, x, y));
        }
        return created;
    }

    function animate() {
        requestAnimationFrame(animate);

        // Sample the live frequency spectrum every frame. AudioAnalyser.getFrequencyData()
        // fills and returns the byte-frequency array (0..255 per bin).
        const data = analyser.getFrequencyData();

        spheres.forEach((sphere, i) => {
            // Average this sphere's log-spaced band, then normalise to 0..1.
            const [start, end] = bands[i];
            let sum = 0;
            for (let b = start; b < end; b++) sum += data[b];
            const amplitude = sum / (end - start) / 255;

            // Louder bins => larger, brighter spheres.
            sphere.scale.setScalar(0.5 + amplitude * 6);
            sphere.material.color.setHSL(0.45 - amplitude * 0.45, 0.7, 0.3 + amplitude * 0.4);
        });

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