export default class Sequencer {
    constructor(size, output) {
        this.step = 0;
        this.size = size;
        this.output = output;
        this.instruments = [{}, {}, {}, {}];
        this.steptickevent = new CustomEvent('steptick', {});
        this.tickevent = new CustomEvent('mytick', {});
        this.selected = 0;
        this.options = {
            bpm: {
                min: 20,
                max: 120,
                default: 60
            },
            volume: {
                min: 0,
                max: 1,
                default: 0.5
            },
            feedbackdelaytime: {
                min: 0,
                max: 0.25,
                default: 0
            },
            feedbackamount: {
                min: 0,
                max: 1,
                default: 0
            },
            filterfreq: {
                min: 0.1,
                max: 800,
                default: 200
            }
        };
    }

    async initialize() {
        return new Promise((init) => {
            Promise.all([
                this.initSequencerInstrument("./assets/js/app/instruments/kickoo.wav").then((r) => { this.instruments[0] = r }),
                this.initSequencerInstrument("./assets/js/app/instruments/snorecool.wav").then((r) => { this.instruments[1] = r }),
                this.initSequencerInstrument("./assets/js/app/instruments/clap.wav").then((r) => { this.instruments[2] = r }),
                this.initSequencerInstrument("./assets/js/app/instruments/hiha.wav").then((r) => { this.instruments[3] = r })
            ]).then(() => {
                this.matrix = this.initializeMatrix();
                this.loop = new Tone.Loop((time) => {
                    this.playSounds(time);
                    this.step = (this.step + 1) % this.size;
                    this.sendStepTick();
                    if (this.step % (this.size / 4) == 0) {
                        this.sendTick();
                    }
                }, String(this.size) + "n");
                init();
            })
        })
    }

    initSequencerInstrument(file) {
        return new Promise((result) => {
            let instru = {};
            new Promise((done) => {
                new Tone.Player(file, done);
            }).then((res) => {
                instru.instrument = res;
                instru.params = {};
                instru.volume = new Tone.Volume(this.volumeToDB(this.options.volume.default));
                this.setVolume(instru, this.options.volume.default);

                instru.params.feedbackamount = this.getParamValue(this.options.feedbackamount.default, 'feedbackamount');
                instru.params.feedbackdelaytime = this.getParamValue(this.options.feedbackdelaytime.default, 'feedbackdelaytime');
                instru.feedback = new Tone.FeedbackDelay(instru.params.feedbackdelaytime, instru.params.feedbackamount);

                instru.params.filterfreq = this.getParamValue(this.options.filterfreq.default, 'filterfreq');
                instru.filter = new Tone.Filter(instru.params.filterfreq, "bandpass");

                instru.instrument.chain(instru.feedback, instru.filter, instru.volume, this.output);
                result(instru);
            })
        })
    }

    toggleMatrix(step) {
        this.matrix[step][this.selected] = 1 - this.matrix[step][this.selected];
    }

    getParamValue(realvalue, param) {
        return (realvalue - this.options[param].min) / (this.options[param].max - this.options[param].min);
    }

    volumeToDB(vol) {
        return Math.round(20 * Math.log10((vol / 2 + 0.000001) * 10));
    }

    setCurrentVolume(v) {
        this.setVolume(this.instruments[this.selected], v);
    }

    setVolume(instru, v) { // 0-1
        let volumedb = this.volumeToDB(v);
        instru.volume.volume.value = volumedb;
        instru.params.volume = v;
    }

    setCurrentEffect(effect, value) {
        this.setEffect(this.instruments[this.selected], effect, value);
    }

    setEffect(instru, effect, value) {
        let newValue = this.clampOption(value, effect);
        switch (effect) {
            case 'feedbackdelaytime':
                instru.feedback.delayTime.value = newValue;
                break;
            case 'feedbackamount':
                instru.feedback.feedback.value = newValue;
                break;
            case 'filterfreq':
                instru.filter.frequency.value = newValue;
                break;
            default:
                break;
        }
        instru.params[effect] = value;
    }

    clampOption(v, option) {
        return this.clamp(v, this.options[option].min, this.options[option].max);
    }

    clamp(v, min, max) {
        return v * (max - min) + min;
    }

    start() {
        if (this.loop.state != 'started') {
            this.loop.start(this.step);
            this.started = true;
        }
    }

    stop() {

        if (this.loop.state != 'stopped') {
            this.loop.stop();
            this.started = false;
        }
    }

    initializeMatrix() {
        let matrix = [];
        let step = [];
        for (let i = 0; i < this.size; i++) {
            step = [];
            for (let j = 0; j < this.instruments.length; j++) {
                step.push(0);
            }
            matrix.push(step);
        }
        return matrix;
    }

    setMatrix(mat) {
        this.matrix = mat;
    }

    playSounds(time) {
        for (let i = 0; i < this.instruments.length; i++) {
            const active = this.matrix[this.step][i] == 1;
            if (active) {
                this.instruments[i].instrument.start(time);
            }
        }
    }

    sendStepTick() {
        window.dispatchEvent(this.steptickevent);
    }

    sendTick() {
        window.dispatchEvent(this.tickevent);
    }

    getState() {
        let state = {
            step: this.step,
            selected: this.selected,
            matrix: this.matrix,
            started: (this.loop.state == 'started'),
            instruments: this.getInstrumentsState()
        }
        return state;
    }
    getInstrumentsState() {
        let instruments = [];
        this.instruments.forEach((instru, i) => {
            instruments.push({
                volume: instru.params.volume,
                feedbackdelaytime: instru.params.feedbackdelaytime,
                feedbackamount: instru.params.feedbackamount,
                filterfreq: instru.params.filterfreq
            });
        });
        return instruments;
    }
}
