const lore = {
    techCount: 0,
    talkingColor: "#dff", //set color of graphic on level.null
    anand: {
        color: "#e0c",
        text: function(say, isSpeech = false) {
            simulation.makeTextLog(`input.audio(<span style="color:#888; font-size: 70%;">${Date.now()} ms</span>)<span class='color-symbol'>:</span> "<span style="color:${this.color};">${say}</span>"`, Infinity);
            lore.talkingColor = this.color
            if (isSpeech) this.speech(say)
        },
        speech: function(say) {
            var utterance = new SpeechSynthesisUtterance(say);
            utterance.lang = "en-IN";
            utterance.volume = 0.2; // 0 to 1
            speechSynthesis.speak(utterance);
        }
    },
    miriam: {
        color: "#f20",
        text: function(say, isSpeech = false) {
            simulation.makeTextLog(`input.audio(<span style="color:#888; font-size: 70%;">${Date.now()} ms</span>)<span class='color-symbol'>:</span> "<span style="color:${this.color};">${say}</span>"`, Infinity);
            lore.talkingColor = this.color
            if (isSpeech) this.speech(say)
        },
        speech: function(say) {
            var utterance = new SpeechSynthesisUtterance(say);
            utterance.lang = "en-AU";
            utterance.volume = 0.2; // 0 to 1
            speechSynthesis.speak(utterance);
        }
    },
    conversation: [
        () => {
            if (localSettings.loreCount < 1) {
                localSettings.loreCount = 1
                localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
                document.getElementById("control-testing").style.visibility = (localSettings.loreCount === 0) ? "hidden" : "visible"
                document.getElementById("build-button").style.visibility = (localSettings.loreCount === 0) ? "hidden" : "visible"
            }
            let delay = 6000
            setTimeout(() => { lore.miriam.text("I've never seen it generate this level before.", true) }, delay);
            delay += 2700
            setTimeout(() => { lore.anand.text("Wow. Just a platform.", true) }, delay);
            delay += 2200
            setTimeout(() => { lore.miriam.text("And that thing...", true) }, delay);
            delay += 1500
            setTimeout(() => { lore.anand.text("Weird", true) }, delay);
            delay += 1500
            setTimeout(() => { lore.talkingColor = "#dff" }, delay); //set color of graphic on level.null when no one is talking
            delay += 1000
            setTimeout(() => { lore.anand.text("Maybe it's trapped.", true) }, delay);
            delay += 2300
            setTimeout(() => { lore.miriam.text('Hey little bot! Just press "T" to enter testing mode and "U" to go to the next level.', true) }, delay);
            delay += 5400
            setTimeout(() => { lore.anand.text("I don't think it's connected to the audio input, and I'm sure it can't understand what you're saying.", true) }, delay);
            delay += 5300
            setTimeout(() => { lore.miriam.text("ha hahahaha. I know, but it does seem to be getting smarter.", true) }, delay);
            delay += 3700
            setTimeout(() => { lore.talkingColor = "#dff" }, delay); //set color of graphic on level.null when no one is talking
            delay += 25000
            setTimeout(() => { lore.miriam.text("Poor thing... I hope it figures out how to escape.", true) }, delay);
            delay += 3500
            setTimeout(() => { lore.talkingColor = "#dff" }, delay); //set color of graphic on level.null when no one is talking
        },
        () => {
            if (localSettings.loreCount < 2) {
                localSettings.loreCount = 2
                localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
            }
            let delay = 6000
            setTimeout(() => { lore.miriam.text("Hey look! It's back at the weird level again!", true) }, delay);
            delay += 2500
            setTimeout(() => { lore.anand.text("oh Wow! Why does it keep making this level?", true) }, delay);
            delay += 2900
            setTimeout(() => { lore.miriam.text("I don't know, but last time it was in this room I think it understood us.", true) }, delay);
            delay += 4000
            setTimeout(() => { lore.miriam.text("Let's try talking to it again.", true) }, delay);
            delay += 2500
            setTimeout(() => { lore.miriam.text("hmmm, what should we say?", true) }, delay);
            delay += 2500
            setTimeout(() => { lore.anand.text("I'm still not convinced it understands. We need a test.", true) }, delay);
            delay += 4000
            setTimeout(() => { lore.miriam.text("Hey bot!!!", true) }, delay);
            delay += 1300
            setTimeout(() => { lore.miriam.text("If you can understand me crouch", true) }, delay);
            delay += 1500
            setTimeout(() => { lore.talkingColor = "#dff" }, delay); //set color of graphic on level.null when no one is talking
            setTimeout(() => {
                function cycle() {
                    if (input.down) {
                        let delay = 500 //reset delay time
                        setTimeout(() => { lore.miriam.text("Look, It did it! It crouched.", true) }, delay);
                        delay += 2000
                        setTimeout(() => { lore.anand.text("Amazing! It can understand us...", true) }, delay);
                        delay += 2700
                        setTimeout(() => { lore.miriam.text("It's Alive... Or it just crouched randomly.", true) }, delay);
                        delay += 2800
                        setTimeout(() => { lore.miriam.text("Hey bot! Can you crouch again?", true) }, delay);
                        delay += 2000
                        setTimeout(() => { lore.talkingColor = "#dff" }, delay); //set color of graphic on level.null when no one is talking
                        setTimeout(() => {
                            function cycle() {
                                if (input.down) {
                                    let delay = 500 //reset delay time
                                    setTimeout(() => { lore.miriam.text("It is Alive!!! ... hehehehehe ahahahahahah ehehehehe ahahahah", true) }, delay);
                                    delay += 3500
                                    setTimeout(() => { lore.anand.text("OK...", true) }, delay);
                                    delay += 2700
                                    setTimeout(() => { lore.anand.text("but seriously, this means that in this room it can monitor our audio, and it can understand us.", true) }, delay);
                                    delay += 6400
                                    setTimeout(() => { lore.anand.text("Anything we say could destabilize the project.", true) }, delay);
                                    delay += 4200
                                    setTimeout(() => { lore.miriam.text("Fine, Let's talk down stairs.", true) }, delay);
                                    delay += 3000
                                    setTimeout(() => { lore.miriam.text("Bye bye little bot.", true) }, delay);
                                    delay += 2000
                                    setTimeout(() => { lore.talkingColor = "#dff" }, delay); //set color of graphic on level.null when no one is talking
                                } else {
                                    requestAnimationFrame(cycle);
                                }
                            }
                            requestAnimationFrame(cycle);
                        }, delay);
                    } else {
                        requestAnimationFrame(cycle);
                    }
                }
                requestAnimationFrame(cycle);
            }, delay);
        },
        // () => {
        //     let delay = 2000
        //     setTimeout(() => { lore.miriam.text("testing speech generation for lore level", true) }, delay);
        //     delay += 2200
        //     setTimeout(() => { lore.anand.text("well, I'm also testing speech synthesis.  Do you think it sounds good?", true) }, delay);
        //     delay += 4600
        //     setTimeout(() => { lore.miriam.text("I guess it's fine.", true) }, delay);
        // },
    ],
    dialogue: [
        ``,
        ``,
    ],
}




// How to get to the console in chrome:
// Press either CTRL + SHIFT + I or F12   or   Option + ⌘ + J on a Mac
// Press ESC (or click on “Show console” in the bottom right corner) to slide the console up.

// How to get to the console in firefox:
// from the keyboard: press Ctrl+Shift+J (or ⌘+Shift+J on a Mac).

// How to get to the console in safari:
// Option + ⌘ + C

// http://xahlee.info/comp/unicode_computing_symbols.html


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
{
    /* <option value="en-GB">GB</option>
    <option value="en-US">US</option>
    <option value="en-AU">AU</option>
    <option value="fr-FR">FR</option>
    <option value="de-DE">DE</option>
    <option value="en-IN">IN</option>
    <option value="zh-CN">CN</option>
    <option value="pl">PL</option>
    <option value="ru">RU</option>
    <option value="sv-SE">SE</option>
    <option value="en-ZA">ZA</option> */
}