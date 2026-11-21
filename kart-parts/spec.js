// Kart parts system: the foundation every new kart is built on (owner, 21 Nov 2026).
// Pure data and checks, no three.js, so Node tests and later driving code can read it.
// Units: metres. +Y is up, +Z is forward (the same as the main test kart).
// Looks only: upgrade values are stored here for Codex's driving code, which
// owns what they do. Nothing in this file moves or drives a kart.

/** Every kind of part a kart can have. `required` parts are on every kart of a
 *  mode; the others are optional add-ons players can fit later. */
export const SLOTS = Object.freeze({
  // Built with the chassis (real geometry from chunk 1).
  frame:       {group:'chassis', label:'Frame', note:'The metal tubes everything bolts onto.'},
  seat:        {group:'chassis', label:'Seat', note:'Swappable for other seat styles.'},
  steering:    {group:'chassis', label:'Steering wheel', note:'Swappable for other steering wheels.'},
  wheels:      {group:'chassis', label:'Rims and tires', note:'Rims and tires are swappable; off-road tires fit any kart.'},
  // Body parts (outlines in chunk 1, built in later chunks).
  nose:        {group:'body', label:'Nose', note:'The pointed front of the kart.'},
  hood:        {group:'body', label:'Hood', note:'The top panel in front of the steering wheel. Airflow versions add downforce.'},
  frontBumper: {group:'body', label:'Front bumper', note:'Airflow versions add downforce.'},
  sidePanels:  {group:'body', label:'Side panels', note:'One on each side of the seat.'},
  rearBumper:  {group:'body', label:'Rear bumper', note:'Protects the back of the kart.'},
  fenders:     {group:'body', label:'Fenders', note:'Arches over the wheels with the rims still visible. Airflow versions add downforce.'},
  diffuser:    {group:'body', label:'Diffuser', note:'Under the back of the kart; helps downforce.'},
  wing:        {group:'body', label:'Rear wing or spoiler', note:'Adds downforce.'},
  mudFlaps:    {group:'body', label:'Mud flaps', note:'Behind the rear wheels; for off-road looks.'},
  exhaust:     {group:'body', label:'Exhaust', note:'One pipe, two pipes or a big chrome style.'},
  lights:      {group:'body', label:'Lights', note:'Bought part, for example an off-road light bar.'},
});

/** Upgrades that change driving. The values are placeholders for Codex to tune. */
export const UPGRADES = Object.freeze({
  chassisWeight: {label:'Chassis weight', choices:['light','standard','heavy']},
  suspension:    {label:'Suspension level', min:0, max:3, step:1},
  rideHeight:    {label:'Off-road raise (m)', min:0, max:.15},
  wheelOffset:   {label:'Wheels stick out (m)', min:0, max:.12},
  tires:         {label:'Tires', choices:['track','offroad']},
});

export const MODES = Object.freeze(['gokart','gt','f1']);

/** The main test kart's wheels (racing-lab/src/reference-kart.js). New karts
 *  keep the same wheel places and size so the same driving code can move them. */
export const MAIN_KART_WHEELS = Object.freeze({
  radius: .38, width: .29, halfTrack: 1.04, frontZ: 1.03, rearZ: -1.0,
});

// A part's place: its centre and the size of the box it must fit in.
const mount = (x,y,z,w,h,d,extra={}) => ({at:[x,y,z], size:[w,h,d], ...extra});
const W = MAIN_KART_WHEELS;

/** The GoKart (approved base shape: our test kart, a bit cooler, no wing).
 *  `body` lists the body parts this kart has; `optional` lists add-on places. */
export const GOKART = Object.freeze({
  id: 'gokart-base',
  label: 'GoKart',
  mode: 'gokart',
  wheels: {...W},
  frameHeight: .24,
  body: {
    nose:        mount(0, .36, 1.27, 1.00, .24, .52),
    hood:        mount(0, .47, .78, .86, .18, .46),
    frontBumper: mount(0, .27, 1.62, 1.16, .16, .14),
    sidePanels:  mount(.62, .43, -.18, .30, .30, 1.30, {mirrored:true}),
    rearBumper:  mount(0, .34, -1.46, 1.50, .20, .16),
  },
  optional: {
    fenders:     mount(W.halfTrack, .85, W.frontZ, .38, .14, .86, {mirrored:true, alsoAtZ:W.rearZ}),
    diffuser:    mount(0, .25, -1.30, .96, .10, .30),
    wing:        mount(0, .98, -1.24, 1.36, .08, .30),
    mudFlaps:    mount(W.halfTrack, .32, -1.48, .30, .34, .03, {mirrored:true}),
    exhaust:     mount(.36, .44, -1.36, .12, .12, .28),
    lights:      mount(0, .56, 1.46, .66, .10, .05),
  },
  upgrades: {chassisWeight:'standard', suspension:0, rideHeight:0, wheelOffset:0, tires:'track'},
});

export const KARTS = Object.freeze([GOKART]);

/** Overall space a kart must fit in (metres), so no part ends up floating far away. */
export const LIMITS = Object.freeze({halfWidth:1.5, minY:0, maxY:1.4, halfLength:1.8});

/** Every place a kart's parts go, with mirrored and repeated parts expanded.
 *  `setup` is an upgrade set (defaults to the kart's own). Raising the kart
 *  lifts the frame and body; wheels stay on the ground and move outward by
 *  the wheel offset, and fenders follow their wheels. */
export function resolveKart(kart, setup = kart.upgrades) {
  const lift = setup.rideHeight ?? 0, out = setup.wheelOffset ?? 0;
  const halfTrack = kart.wheels.halfTrack + out;
  const wheels = [];
  for (const [axle, z] of [['front', kart.wheels.frontZ], ['rear', kart.wheels.rearZ]])
    for (const [side, sign] of [['left', -1], ['right', 1]])
      wheels.push({id:`${axle}-${side}`, at:[sign*halfTrack, kart.wheels.radius, z], radius:kart.wheels.radius, width:kart.wheels.width});
  const parts = [];
  const add = (slot, m, optional) => {
    const zs = m.alsoAtZ === undefined ? [m.at[2]] : [m.at[2], m.alsoAtZ];
    const sides = m.mirrored ? [['left', -1], ['right', 1]] : [['centre', 1]];
    const followsWheel = slot === 'fenders' || slot === 'mudFlaps';
    for (const z of zs) for (const [side, sign] of sides) {
      const x = m.mirrored ? sign*(Math.abs(m.at[0]) + (followsWheel ? out : 0)) : m.at[0];
      const id = [slot, zs.length > 1 ? (z === m.at[2] ? 'front' : 'rear') : null, side === 'centre' ? null : side].filter(Boolean).join('-');
      parts.push({id, slot, optional, side, at:[x, m.at[1] + lift, z], size:[...m.size]});
    }
  };
  for (const [slot, m] of Object.entries(kart.body)) add(slot, m, false);
  for (const [slot, m] of Object.entries(kart.optional)) add(slot, m, true);
  return {frameHeight: kart.frameHeight + lift, lift, wheels, parts};
}

/** Checks a kart and an upgrade set. Returns a list of problems (empty = good). */
export function checkKart(kart, setup = kart.upgrades) {
  const problems = [];
  const fail = text => problems.push(`${kart.id ?? 'kart'}: ${text}`);
  if (!MODES.includes(kart.mode)) fail(`unknown mode "${kart.mode}"`);
  for (const [name, m] of [...Object.entries(kart.body ?? {}), ...Object.entries(kart.optional ?? {})]) {
    if (!SLOTS[name]) { fail(`unknown part "${name}"`); continue; }
    if (SLOTS[name].group !== 'body') fail(`"${name}" is built with the chassis, not placed as a body part`);
    if (!m.size.every(v => Number.isFinite(v) && v > 0)) fail(`"${name}" has a size that is not positive`);
    if (!m.at.every(Number.isFinite)) fail(`"${name}" has an invalid position`);
    if (m.mirrored && m.at[0] <= 0) fail(`mirrored "${name}" must be placed on the right side (x > 0)`);
  }
  for (const name of Object.keys(kart.body ?? {})) if (kart.optional?.[name]) fail(`"${name}" is both built in and optional`);
  for (const [name, rule] of Object.entries(UPGRADES)) {
    const value = setup[name];
    if (rule.choices ? !rule.choices.includes(value) : !(Number.isFinite(value) && value >= rule.min && value <= rule.max))
      fail(`upgrade "${name}" has an invalid value ${JSON.stringify(value)}`);
  }
  const resolved = resolveKart(kart, setup);
  for (const p of resolved.parts) {
    const [x, y, z] = p.at, [w, h, d] = p.size;
    if (Math.abs(x) + w/2 > LIMITS.halfWidth || y - h/2 < LIMITS.minY || y + h/2 > LIMITS.maxY + resolved.lift || Math.abs(z) + d/2 > LIMITS.halfLength)
      fail(`"${p.id}" reaches outside the kart's space`);
  }
  return problems;
}
