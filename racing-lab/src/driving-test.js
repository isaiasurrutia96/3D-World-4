import { sampleDrivingPedals } from './driving-pedals.js';
import { F1_2026_SYSTEMS } from '../../racing-core/kart/f1-2026-systems.ts';
import { DRIVING_PROFILES } from '../../racing-core/kart/profiles.ts';
import { KART_PROTOTYPES, isKartPrototype } from '../../racing-core/kart/prototypes.ts';
import { createDrivingTest, TRACK_IDS, PARKED_KARTS, readDrivingInput } from '../../racing-core/testing/drive.ts';
import { createCheckedTrackView, createStartLine } from './checked-track-view.js';
import { createOriginalKartView } from './kart-view.js';
import { createPrototypeKartView } from './prototype-kart-view.js';
import { bindDrivingButtons } from './driving-controls.js';
import { FPV, createDrivingCameraRig } from './driving-camera.js';
import { createF1EngineAudio } from './f1-engine-audio.js';
const $ = s => document.querySelector(s);
const F1_2026_OPTION = 'f1-2026';
const GT3_OPTION = 'gt-gt3';
const GT3_AID_DISPLAY_THRESHOLD = .01;
const GT3_HELP = 'Drive with the arrows or E S D F, brake with Space, and look with J L I K or by dragging. On a phone, hold the steering and pedal buttons. On a gamepad, steer and drive with the left stick or use RT for gas and LT for brake. TC manages wheelspin. ABS helps prevent wheel lock.';
const showText = (element, text) => { if (element.textContent !== text) element.textContent = text; };
function showGearAndRpm(display, { gear, rpm }, rpmIncrement = 100) {
    const gearLabel = gear < 0 ? 'R' : gear === 0 ? 'N' : gear;
    showText(display, `Gear ${gearLabel} · ${Math.round(rpm / rpmIncrement) * rpmIncrement} rpm`);
}
export function createDrivingSimulation({ scene, stage, floor }) {
    document.body.classList.add('driving-test-page');
    floor.visible = false;
    const params = new URLSearchParams(location.search), requested = params.get('track'), requestedProfile = params.get('handling');
    const profile = ['original','balanced','fast'].includes(requestedProfile) ? requestedProfile : 'fast';
    const selection = TRACK_IDS.includes(requested) || requested === PARKED_KARTS ? requested : 'original';
    const requestedKart = params.get('kart');
    let prototype = isKartPrototype(requestedKart) ? requestedKart : undefined;
    let f1Tune = params.get('f1Tune') === '2026' ? '2026' : 'early';
    let gtTune = params.get('gtTune') === 'gt3' ? 'gt3' : 'early';
    let test = createDrivingTest(selection, { profile, prototype, f1Tune, gtTune });
    const original = createOriginalKartView();
    const views = new Map();
    let kart = original;
    const parkedKarts = [];
    scene.add(original.root);
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
    picker.querySelector('select').append(new Option('Parked Karts', PARKED_KARTS));
    const kartPicker = document.createElement('label');
    kartPicker.className = 'track-picker kart-picker';
    kartPicker.innerHTML = 'Kart <select id="driving-kart" aria-label="Choose kart"></select>';
    const kartSelect = kartPicker.querySelector('select');
    kartSelect.append(new Option('Original Kart', 'original'));
    for (const [id, dimensions] of Object.entries(KART_PROTOTYPES)) {
        if (id === 'f1') {
            const f1Options = document.createElement('optgroup');
            f1Options.label = dimensions.label;
            f1Options.append(new Option('Early F1', id), new Option('2026 F1', F1_2026_OPTION));
            kartSelect.append(f1Options);
        } else if (id === 'gt') {
            const gtOptions = document.createElement('optgroup');
            gtOptions.label = dimensions.label;
            gtOptions.append(new Option('First-drive GT', id), new Option('GT3', GT3_OPTION));
            kartSelect.append(gtOptions);
        } else kartSelect.append(new Option(dimensions.label, id));
    }
    picker.after(kartPicker);
    const help = $('#test-videos .help');
    const defaultHelp = help.textContent;

    const engineAudio = createF1EngineAudio();
    const topbar = $('#topbar');
    const sound = document.createElement('button');
    sound.id = 'race-sound';
    sound.type = 'button';
    sound.textContent = 'Sound';
    sound.setAttribute('aria-label', 'Engine sound');
    sound.setAttribute('aria-pressed', 'false');
    sound.hidden = true;
    sound.onclick = () => {
        if (engineAudio.enabled) engineAudio.disable();
        else engineAudio.enable(test.controller.state.handling?.formula?.rpm ?? 0);
        sync();
    };
    $('#reset').before(sound);

    function showKart() {
        kart.root.visible = false;
        const isParked = test.selection === PARKED_KARTS;
        const id = isParked ? undefined : prototype;
        const is2026 = id === 'f1' && f1Tune === '2026';
        const isGT3 = id === 'gt' && gtTune === 'gt3';
        const hasPowertrainHud = is2026 || isGT3;
        kartSelect.disabled = isParked;
        kartSelect.value = is2026 ? F1_2026_OPTION : isGT3 ? GT3_OPTION : id ?? 'original';
        sound.hidden = !is2026 || !engineAudio.available;
        topbar.classList.toggle('with-f1-sound', !sound.hidden);
        topbar.classList.toggle('with-gt-picker', id === 'gt');
        stage.classList.toggle('with-powertrain-hud', hasPowertrainHud);
        if (hasPowertrainHud) hud.setAttribute('aria-live', 'off');
        else hud.removeAttribute('aria-live');
        revsDisplay.hidden = systemsDisplay.hidden = !is2026;
        gtRevsDisplay.hidden = gtAidsDisplay.hidden = !isGT3;
        boost.hidden = boost.disabled = isGT3;
        boost.textContent = is2026 ? 'Overtake' : 'Boost';
        showText(help, isGT3 ? GT3_HELP : defaultHelp);
        if (id && !views.has(id)) {
            const made = createPrototypeKartView(id);
            scene.add(made.root);
            views.set(id, made);
        }
        kart = id ? views.get(id) : original;
        kart.root.visible = true;
    }

    const fpvButton=document.createElement('button');fpvButton.dataset.view='fpv';fpvButton.textContent='FPV';fpvButton.title='First-person view';fpvButton.setAttribute('aria-pressed','false');document.querySelector('nav[aria-label="Camera views"]').append(fpvButton);
    const hud = document.createElement('output');
    hud.className = 'race-hud';
    hud.setAttribute('aria-label', 'Driving information');
    hud.innerHTML = '<strong id="drive-speed">0 mph</strong><span id="drive-state">Ready</span><span id="drive-f1-revs" hidden></span><span id="drive-f1-systems" hidden></span><span id="drive-gt-revs" hidden></span><span id="drive-gt-aids" hidden></span>';
    const speedDisplay = hud.querySelector('#drive-speed');
    const stateDisplay = hud.querySelector('#drive-state');
    const revsDisplay = hud.querySelector('#drive-f1-revs');
    const systemsDisplay = hud.querySelector('#drive-f1-systems');
    const gtRevsDisplay = hud.querySelector('#drive-gt-revs');
    const gtAidsDisplay = hud.querySelector('#drive-gt-aids');
    const lapDisplay = document.createElement('span');
    lapDisplay.hidden = true;
    hud.append(lapDisplay);
    stage.append(hud);
    const debug = params.get('debug') === '1' ? document.createElement('output') : null;
    if (debug) { debug.className = 'drive-debug'; debug.setAttribute('aria-label','Driving diagnostics'); stage.append(debug); }
    const controls = document.createElement('div');
    controls.className = 'drive-controls';
    controls.innerHTML = '<div class="drive-steering" role="group" aria-label="Steering"><button id="race-left" aria-pressed="false">← Left</button><button id="race-right" aria-pressed="false">Right →</button></div><div class="drive-pedals" role="group" aria-label="Pedals"><button id="race-gas" aria-pressed="false">Gas</button><button id="race-reverse" aria-pressed="false">Brake / Reverse</button></div>';
    stage.append(controls);
    const videosLink = document.createElement('a');
    videosLink.className = 'drive-videos-link';
    videosLink.href = '#test-videos';
    videosLink.textContent = 'Test videos ↓';
    stage.append(videosLink);
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
    function reset() {
        holds?.clear();
        engineAudio.mute();
        test.reset();
        pose = test.sample();
        draw();
        showKart();
        picker.querySelector('select').value = test.selection;
        sync();
    }
    function showFormulaSystems(formula, speed, throttle) {
        const enabled = String(engineAudio.enabled);
        if (sound.getAttribute('aria-pressed') !== enabled) sound.setAttribute('aria-pressed', enabled);
        if (!formula) { engineAudio.mute(); return; }

        const aero = formula.aeroOpening === 0 ? 'Corner' : formula.aeroOpening === 1 ? 'Straight' : 'Moving';
        const charge = Math.round(formula.energyJ / F1_2026_SYSTEMS.energyCapacityJ * 100);
        showGearAndRpm(revsDisplay, formula);
        showText(systemsDisplay, `${aero} aero · ${charge}% charge`);
        if (bindings?.input.focused && bindings.input.enabled && !document.hidden && pose.y >= -10)
            engineAudio.update({ rpm: formula.rpm, throttle, speed });
        else engineAudio.mute();
    }
    function showGT3Systems(gt3) {
        showGearAndRpm(gtRevsDisplay, gt3, 50);
        const tc = gt3.tractionIntervention >= GT3_AID_DISPLAY_THRESHOLD ? 'active' : 'ready';
        const abs = gt3.absIntervention >= GT3_AID_DISPLAY_THRESHOLD ? 'active' : 'ready';
        showText(gtAidsDisplay, `TC ${tc} · ABS ${abs}`);
    }
    function sync() {
        const lap = test.lap;
        lapDisplay.hidden = !lap;
        if (lap) {
            const current = lap.running ? 'Lap ' + (lap.laps + 1) + ' · ' + lap.elapsed.toFixed(2) + ' s' : 'Cross the line to start';
            const best = lap.best === null ? '' : ' · Best ' + lap.best.toFixed(2) + ' s';
            const lapText = current + best;
            if (lapDisplay.textContent !== lapText) lapDisplay.textContent = lapText;
        }
        const state = test.controller.state;
        const h = state.handling;
        const formula = h?.formula;
        const gt3 = h?.gt3;
        const speed = Math.hypot(state.speed, state.lateralSpeed);
        if (debug) {
            const diagnostics = h ? `${test.controller.profile.label} · ${speed.toFixed(1)} m/s\nAcceleration ${h.acceleration.toFixed(2)} m/s² · braking ${h.brakingG.toFixed(2)} G\nSideways ${h.lateralG.toFixed(2)} G · wheels ${(pose.steering * 180 / Math.PI).toFixed(2)}°\nSlip indicator ${h.tireSlip.toFixed(3)} · slip angle ${(h.slipAngle * 180 / Math.PI).toFixed(1)}°` : 'Original handling';
            const powertrain = formula ?? gt3;
            const detail = formula ? `\nElectrical drive ${(formula.deploymentPowerW / 1000).toFixed(0)} kW · recovery ${(formula.recoveryPowerW / 1000).toFixed(0)} kW`
                : gt3 ? `\nTC reduction ${(gt3.tractionIntervention * 100).toFixed(1)}% · ABS reduction ${(gt3.absIntervention * 100).toFixed(1)}%` : '';
            const axleLoad = powertrain ? `\nFront axle load ${(powertrain.frontWeightFraction * 100).toFixed(1)}%` : '';
            showText(debug, diagnostics + detail + axleLoad);
        }
        kart.update(pose);
        syncParked();
        holds?.sync();
        showFormulaSystems(formula, speed, h?.throttle ?? 0);
        if (gt3) showGT3Systems(gt3);
        showText(speedDisplay, `${Math.round(speed / .44704)} mph`);
        const status = pose.y < -10 ? 'Use Reset to return to the track'
            : state.boostTime > 0 && !formula && !gt3 ? 'Boosting'
            : state.boostTime > 0 && formula?.deploymentPowerW > 0 ? 'Overtake'
            : Math.abs(pose.speed) < .05 ? 'Ready' : pose.speed < 0 ? 'Reversing' : 'Driving';
        showText(stateDisplay, status);
    }
    function syncParked() {
        const states = test.sampleParked();
        if (states.length && !parkedKarts.length) {
            for (const color of ['#f4b43b', '#42b8de']) {
                const view = createOriginalKartView(color);
                view.root.name = 'Parked kart ' + (parkedKarts.length + 1);
                parkedKarts.push(view);
                scene.add(view.root);
            }
        }
        for (const [i, parked] of parkedKarts.entries()) {
            parked.root.visible = Boolean(states[i]);
            if (states[i]) parked.update(states[i]);
        }
    }
    const cameraRig=createDrivingCameraRig(() => pose, () => kart.eye ?? FPV);
    function pause() { holds?.clear(); test.cancelInput(); engineAudio.mute(); }
    const api = { zoomEnabled: false, cameraRig,marker: original.root, recenterOnView: true, onPause: pause, chase: true, chaseRate: 5, chasePitch: Math.atan2(3.5, 10), fov: 45, distance: Math.hypot(10, 3.5), minDistance: 4, maxDistance: 100, maxFrameSeconds: .25, targetHeight: 1, cameraObstacles: [], controller: { get state() { return { ...pose, facing: pose.yaw, mode: 'Driving test' }; }, place: reset }, advance(seconds, sample, cameraYaw) { if (!bindings.input.focused)
            return; test.advance(seconds, readDrivingInput(sampleDrivingPedals(sample, bindings.input), cameraYaw)); pose = test.sample(); }, afterFrame() { sync(); }, bind(value) { bindings = value; value.canvas.tabIndex = 0; value.input.setTouchStick(false); holds = bindDrivingButtons(value.input, value.canvas, buttons);for(const button of document.querySelectorAll('#topbar button'))button.addEventListener('click',()=>value.canvas.focus({preventScroll:true})); } };
    function refresh() {
        if (bindings) {
            bindings.reset();
            bindings.canvas.focus({ preventScroll: true });
        } else reset();
    }
    function selectTrack(id) {
        test.selectTrack(id);
        refresh();
    }
    picker.querySelector('select').onchange = event => selectTrack(event.currentTarget.value);
    kartSelect.onchange = () => {
        const id = kartSelect.value;
        f1Tune = id === F1_2026_OPTION ? '2026' : 'early';
        gtTune = id === GT3_OPTION ? 'gt3' : 'early';
        prototype = id === F1_2026_OPTION ? 'f1' : id === GT3_OPTION ? 'gt' : isKartPrototype(id) ? id : undefined;
        test = createDrivingTest(test.selection, { profile, prototype, f1Tune, gtTune });
        refresh();
    };
    window.addEventListener('blur', pause);
    window.addEventListener('pagehide', event => {
        if (event.persisted) engineAudio.mute();
        else engineAudio.disable();
    });
    reset();
    window.drivingLab = { get test() { return test; }, get kart() { return kart; }, profiles: DRIVING_PROFILES,
        get trackView() { return view; }, getState: () => test.getState(), getCameraState: () => cameraRig.getState(), selectTrack };
    window.drivingLabReady = true;
    return api;
}
