var SAMPLES = 2048
let audioCtx;
const audio = new Audio()

function init() {
    audio.loop = false;
    audio.autoplay = false;
    audio.crossOrigin = "anonymous";
    audio.src = "https://s3.eu-west-2.amazonaws.com/nelsoncodepen/Audiobinger_-_The_Garden_State.mp3";
    //audio.play()
}

const btn = document.getElementById('play')
btn.addEventListener('click', function (e) {  
    
    //audio.play()
})





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

