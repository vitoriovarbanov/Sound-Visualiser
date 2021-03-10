const playBtn = document.getElementById('play')
const volumeControl = document.getElementById('volume')

//CANVAS GLOBAL SETTINGS///////
let canvas = document.querySelector("#canvas");
let ctx = canvas.getContext("2d");
canvas.width = window.innerWidth
canvas.height = window.innerHeight
let radius = window.innerWidth <= 425 ? 120 : 160;
let positionX = canvas.width/2;
let positionY = canvas.height/2;


//WEB AUDIO API GLOBAL SETTINGS
window.AudioContext = (
    window.AudioContext ||
    window.webkitAudioContext ||
    null
);
const audioContext = new AudioContext();
const gainNode = audioContext.createGain();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0.8
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);


const audio = new Audio()
function init() {
    audio.loop = false;
    audio.autoplay = false;
    audio.crossOrigin = "anonymous";
    audio.src = "https://s3.eu-west-2.amazonaws.com/nelsoncodepen/Audiobinger_-_The_Garden_State.mp3";
    audio.addEventListener('canplay', connectAudioToContext)
}

//Connecting the selected sound with the Web Audio API
function connectAudioToContext() {
    const track = audioContext.createMediaElementSource(audio);
    // attach gainNode to be albe to control the volume
    track.connect(analyser)
    analyser.connect(gainNode)
    gainNode.connect(audioContext.destination)
}

function draw() {
    requestAnimationFrame(draw)
    //analyser.getByteFrequencyData(dataArray)
    analyser.getByteTimeDomainData(dataArray)
    radius += 0.01;
    ctx.fillStyle = 'blue'
    ctx.beginPath()
    ctx.arc(positionX, positionY, radius, 0, Math.PI * 2)
    ctx.closePath();
    ctx.fill();


}

draw()



//AUDIO RELATED STUFF TO GAIN CONTROL OVER THE PLAYING TRACK /////////

//Add play/pause functionality
playBtn.addEventListener('click', function (e) {
    // check if context is in suspended state (autoplay policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    // play or pause track depending on state
    if (this.dataset.playing === 'false') {
        audio.play();
        this.dataset.playing = 'true';
    } else if (this.dataset.playing === 'true') {
        audio.pause();
        this.dataset.playing = 'false';
    }
}, false)

//Adjust volume
volumeControl.addEventListener('input', function () {
    gainNode.gain.value = this.value
})


//Handle the track when it's finished
audio.addEventListener('ended', () => {
    playBtn.dataset.playing = 'false';
}, false);

