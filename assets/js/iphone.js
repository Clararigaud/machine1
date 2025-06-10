document.addEventListener('DOMContentLoaded', () => {
    let sequencer = document.querySelector('#sequencer-container');
    for (let i = 0; i < 16; i++) {
        let row = Math.floor(i / 4);
        let col = i % 4;
        let n = 13 - col * 4 + row;
        let btn = document.createElement('div');
        let options = { type: 'button', toggle: true, value: "/iphone/button" + String(n) }
        btn.setAttribute('id', 'button' + String(n));
        btn.setAttribute('data-zombitron', JSON.stringify(options));
        btn.classList.add('row-' + row, 'col-' + col);
        sequencer.appendChild(btn);
    }
});

let matrix = [];
window.addEventListener('zombiterfaceready', function () {
    Object.values(window.zombitron.zombiterface.interfaces).forEach((e) => {
        for (let i = 0; i < 4; i++) {
            let objs = document.createElement('div');
            objs.setAttribute('id', e.id + "-" + i);
            objs.classList.add('sub-button', 'instrument-' + i);
            e.element.append(objs)
        }
    });
});

window.addEventListener('seqmatrix', function (m) {
    updateMatrix(m.detail);
});

window.addEventListener('steptick', () => {
    updateStep(window.musiccontroller.machine.sequencer.step);
});

async function updateStep(step) {
    let current = document.querySelector('.current');
    if (current) {
        current.classList.remove('current');
    }
    document.querySelector('#button' + String(step + 1)).classList.add('current');
}

async function updateMatrix(newmat) {
    if (JSON.stringify(Array.from(matrix)) != JSON.stringify(Array.from(newmat))) {
        matrix = newmat;
        matrix.forEach((m, step) => {
            let button = document.getElementById('button' + String(step + 1));
            m.forEach((instru, i) => {
                let subbutton = button.querySelector('.sub-button.instrument-' + String(i));
                if (subbutton) {
                    if (m[i] == 1) {
                        subbutton.classList.add('activated');
                    } else {
                        subbutton.classList.remove('activated');
                    }
                }
            })
        });
    }
}