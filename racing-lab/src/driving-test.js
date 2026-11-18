import { createDrivingTest, TRACK_IDS, readDrivingInput } from '../../racing-core/testing/drive.ts';
import { createCheckedTrackView, createStartLine } from './checked-track-view.js';
import { createOriginalKartView } from './kart-view.js';
import { bindDrivingButtons } from './driving-controls.js';
import { createDrivingCameraRig } from './driving-camera.js';
import { installDrivingLayout } from './driving-layout.js';
const $ = s => document.querySelector(s);
export function createDrivingSimulation({ scene, stage, floor }) {
    document.body.classList.add('driving-test-page');
    floor.visible = false;
    const requested = new URLSearchParams(location.search).get('track'), test = createDrivingTest(TRACK_IDS.includes(requested) ? requested : 'original'), kart = createOriginalKartView();
    scene.add(kart.root);
    const picker = document.createElement('label');
    picker.className = 'track-picker';
    picker.innerHTML = 'Track <select id="race-track" aria-label="Choose track"></select>';
    $('#topbar .identity').after(picker);
    for (const id of TRACK_IDS) {
        const o = document.createElement('option');
        o.value = id;
        o.textContent = id === 'original' ? 'Original Circuit' : id === 'skyline' ? 'Skyline Circuit' : id === 'suzuka' ? 'Suzuka Circuit' : 'Winding Circuit';
        picker.querySelector('select').append(o);
    }
    const fpvButton=document.createElement('button');fpvButton.dataset.view='fpv';fpvButton.textContent='FPV';fpvButton.title='First-person view';fpvButton.setAttribute('aria-pressed','false');document.querySelector('nav[aria-label="Camera views"]').append(fpvButton);
    installDrivingLayout();
    const hud = document.createElement('output');
    hud.className = 'race-hud';
    hud.setAttribute('aria-label', 'Driving information');
    hud.innerHTML = '<strong id="drive-speed">0 mph</strong><span id="drive-state">Ready</span>';
    stage.append(hud);
    const controls = document.createElement('div');
    controls.className = 'drive-controls';
    controls.innerHTML = '<div class="drive-steering" role="group" aria-label="Steering"><button id="race-left" aria-pressed="false">← Left</button><button id="race-right" aria-pressed="false">Right →</button></div><div class="drive-pedals" role="group" aria-label="Pedals"><button id="race-gas" aria-pressed="false">Gas</button><button id="race-reverse" aria-pressed="false">Brake / Reverse</button></div>';
    stage.append(controls);
    const boost = document.createElement('button');
    boost.id = 'race-boost';
    boost.className = 'drive-boost';
    boost.textContent = 'Boost';
    boost.setAttribute('aria-pressed', 'false');
    stage.append(boost);
    const buttons = Object.fromEntries(['left', 'right', 'gas', 'reverse', 'boost'].map(name => [name, $('#race-' + name)]));
    let bindings = null, holds = null, view = null, line = null, drawn = null, pose = test.sample();
    function draw() { if (drawn === test.track)
        return; if (view) {
        scene.remove(view.root, line);
        view.dispose();
        line.traverse(o => { if (o.isMesh) {
            o.geometry.dispose();
            o.material.dispose();
        } });
    } drawn = test.track; view = createCheckedTrackView(drawn); line = createStartLine(drawn); scene.add(view.root, line); api.cameraObstacles = view.root.children.slice(0, 3); }
    function reset() { holds?.clear(); test.reset(); pose = test.sample(); draw(); picker.querySelector('select').value = test.track.id; sync(); }
    function sync() { kart.update(pose); holds?.sync(); $('#drive-speed').textContent = `${Math.round(Math.abs(test.controller.state.speed) / .44704)} mph`; $('#drive-state').textContent = pose.y < -10 ? 'Use Reset to return to the track' : test.controller.state.boostTime > 0 ? 'Boosting' : Math.abs(pose.speed) < .05 ? 'Ready' : pose.speed < 0 ? 'Reversing' : 'Driving'; }
    const cameraRig=createDrivingCameraRig(()=>pose);
    const api = { zoomEnabled: false, cameraRig,marker: kart.root, recenterOnView: true, onPause: () => test.cancelInput(), chase: true, chaseRate: 5, chasePitch: Math.atan2(3.5, 10), fov: 45, distance: Math.hypot(10, 3.5), minDistance: 4, maxDistance: 100, maxFrameSeconds: .25, targetHeight: 1, cameraObstacles: [], controller: { get state() { return { ...pose, facing: pose.yaw, mode: 'Driving test' }; }, place: reset }, advance(seconds, sample, cameraYaw) { if (!bindings.input.focused)
            return; test.advance(seconds, readDrivingInput(sample, cameraYaw)); pose = test.sample(); }, afterFrame() { sync(); }, bind(value) { bindings = value; value.canvas.tabIndex = 0; value.input.setTouchStick(false); holds = bindDrivingButtons(value.input, value.canvas, buttons);for(const button of document.querySelectorAll('#topbar button:not(#driving-options-toggle)'))button.addEventListener('click',()=>value.canvas.focus({preventScroll:true})); } };
    picker.querySelector('select').onchange = () => { test.selectTrack(picker.querySelector('select').value); bindings.reset(); bindings.canvas.focus({ preventScroll: true }); };
    window.addEventListener('blur', () => test.cancelInput());
    reset();
    window.drivingLab = { test, kart, get trackView() { return view; }, getState: () => test.getState(), getCameraState:()=>cameraRig.getState(), selectTrack(id) { test.selectTrack(id); bindings.reset(); } };
    window.drivingLabReady = true;
    return api;
}
