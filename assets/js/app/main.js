// controller
import Machine from '/assets/js/app/Machine.js';

class Controller {
    constructor() {
        this.initialize();
    }
    async initialize() {
        this.machine = new Machine();
        await this.machine.initialize().then(() => {
            // this.machine.sequencer.setMatrix([
            //     [0, 0, 0, 1], [1, 1, 0, 0],
            //     [1, 1, 0, 0], [0, 0, 1, 0],
            //     [1, 0, 1, 0], [0, 1, 0, 0],
            //     [1, 0, 0, 0], [0, 1, 0, 1],
            //     [1, 0, 1, 0], [1, 0, 0, 1],
            //     [0, 1, 1, 0], [0, 1, 0, 1],
            //     [0, 1, 0, 0], [0, 0, 1, 1],
            //     [0, 0, 1, 1], [1, 0, 0, 0]
            // ]
            // );
            // this.machine.sequencer.setMatrix([
            //     [1, 0, 0, 0],
            //     [1, 0, 0, 0],
            //     [1, 0, 0, 0],
            //     [1, 0, 0, 0],
            //     [0, 1, 0, 0],
            //     [0, 1, 0, 0],
            //     [0, 1, 0, 0],
            //     [0, 1, 0, 0],
            //     [0, 0, 1, 0],
            //     [0, 0, 1, 0],
            //     [0, 0, 1, 0],
            //     [0, 0, 1, 0],
            //     [0, 0, 0, 1],
            //     [0, 0, 0, 1],
            //     [0, 0, 0, 1],
            //     [0, 0, 0, 1]
            // ]
            // );


            // this.machine.sequencer.setMatrix(
            //     [
            //         [1, 0, 0, 0], [0, 0, 1, 0],
            //         [0, 0, 0, 0], [0, 0, 1, 0],
            //         [1, 0, 0, 0], [0, 0, 0, 0],
            //         [0, 1, 0, 1], [0, 0, 0, 0],
            //         [1, 0, 1, 0], [0, 0, 1, 0],
            //         [1, 0, 1, 0], [1, 0, 1, 0],
            //         [1, 0, 0, 1], [0, 0, 0, 0],
            //         [0, 1, 0, 1], [0, 0, 0, 0]
            //     ]
            // );
            this.initializeControllers();
            this.sendState();
            this.sendSequencerMatrix();

            window.addEventListener('connection', (e) => {
                this.sendState();
            });

            window.addEventListener('steptick', () => {
                this.sendSequencerStep();
            });
            window.addEventListener('mytick', () => {
                this.sendTick();
            });
        });
    }

    initializeControllers() {
        // sequencer matrix event listeners
        const sequencermat = ["button1", "button2", "button3", "button4", "button5", "button6", "button7", "button8", "button9", "button10", "button11", "button12", "button13", "button14", "button15", "button16"];
        sequencermat.forEach((button) => {
            window.addEventListener('/iphone/' + button, (event) => {
                let step = parseInt(button.split('button')[1]) - 1;
                this.machine.sequencer.toggleMatrix(step);
                this.sendSequencerMatrix();
            });
        });

        // instrument controls
        window.addEventListener(String('/moche/selector'), (event) => {
            this.onInstrumentSelect(event);
        });

        window.addEventListener(String('/sequencerloop/onoff'), (event) => {
            if (event.detail == true) {
                if (this.machine.sequencer.loop.state != 'started') {
                    this.machine.sequencer.start();
                    console.log('starting');
                }
            } else {
                if (this.machine.sequencer.loop.state != 'stopped') {
                    this.machine.sequencer.stop();
                    console.log('stoping');
                }
            }
            this.sendState();
        });

        window.addEventListener(String('/moche/sliderbpm'), (event) => {
            this.machine.setBPM(event.detail);
            this.sendBPM();
        });

        window.addEventListener(String('/moche/slider1'), (event) => {
            this.machine.sequencer.setCurrentVolume(event.detail);
            this.sendState();
        });

        window.addEventListener(String('/moche/slider2'), (event) => {
            this.machine.sequencer.setCurrentEffect('feedbackdelaytime', event.detail);
            this.sendState();
        });

        window.addEventListener(String('/moche/slider3'), (event) => {
            this.machine.sequencer.setCurrentEffect('feedbackamount', event.detail);
            this.sendState();
        });

        window.addEventListener(String('/moche/slider4'), (event) => {
            this.machine.sequencer.setCurrentEffect('filterfreq', event.detail);
            this.sendState();
        });

        window.addEventListener(String('/chordselector'), (event) => {
            this.machine.onChord(event.detail);
        });

        window.addEventListener(String('/gigaset/slider1_y'), (event) => {
            this.machine.onHarp(event.detail);
        });

        window.addEventListener(String('/orientation/beta'), (event) => {
            this.machine.disto.distortion = (4*Math.abs(-(event.detail)))
        });
    }

    onInstrumentSelect(event) {
        this.machine.sequencer.selected = event.detail;
        this.sendState();
    }

    getState() {
        return {
            machine: this.machine.getState()
        }
    }

    sendState() {
        let state = this.getState();
        if (window.zombitron.zombiterface.ready) {
            window.zombitron.zombiterface.send({ 'data': { 'state': state } });
        }
        this.sendSequencerMatrix();
        this.sendBPM();
    };

    sendSequencerMatrix() {
        if (window.zombitron.zombiterface.ready) {
            window.zombitron.zombiterface.send({ 'data': { 'seqmatrix': this.machine.sequencer.matrix } });
        }
    };

    sendSequencerStep() {
        if (window.zombitron.zombiterface.ready) {
            window.zombitron.zombiterface.send({ 'data': { 'seqstep': this.machine.sequencer.step } });
        }
    };

    sendTick() {
        if (window.zombitron.zombiterface.ready) {
            window.zombitron.zombiterface.send({ 'data': { 'tick': '' } });
        }
    };

    sendBPM() {
        if (window.zombitron.zombiterface.ready) {
            window.zombitron.zombiterface.send({ 'data': { 'sequencerBPM': this.machine.getBPM() } });
        }
    };
}

window.musiccontroller = null;
async function start() {
    try {
        window.musiccontroller = new Controller();
    } catch (e) {
        alert(e)
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', () => {
        Tone.context.resume();
        if (window.zombitron.zombiterface) {
            if (window.zombitron.zombiterface.ready) {
                start();
            }
        } else {
            window.addEventListener("zombiterfaceready", async (event) => {
                start()
            }, { once: true });
        }
    }, { once: true });
})