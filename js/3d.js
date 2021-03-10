const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight, false)
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material)
scene.add(cube);

camera.position.z = 3;

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}
animate();

 // AUDIO
var analyser, dataArray;
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
getAudioData(dataArray);