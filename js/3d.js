import * as THREE from '../node_modules/three/src/Three.js';

function main() {
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 10

    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    let dataArray = [];
    const fftSize = 2048
    const listener = new THREE.AudioListener()
    camera.add(listener)
    const sound = new THREE.Audio(listener)
    const audioLoader = new THREE.AudioLoader()
    audioLoader.load('../assets/test.mp3', function (buffer) {
        sound.setBuffer(buffer);
        sound.crossOrigin = "anonymous";
        sound.setVolume(1)
        sound.play()
    })

    const analyser = new THREE.AudioAnalyser(sound, fftSize);
    dataArray = analyser.data


    let radius = 0.15;
    let sides = 100;
    let coils = 555;
    let rotation = 0 //('0'=no rotation, '1'=360 degrees, '180/360'=180 degrees)

    const geometry = new THREE.SphereGeometry(radius)

    const spheres = [
        makeInstances(geometry, 0x44aa88, -6),
        makeInstances(geometry, 0x44aa88, 0),
        makeInstances(geometry, 0x44aa88, 6)
    ]

    function makeInstances(geometry, color, posX, posY) {
        const material = new THREE.MeshBasicMaterial({ color })
        const sphere = new THREE.Mesh(geometry, material)

        sphere.position.x = posX;
        sphere.position.y = posY;
        scene.add(sphere)
        return sphere
    }

    //let centerX = 0;
    //let centerY = 0;

    function setBlockDisposition(centerX, centerY, radius, sides, coils, rotation) {
        //
        // How far to step away from center for each side.
        var awayStep = radius / sides;
        //
        // How far to rotate around center for each side.
        var aroundStep = coils / sides;// 0 to 1 based.
        //
        // Convert aroundStep to radians.
        var aroundRadians = aroundStep * 2 * Math.PI;
        //
        // Convert rotation to radians.
        rotation *= 2 * Math.PI;
        //
        // For every side, step around and away from center.
        for (var i = 1; i <= sides; i++) {
            //
            // How far away from center
            var away = i * awayStep;
            //
            // How far around the center.
            var around = i * aroundRadians + rotation;
            //
            // Convert 'around' and 'away' to X and Y.
            var x = centerX + Math.cos(around) * away * 50;
            var y = centerY + Math.sin(around) * away * 50;
            //
            // Now that you know it, do it.
            //doSome(x,y)
            makeInstances(geometry, 0x44aa88, x, y);
        }
    }



    function animate() {
        setBlockDisposition(0, 0, radius, sides, coils, 0)

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
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


/*
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

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
          renderer.setSize(width, height, false);
        }
        return needResize;
      }

    function render(time) {
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
          }

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
*/