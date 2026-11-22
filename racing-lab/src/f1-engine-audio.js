// Six cylinders firing once every two turns put the strongest tone at
// the third crankshaft harmonic. The lighter harmonics model the timbre.
const HARMONICS = [0, .14, .06, .56, .09, .12, .28, .07, .06, .16, .04, .03, .07];

/** Local engine feedback, started by the driver's Sound button. */
export function createF1EngineAudio() {
    const Audio = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    let voice = null;

    function disable() {
        const context = voice?.context;
        voice = null;
        if (context && context.state !== 'closed') void context.close().catch(() => {});
    }

    function setLevel(level, responseSeconds) {
        if (!voice || voice.level === level) return;
        voice.gain.gain.setTargetAtTime(level, voice.context.currentTime, responseSeconds);
        voice.level = level;
    }

    const mute = () => setLevel(0, .018);

    return {
        available: Boolean(Audio),
        get enabled() { return voice !== null; },
        enable(rpm) {
            if (!Audio || voice) return;
            let context;
            try {
                context = new Audio({ latencyHint: 'interactive' });
                const oscillator = context.createOscillator();
                const tone = context.createBiquadFilter();
                const gain = context.createGain();
                oscillator.setPeriodicWave(context.createPeriodicWave(new Float32Array(HARMONICS.length), new Float32Array(HARMONICS)));
                oscillator.frequency.value = rpm / 60;
                tone.type = 'lowpass';
                tone.Q.value = .6;
                gain.gain.value = 0;
                oscillator.connect(tone).connect(gain).connect(context.destination);
                oscillator.start();
                voice = { context, oscillator, tone, gain, level: 0 };
                void context.resume().catch(() => { if (voice?.context === context) disable(); });
            } catch {
                if (voice?.context === context) disable();
                else if (context && context.state !== 'closed') void context.close().catch(() => {});
            }
        },
        disable,
        mute,
        update({ rpm, throttle, speed }) {
            const running = rpm > 0 && (speed > .5 || Math.abs(throttle) > .04);
            if (!running) { mute(); return; }
            if (!voice || voice.context.state !== 'running') return;
            const now = voice.context.currentTime;
            const crank = rpm / 60;
            const load = Math.abs(throttle);
            voice.oscillator.frequency.setTargetAtTime(crank, now, .025);
            voice.tone.frequency.setTargetAtTime(850 + crank * 7 + load * 1300, now, .045);
            setLevel(.027 + .048 * load, .035);
        },
    };
}
