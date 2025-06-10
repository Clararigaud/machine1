var selected = 0;
var elements;
var selector;
var buttonloop;
var slidervalues = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
var sliders = [null, null, null, null];
var bpmcontainer;
var machinestate;

window.addEventListener('zombiterfaceready', function (e) {
    selector = window.zombitron.zombiterface.find("selector");
    for (var i = 0; i < 4; i++) {
        sliders[i] = window.zombitron.zombiterface.find("slider" + String(i + 1));
        sliders[i].change = function (index) { slidervalues[selected][index] = sliders[index].value; }.bind(sliders[i], i);
    }
    selector.change = function () {
        selected = selector.value;
        document.getElementById('container').setAttribute('value', String(selected));
        sliders.forEach(function (slider, i) {
            slider.setValue(slidervalues[selected][i]);
        });
        // window.addEventListener('state', function (e) {
        //     updateInterface(e.detail);
        // }, { once: true });
    }
    bpmcontainer = document.querySelector('#bpms p');
    buttonloop = window.zombitron.zombiterface.find("startstopbutton");

    // window.addEventListener('state', function (e) {
    //     updateInterface(e.detail);
    // }, { once: true });
});
window.addEventListener('sequencerBPM', function (e) {
    bpmcontainer.innerHTML = e.detail;
});

// window.addEventListener('connection', function (n) {
//     window.addEventListener('state', function (e) {
//         updateInterface(e.detail);
//     }, { once: true });
// });

function updateInterface(state) {
    machinestate = state;
    var machineoptions = machinestate.machine.options;
    console.log(machinestate.machine)
    buttonloop.setValue(machinestate.machine.sequencer.started);
    window.zombitron.zombiterface.find("sliderbpm").setValue(clamp(machinestate.machine.bpm, machineoptions.bpm.min, machineoptions.bpm.max));
    updateInstruSliders(0, machinestate.machine)
    updateInstruSliders(1, machinestate.machine)
    updateInstruSliders(2, machinestate.machine)
    updateInstruSliders(3, machinestate.machine)
    window.zombitron.zombiterface.find("slider1").setValue(slidervalues[selected][0]);
    window.zombitron.zombiterface.find("slider2").setValue(slidervalues[selected][1]);
    window.zombitron.zombiterface.find("slider3").setValue(slidervalues[selected][2]);
    window.zombitron.zombiterface.find("slider4").setValue(slidervalues[selected][3]);
}

function updateInstruSliders(n, options){
    var instrumentoptions = options.sequencer.instruments[n];
    var machineoptions = options.options;
    slidervalues[n][0] = instrumentoptions.volume;
    slidervalues[n][1] = instrumentoptions.feedbackdelaytime;
    slidervalues[n][2] = instrumentoptions.feedbackamount;
    slidervalues[n][3] = instrumentoptions.filterfreq;
}

function clamp(value, min, max) {
    return (value - min) / (max - min);
}

var a = 30;
var canvas = document.getElementById("tictac");
var ctx = canvas.getContext("2d");
var r = 100;
var a = 30;
var offset = [0, 50];

function drawMetronome() {
    a = -a;
    ctx.clearRect(0, 0, 300, 300);
    ctx.fillStyle = "red";
    ctx.strokeStyle = "white";
    var pos = getPos(a, r, offset);;
    ctx.beginPath();
    ctx.moveTo(offset[0], offset[1]);
    ctx.lineTo(pos[0], pos[1]);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], 10, 0, 2 * Math.PI);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fill();
}

function getPos(a, r, offset) {
    var arad = a / 360 * Math.PI
    return [Math.cos(arad) * r + offset[0], Math.sin(arad) * r + offset[1]];
}

window.addEventListener('tick', function (e) {
    drawMetronome();
})