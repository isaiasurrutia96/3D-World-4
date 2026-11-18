/** Hold buttons feed the existing shared input module, including multi-touch and cancellation. */
export function bindDrivingButtons(input, canvas, buttons) {
    const held = new Map();
    const set = (name, button) => { const down = held.get(name).size > 0; input.setAction(name, down); button.setAttribute('aria-pressed', String(down)); };
    for (const [name, button] of Object.entries(buttons)) {
        held.set(name, new Set());
        button.addEventListener('pointerdown', event => { event.preventDefault(); canvas.focus({ preventScroll: true }); input.focused = true; button.setPointerCapture(event.pointerId); held.get(name).add(event.pointerId); set(name, button); });
        for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
            button.addEventListener(type, event => { held.get(name).delete(event.pointerId); set(name, button); });
        button.addEventListener('keydown', event => { if (event.code === 'Space' || event.code === 'Enter') {
            event.preventDefault();
            input.focused = true;
            held.get(name).add('keyboard');
            set(name, button);
        } });
        button.addEventListener('keyup', event => { if (event.code === 'Space' || event.code === 'Enter') {
            event.preventDefault();
            held.get(name).delete('keyboard');
            set(name, button);
        } });
        button.addEventListener('blur', () => { held.get(name).delete('keyboard'); set(name, button); });
    }
    function clear() { for (const [name, button] of Object.entries(buttons)) {
        held.get(name).clear();
        input.setAction(name, false);
        button.setAttribute('aria-pressed', 'false');
    } }
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', () => { if (document.hidden)
        clear(); });
    return { clear, sync() { for (const [name, button] of Object.entries(buttons))
            button.setAttribute('aria-pressed', String(input.actions[name])); } };
}
