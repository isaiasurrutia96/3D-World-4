/** Input ownership only: no timers, rendering, browser globals or vehicle physics. */
export function createDrivingHolds(names, change) {
    const buttons = new Map(names.map(name => [name, { pointers: new Set(), keys: new Set() }]));
    if (buttons.size !== names.length || typeof change !== 'function') throw new TypeError('Unique button names and an action callback are required');
    const owners = new Map();
    const button = name => { const value=buttons.get(name); if (!value) throw new RangeError('Unknown driving button: '+name); return value; };
    const publish = name => { const b=button(name); change(name,b.pointers.size+b.keys.size>0); };
    function releasePointer(id, expectedName) {
        const owner=owners.get(id);
        if (owner===undefined || expectedName!==undefined && owner!==expectedName) return;
        owners.delete(id); button(owner).pointers.delete(id); publish(owner);
    }
    function clearButton(name) {
        const b=button(name);
        for (const id of b.pointers) owners.delete(id);
        b.pointers.clear(); b.keys.clear(); publish(name);
    }
    return Object.freeze({
        pressPointer(name,id) {
            button(name);
            // PointerEvent.pointerId is a signed Web IDL long, not an array index.
            if (!Number.isInteger(id)) throw new TypeError('Pointer id must be an integer');
            if (owners.get(id)===name) return;
            releasePointer(id); owners.set(id,name); button(name).pointers.add(id); publish(name);
        },
        releasePointer,
        pressKey(name,code) { button(name).keys.add(code); publish(name); },
        releaseKey(code,name) {
            for (const [key,b] of buttons) if ((name===undefined || key===name) && b.keys.delete(code)) publish(key);
        },
        blurButton(name) { const b=button(name); if (b.keys.size) { b.keys.clear(); publish(name); } },
        clearButton,
        clear() { for (const name of buttons.keys()) clearButton(name); },
        isHeld(name) { const b=button(name); return b.pointers.size+b.keys.size>0; },
        getState() { return Object.freeze({ pointerCount:owners.size, buttons:Object.freeze(Object.fromEntries([...buttons].map(([name,b])=>[name,Object.freeze({pointers:b.pointers.size,keys:b.keys.size,held:b.pointers.size+b.keys.size>0})]))) }); },
    });
}
