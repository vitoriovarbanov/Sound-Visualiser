const playBtn = document.getElementById('play')
const volumeControl = document.getElementById('volume')
let canvas = document.querySelector("canvas");
let ctx = canvas.getContext("2d");

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
const gainNode = audioContext.createGain();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256;
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
    analyser.getByteFrequencyData(dataArray)

    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width/2 , canvas.height/2 );

}

draw()














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





/* audioFile.onchange = function(){ //plays the user's uploaded audio file when it is uploaded
    audio = document.getElementById("audio");
    var reader = new FileReader();
    reader.onload = function(e){
        audio.src = this.result;
        audio.controls = true;
        audio.crossOrigin = "anonymous"; */
        //
/*source = audioctx.createMediaElementSource(audio);
source.connect(analyser);
source.connect(audioctx.destination); //from online help*/
        //colorStyle = Math.round(Math.random() * 6); //random color palete if you switch songs
        //
/*         audio.play();
        audioctx.resume();
    }
    reader.readAsDataURL(this.files[0]);
    window.requestAnimationFrame(draw);
}
 */

