// Reuse the real track/view controls; only their mobile presentation changes.
export function installDrivingLayout() {
    const bar = document.querySelector('#topbar');
    const panel = document.createElement('div');
    panel.id = 'driving-options';
    panel.className = 'driving-options';
    const toggle = document.createElement('button');
    toggle.id = 'driving-options-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Track and view controls');
    toggle.setAttribute('aria-controls', panel.id);
    const help = document.createElement('details');
    help.className = 'driving-help';
    const summary = document.createElement('summary');
    summary.textContent = 'Driving controls';
    help.append(summary, document.querySelector('#test-videos .help'));
    panel.append(bar.querySelector('.track-picker'), bar.querySelector('nav'), bar.querySelector('#reset'), help);
    bar.append(toggle, panel);
    document.querySelector('#test-videos').hidden = true;

    const compact = matchMedia('(max-width: 1000px), (pointer: coarse)');
    function setOpen(open) {
        const expanded = compact.matches && open;
        toggle.hidden = !compact.matches;
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.textContent = expanded ? 'Controls ▴' : 'Controls ▾';
        panel.hidden = compact.matches && !expanded;
    }
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    panel.addEventListener('click', event => {
        if (event.target.closest('button')) setOpen(false);
    });
    panel.addEventListener('change', () => setOpen(false));
    document.addEventListener('pointerdown', event => {
        if (!bar.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
            setOpen(false);
            toggle.focus({ preventScroll: true });
        }
    });
    compact.addEventListener('change', () => setOpen(false));
    setOpen(false);
}
