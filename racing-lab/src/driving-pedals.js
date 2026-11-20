/** Preserve the shared input module; only driving needs continuous pedal values. */
export const PEDAL_DEAD_ZONE = .05;
const clamp = n => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
function trigger(button) {
    const value = clamp(button?.value ?? (button?.pressed ? 1 : 0));
    return value <= PEDAL_DEAD_ZONE ? 0 : (value - PEDAL_DEAD_ZONE) / (1 - PEDAL_DEAD_ZONE);
}
/** Standard Gamepad API mapping, device-independent and directly testable in Node. */
export function drivingPedals(sample, keys = new Set(), actions = {}, pads = []) {
    let gas = 0, brake = 0;
    for (const pad of pads) {
        if (!pad?.connected || pad.mapping !== 'standard') continue;
        gas = Math.max(gas, trigger(pad.buttons?.[7]));
        brake = Math.max(brake, trigger(pad.buttons?.[6]));
    }
    const keyGas = keys.has('KeyE') || keys.has('ArrowUp'), keyReverse = keys.has('KeyD') || keys.has('ArrowDown');
    const forward = actions.gas || keyGas, reverse = actions.reverse || keyReverse;
    // Digital inputs retain their original meanings; LT is an independent
    // brake, while the phone Brake/Reverse command brakes then reverses.
    let throttle;
    if (forward || reverse) throttle = reverse ? -1 : 1;
    else if (gas > 0) throttle = gas;
    else {
        // Stick throttle is recovered later in the same camera-relative adapter.
        return { ...sample, pedals: undefined, actions: { ...sample.actions, gas: false, brake: Boolean(actions.brake || keys.has('Space')) }, analogBrake: brake };
    }
    brake = Math.max(brake, Number(Boolean(actions.brake || keys.has('Space') || forward && reverse)));
    return { ...sample, pedals: { throttle, brake } };
}
/** Browser polling is deliberately outside the pure mapping function. */
export function sampleDrivingPedals(sample, input) {
    let pads = [];
    try { pads = navigator.getGamepads?.() ?? []; } catch { /* unavailable device API */ }
    return drivingPedals(sample, input.keys, input.actions, pads);
}
