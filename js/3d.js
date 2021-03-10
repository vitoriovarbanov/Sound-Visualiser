import * as THREE from '../node_modules/three/src/Three.js';

function main() {
    const canvas = document.getElementById('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas });

    //SETUP CAMERA
    const fieldOfView = 75;
    const aspect = 2;
    const near = 0.1;
    const far = 5;
    const camera = new THREE.PerspectiveCamera(fieldOfView, aspect, near, far)
    camera.position.z = 2;

    const scene = new THREE.Scene();

    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
    }


    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    function makeInstance(geometry, color, x) {
        const material = new THREE.MeshPhongMaterial({ color })
        const cube = new THREE.Mesh(geometry, material)
        scene.add(cube)

        cube.position.x = x;

        return cube
    }

    const cubes = [
        makeInstance(geometry, 0x44aa88, 0),
        makeInstance(geometry, 0x8844aa, -2),
        makeInstance(geometry, 0xaa8844, 2),
    ];

    function render(time) {
        time *= 0.001;

        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();

        cubes.forEach((cube,ndx)=>{
            const speed = 1 * ndx * 0.1;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        })
        renderer.render(scene, camera)

        requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
}

main()

 // AUDIO
/* var analyser, dataArray;
var audioData = [];
var stream = "https://cdn.rawgit.com/ellenprobst/web-audio-api-with-Threejs/57582104/lib/TheWarOnDrugs.m4a";
var fftSize = 2048;
var audioLoader = new THREE.AudioLoader();
var listener = new THREE.AudioListener();
var audio = new THREE.Audio(listener);
audio.crossOrigin = "anonymous";
audioLoader.load(stream, function (buffer) {
    audio.setBuffer(buffer);
    audio.setLoop(true);
    audio.play();
});

analyser = new THREE.AudioAnalyser(audio, fftSize);

analyser.analyser.maxDecibels = -3;
analyser.analyser.minDecibels = -100;
dataArray = analyser.data;
getAudioData(dataArray); */