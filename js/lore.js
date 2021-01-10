const lore = {
    alfie: {
        color: "#e06",
        text: function(say, isSpeech = false) {
            simulation.makeTextLog(`input.audio(<span style="color:#888; font-size: 70%;">${Date.now()} ms</span>)<span class='color-symbol'>:</span> "<span style="color:${this.color};">${say}</span>"`, Infinity);
            if (isSpeech) this.speech(say)
        },
        speech: function(say) {
            var utterance = new SpeechSynthesisUtterance(say);
            utterance.lang = "en-GB";
            speechSynthesis.speak(utterance);
        }
    },
    zoe: {
        color: "#f50",
        text: function(say, isSpeech = false) {
            simulation.makeTextLog(`input.audio(<span style="color:#888; font-size: 70%;">${Date.now()} ms</span>)<span class='color-symbol'>:</span> "<span style="color:${this.color};">${say}</span>"`, Infinity);
            if (isSpeech) this.speech(say)
        },
        speech: function(say) {
            var utterance = new SpeechSynthesisUtterance(say);
            utterance.lang = "en-AU";
            speechSynthesis.speak(utterance);
        }
    },
    dialogue: [
        ``,
        ``,
    ],
    ending() {

    }
}


// speech: function(say) {
//   var utterance = new SpeechSynthesisUtterance(say);
//   //msg.voice = voices[10]; // Note: some voices don't support altering params
//   //msg.voiceURI = 'native';
//   //utterance.volume = 1; // 0 to 1
//   //utterance.rate = 1; // 0.1 to 10
//   //utterance.pitch = 1; //0 to 2
//   //utterance.text = 'Hello World';
//   //http://stackoverflow.com/questions/14257598/what-are-language-codes-for-voice-recognition-languages-in-chromes-implementati
//   //de-DE  en-GB  fr-FR  en-US en-AU
//   utterance.lang = "en-GB";
//   speechSynthesis.speak(utterance);
// }