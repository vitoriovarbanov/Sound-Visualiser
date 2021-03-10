const playBtn = document.getElementById('play')
const volumeControl = document.getElementById('volume')
let interval = 10;

//CANVAS GLOBAL SETTINGS///////
let canvas = document.querySelector("#canvas");
let ctx = canvas.getContext("2d");
canvas.width = window.innerWidth
canvas.height = window.innerHeight
let radius = window.innerWidth <= 425 ? 120 : 160;
let positionX// = canvas.width/2;
let positionY// = canvas.height/2;


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
    audio.src = './assets/test.mp3'
    //audio.src = "https://s3.eu-west-2.amazonaws.com/nelsoncodepen/Audiobinger_-_The_Garden_State.mp3";
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

let number = 0;
let scale = 10;
let angle = 0
/* let bars = 100;
let bar_width = (canvas.width / bufferLength) * 1; */
let bar_height

function drawShapes() {
    positionX = canvas.width / 2;
    positionY = canvas.height / 2;

    for (let i = 0; i < interval; i++) {
        ctx.lineWidth = dataArray[i] * 1;
        ctx.fillStyle = "rgb(" + ((2 / 3) * (ctx.lineWidth)) + "," + (0 * (ctx.lineWidth)) + "," + (0 * (ctx.lineWidth)) + ")";
        bar_height = dataArray[i] * 0.2;
        
    }
    ctx.strokeStyle = 'wheat';
    //ctx.lineWidth = 40;
    ctx.setLineDash([5, 15, 20]);
    ctx.lineJoin = 'round';
    ctx.beginPath()
    ctx.arc(positionX, positionY, 200, 0, Math.PI * 2)
    //ctx.closePath();
    ctx.fill();
    ctx.stroke();

}

function drawLines() {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.setLineDash([1,3])
    ctx.lineTo(0, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(canvas.width, canvas.height);
    ctx.setLineDash([1,3])
    ctx.lineTo(canvas.width, 0);
    ctx.stroke();
}

function draw() {
    requestAnimationFrame(draw)
    analyser.getByteFrequencyData(dataArray)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    var gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "rgba(151,233,208,1");
    gradient.addColorStop(1, "rgba(35,192,199,1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawShapes()
    drawLines()
}


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
        draw()
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

let showHideMenu = document.getElementById('container');


//function drawShapes(){

///////////////////////////////////////////////////////
/*  let positionX = canvas.width / 2;
let positionY = canvas.height / 2;

for (var i = 0; i < bars; i++) {
 //divide a circle into equal parts
 rads = Math.PI * 2 / bars;
 bar_height = dataArray[i] * 0.2;
  // set coordinates
 x = positionX + Math.cos(rads * i) * (radius);
 y = positionY + Math.sin(rads * i) * (radius);
 x_end = positionX + Math.cos(rads * i) * (radius + bar_height);
 y_end = positionY + Math.sin(rads * i) * (radius + bar_height);
 //draw a bar
 drawBar(x, y, x_end, y_end, bar_width, dataArray[i]);

}
*/
//}

/* function drawBar(x1, y1, x2, y2, width, frequency) {

    var lineColor = "rgb(" + frequency + ", " + frequency + ", " + 205 + ")";

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
} */