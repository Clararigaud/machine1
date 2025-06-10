import "/scripts/tone/build/Tone.js";
import Sequencer from '/assets/js/app/Sequencer.js';

export default class Machine {
    constructor() {
        this.chordInstrument = 'cool2';
        this.harpInstrument = 'cool2';
        this.chordsUrls = {
            "A3": "A3.wav",
            "A#3": "Asharp3.wav",
            "B3": "B3.wav",
            "C3": "C3.wav",
            "C#3": "Csharp3.wav",
            "D3": "D3.wav",
            "D#3": "Dsharp3.wav",
            "E3": "E3.wav",
            "F3": "F3.wav",
            "F#3": "Fsharp3.wav",
            "G3": "G3.wav",
            "G#3": "Gsharp3.wav"
        };
        this.harpUrls = this.chordsUrls;
        this.compressor;
        this.state = {
            initialized: false
        }

        this.currentChord = {
            name: '',
            notes: []
        };
    }

    async initialize() {
        return new Promise((done) => {
            this.compressor = new Tone.Compressor(-30, 3).toMaster();
            this.processor = new Processor();
            this.sequencer = new Sequencer(16, this.compressor);
            Tone.Transport.bpm.value = this.sequencer.options.bpm.default;
            Promise.all([
                this.sequencer.initialize(),
                // this.initializeSampler(this.chordsUrls, this.chordInstrument).then((result) => { this.chordPlayer = result;}),
                this.initializeSampler(this.harpUrls, this.harpInstrument).then((result) => { this.harpPlayer = result;})
            ]).then(() => {
                Tone.Transport.start();
                this.state.initialized = true;
                done();
            })
        })
    }

    async initializeSampler(urls, instrupath) {
        let sampler;
        return new Promise((done) => {
            sampler = new Tone.Sampler(urls, done,
                "./assets/js/app/instruments/synths/" + instrupath + "/"
            )
            sampler.volume.value = -20;
            sampler.release = 1.5;
        }).then(() => {
            let reverb = new Tone.JCReverb(0.2);
            reverb.wet.value = 0.2;
            let delay = new Tone.FeedbackDelay(0.2);
            delay.wet.value = 0.2;
            let vibrato = new Tone.Tremolo(10);
            this.disto = new Tone.Distortion(0);
            this.disto.wet.value = 0.5;
            sampler.chain(this.disto, vibrato, reverb, this.compressor);
            sampler.context.resume();
            return sampler
        });
    }

    getState() {
        let state = this.state;
        state.options = this.sequencer.options;
        state.bpm = this.getBPM();
        state.sequencer = this.sequencer.getState();
        return state;
    }

    getBPM() {
        return Math.trunc(Tone.Transport.bpm.value);
    }

    setBPM(value) {
        Tone.Transport.bpm.value = Math.trunc(value * (this.sequencer.options.bpm.max - this.sequencer.options.bpm.min) + this.sequencer.options.bpm.min);
    }

    onChord(id) {
        let chords = ["Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#"];
        let chord = chords[parseInt(id) % 12];
        let col = Math.floor(parseInt(id) / 12);
        this.processor.sthActivated = false;
        if (col == 1) {
            chord += 'm';
        } else if (col == 2) {
            this.processor.sthActivated = true;
        }
        this.startChord(chord);
    }

    onHarp(y){
        let note = (Math.floor(y*60));
        this.startHarp(note);
    }

    startChord(chord) {
        try{
            this.chordPlayer.triggerRelease(this.currentChord.notes);
        }catch(e){}
        this.currentChord.name = chord;
        this.currentChord.notes = this.processor.getChordNotes(this.currentChord.name);
        // this.chordPlayer.triggerAttackRelease(this.currentChord.notes, 2);
    }

    stopChord(notes) {
        this.chordPlayer.triggerRelease(notes);
    }

    startHarp(note){
        try{
            this.harpPlayer.triggerRelease(this.playingNote);
        }
        catch(e){}
        if (this.currentChord.notes.length > 0) { // only play if there is a chord activated
            let octave = Math.floor(note / 12) + 1; // finding octave according to note number
            let newnote = note % 12; // finding note position on octave
            newnote = Math.floor(newnote * this.currentChord.notes.length / 12); // keeping only x possibilities
            // applying transformation according to current chord
            newnote = this.currentChord.notes[newnote];
            console.log(newnote);
            newnote = this.processor.changeOctave(newnote, octave);
            if(newnote != this.playingNote){
                this.playingNote = newnote;
                this.harpPlayer.triggerAttackRelease(newnote, 1);
                console.log("playing", newnote )
            }
        }
    }
    stopHarp() {
        this.harpPlayer.releaseAll();
    }
}

class Processor {
    constructor() {
        this.scales = {
            major: [0, 2, 4, 5, 7, 9, 11, 12],
            minor: [0, 2, 3, 5, 7, 8, 10, 12]
        };
        this.notes = ["A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab"];
        this.sthActivated = false;
        this.notesnames = {
            "A": 0, "A#": 1, "Bb": 1, "B": 2, "C": 3, "C#": 4, "Db": 4, "D": 5, "D#": 6, "Eb": 6, "E": 7, "F": 8, "F#": 9, "Gb": 9, "G": 10, "G#": 11, "Ab": 11
        };
    }

    getNoteId(note) {
        if (Object.keys(this.notesnames).includes(note)) {
            return this.notesnames[note];
        }
        return null;
    }

    changeOctave(note, octave) {
        return note.slice(0, -1) + octave;
    }

    parseChord(chord) {
        let chordDetails = {
            scale: this.scales.major,
            note: 'A'
        };
        if (chord.includes('m')) {
            chordDetails.scale = this.scales.minor;
            chord = chord.replace('m', '');
        }
        chordDetails.note = this.getNoteId(chord);
        return chordDetails;
    }

    getChordNotes(chord) {
        let chordDetails = this.parseChord(chord);
        let octave = 2;
        let transposedScale = this.getScale(chordDetails.note, chordDetails.scale, octave);
        let tonic = transposedScale[0] + octave;
        let supertonic = transposedScale[1] + octave;
        let mediant = transposedScale[2] + octave;
        let subdominant = transposedScale[3] + octave;
        let dominant = transposedScale[4] + octave;
        let submediant = transposedScale[5] + octave;
        let leadingTone = transposedScale[6] + octave;

        let notes = [tonic, mediant, dominant];
        if (this.sthActivated) {
            notes.push(leadingTone);
        }
        return notes
    }

    getScale(note, scale = this.scales.major) {
        let transposed_notes = [];
        for (let i = 0; i < 7; i++) {
            transposed_notes.push(this.notes[(note + scale[i]) % 12]);
        }
        return transposed_notes;
    }
}