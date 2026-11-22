// Kart parts system: the foundation every new kart is built on (owner, 21 Nov 2026).
// Pure data and checks, no three.js, so Node tests and later driving code can read it.
// Units: metres. +Y is up, +Z is forward (the same as the main test kart).
// Looks only: upgrade values are stored here for Codex's driving code, which
// owns what they do. Nothing in this file moves or drives a kart.
//
// How parts snap on:
//  1. Each kart has MOUNTS: the points where a kind of part bolts on.
//  2. Each part STYLE (a bumper design, a wing design...) carries its own size
//     and its offset from that mount. Different styles of the same part snap
//     onto the same mount; a longer wing simply reaches further.
//  3. Every placed part is checked: it must stay out of the DRIVER ZONE, out
//     of the wheels and inside the kart's space, for every set-up.
// Part places were measured from side and top views of the three approved
// designs (docs/karts/blueprints/), using the wheels as the ruler. Those
// "design units" are scaled per kart (`scale`) to the approved sizes: GoKart
// small, GT medium, F1 large, all close (owner, 22 Nov 2026, from the size
// picture with a driver in each kart). Everything returned by the functions
// below is in real metres.

/** Every kind of part a kart can have. */
export const SLOTS = Object.freeze({
  // Built with the chassis (real geometry).
  frame:       {group:'chassis', label:'Frame', note:'The metal tubes everything bolts onto.'},
  seat:        {group:'chassis', label:'Seat', note:'Swappable for other seat styles.'},
  steering:    {group:'chassis', label:'Steering wheel', note:'Swappable for other steering wheels.'},
  wheels:      {group:'chassis', label:'Rims and tires', note:'Rims and tires are swappable; off-road tires fit any kart.'},
  // Body parts: each snaps onto its mount and comes in several styles.
  nose:        {group:'body', label:'Nose', note:'The front of the kart.'},
  hood:        {group:'body', label:'Hood', note:'The top panel in front of the steering wheel. Airflow versions add downforce.'},
  frontBumper: {group:'body', label:'Front bumper', note:'Airflow versions add downforce.'},
  frontWing:   {group:'body', label:'Front wing', note:'A low wing at the very front; adds downforce.'},
  sidePanels:  {group:'body', label:'Side panels', note:'One on each side of the seat.'},
  rearBumper:  {group:'body', label:'Rear bumper', note:'Protects the back of the kart.'},
  fenders:     {group:'body', label:'Fenders', note:'Arches over the wheels with the rims still visible. They follow the wheels.'},
  diffuser:    {group:'body', label:'Diffuser', note:'Under the back of the kart; helps downforce.'},
  wing:        {group:'body', label:'Rear wing or spoiler', note:'Adds downforce. Short and extended styles snap onto the same mount.'},
  mudFlaps:    {group:'body', label:'Mud flaps', note:'Behind the rear wheels; they follow the wheels.'},
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
export const STOCK = Object.freeze({chassisWeight:'standard', suspension:0, rideHeight:0, wheelOffset:0, tires:'track'});
export const MAX_OFFROAD = Object.freeze({...STOCK, rideHeight:UPGRADES.rideHeight.max, wheelOffset:UPGRADES.wheelOffset.max, tires:'offroad'});

export const MODES = Object.freeze(['gokart','gt','f1']);
const ALL = MODES;

/** The space every kart must fit in (metres). */
export const LIMITS = Object.freeze({halfWidth:1.6, maxY:1.7, halfLength:2.3});

/** The avatar's body sizes in metres, measured from its skeleton
 *  (motion-core/skeleton/bones.js; a test re-reads them from there). Used to
 *  work out the space a seated driver takes up in each kart. */
export const AVATAR = Object.freeze({
  hipToShoulder: .457,   // pelvis joint to the base of the neck
  hipToHead: .835,       // pelvis joint to the centre of the head
  headRadius: .22,
  shoulderHalf: .34,     // shoulder joint plus the upper arm's thickness
  hipHalf: .24,          // hip joint plus the thigh's thickness
  legReach: .72,         // thigh, calf and foot, knees bent, forward from the hip
  kneeRise: .32,         // how far bent knees rise above the hip
});


// Short helpers for writing the data below.
const box = (min, max) => ({min, max});
const v = (x, y, z) => [x, y, z];

/** Part styles. `offset` is from the mount to the centre of the part; `size`
 *  is the part's full width, height and length. For mirrored parts the
 *  offset is for the right side and is flipped for the left. A `shell` part
 *  wraps over the driver's legs (a nose or hood) and may cover the legs
 *  zone, never the hips, body or head. */
export const STYLES = Object.freeze({
  nose: {
    'gokart-nose':   {label:'GoKart nose', modes:['gokart'], size:v(.83,.47,1.33), offset:v(0,.225,.335), shell:true},
    'gt-nose':       {label:'GT nose', modes:['gt'], size:v(1.10,.44,.50), offset:v(0,.18,.25)},
    'f1-nose':       {label:'F1 nose', modes:['f1'], size:v(.55,.60,1.35), offset:v(0,.25,.675), shell:true},
  },
  hood: {
    'gokart-hood':   {label:'GoKart hood', modes:['gokart'], size:v(.75,.12,.60), offset:v(0,.37,0), shell:true},
    'gt-hood':       {label:'GT hood', modes:['gt'], size:v(.99,.38,.70), offset:v(0,.35,0), shell:true},
  },
  frontBumper: {
    'tube-bumper':   {label:'Tube bumper', modes:['gokart'], size:v(1.09,.10,.55), offset:v(0,-.04,.205)},
    'airflow-bumper':{label:'Airflow bumper', modes:['gokart'], size:v(1.16,.18,.40), offset:v(0,0,.22)},
    'gt-front-bumper':{label:'GT front bumper', modes:['gt'], size:v(1.50,.38,.36), offset:v(0,0,.18)},
  },
  frontWing: {
    'f1-front-wing': {label:'F1 front wing', modes:['f1'], size:v(1.64,.32,.66), offset:v(0,.09,.33)},
    'slim-front-wing':{label:'Slim front wing', modes:['gt','f1'], size:v(1.30,.08,.30), offset:v(0,.04,.20)},
  },
  sidePanels: {
    'gokart-pods':   {label:'GoKart side panels', modes:['gokart'], size:v(.31,.41,1.16), offset:v(-.065,.125,0)},
    'gt-skirts':     {label:'GT side skirts', modes:['gt'], size:v(.19,.45,.75), offset:v(-.015,.185,0)},
    'f1-pods':       {label:'F1 side pods', modes:['f1'], size:v(.45,.64,1.03), offset:v(.135,.32,0)},
  },
  rearBumper: {
    'gokart-rear':   {label:'GoKart rear bumper', modes:['gokart'], size:v(.88,.25,.32), offset:v(0,.135,-.02)},
    'gt-rear':       {label:'GT rear bumper', modes:['gt'], size:v(1.18,.36,.24), offset:v(0,.13,-.07)},
    'slim-rear':     {label:'Slim rear bumper', modes:ALL, size:v(.60,.20,.18), offset:v(0,.10,-.10)},
  },
  fenders: {
    // Wraps over its own wheel (the model's checks prove it clears the tire).
    'arch':          {label:'Wheel arch', modes:ALL, size:v(.44,.40,1.0), offset:v(0,-.10,0), wrapsWheel:true},
  },
  diffuser: {
    'diffuser':      {label:'Diffuser', modes:ALL, size:v(.80,.12,.30), offset:v(0,0,-.15)},
  },
  wing: {
    'low-spoiler':   {label:'Low spoiler', modes:ALL, size:v(1.20,.08,.28), offset:v(0,.33,-.18)},
    'ducktail':      {label:'Ducktail spoiler', modes:ALL, size:v(1.00,.10,.20), offset:v(0,.18,-.22)},
    'tall-wing':     {label:'Tall extended wing', modes:ALL, size:v(1.40,.08,.36), offset:v(0,.62,-.42)},
    'gt-wing':       {label:'GT wing', modes:['gt'], size:v(1.30,.30,.38), offset:v(0,.66,-.12)},
    'f1-wing':       {label:'F1 wing', modes:['f1'], size:v(1.40,.40,.40), offset:v(0,.45,-.25)},
  },
  mudFlaps: {
    'flap':          {label:'Mud flap', modes:ALL, size:v(.30,.34,.03), offset:v(0,-.06,-.07)},
  },
  exhaust: {
    'single-pipe':   {label:'Single pipe', modes:ALL, size:v(.12,.12,.28), offset:v(.30,0,-.14)},
    'twin-pipes':    {label:'Twin pipes', modes:ALL, size:v(.36,.12,.28), offset:v(0,0,-.14)},
  },
  lights: {
    'light-bar':     {label:'Light bar', modes:ALL, size:v(.60,.08,.06), offset:v(0,0,0)},
  },
});

/** Mount kinds: a point (optionally mirrored left/right), the top of every
 *  tire (fenders) or the back of each rear tire (mud flaps). */
const point = (x, y, z, mirrored = false) => ({kind:'point', at:v(x, y, z), mirrored});
const EACH_WHEEL = Object.freeze({kind:'eachWheel'});
const REAR_WHEELS = Object.freeze({kind:'rearWheels'});

/** The three approved base karts (a fresh set; the old test kart is only for
 *  driving tests). Numbers are design units, multiplied by `scale`. `design`
 *  is which style the approved design uses for each part; every other mount
 *  is a place for optional parts. `seat` is where the driver's hips sit and
 *  how far the back leans (radians); the driver zone is worked out from it
 *  and the avatar's body sizes. */
export const GOKART = Object.freeze({
  id:'gokart-base', label:'GoKart', mode:'gokart', size:'small', scale:.64,
  wheels:{front:{radius:.38, width:.30}, rear:{radius:.38, width:.34}, halfTrack:.81, frontZ:1.03, rearZ:-1.0},
  frameHeight:.24,
  mounts:{
    nose:point(0,.24,1.0), hood:point(0,.24,.5), frontBumper:point(0,.24,1.42),
    sidePanels:point(.62,.24,.05,true), rearBumper:point(0,.24,-1.16),
    fenders:EACH_WHEEL, diffuser:point(0,.22,-1.17), wing:point(0,.42,-1.28),
    mudFlaps:REAR_WHEELS, exhaust:point(0,.42,-1.24), lights:point(0,.40,1.90),
  },
  design:{nose:'gokart-nose', frontBumper:'tube-bumper', sidePanels:'gokart-pods', rearBumper:'gokart-rear'},
  seat:{hip:v(0,.64,-.38), recline:.26},
  upgrades:STOCK,
});

export const GT_GOKART = Object.freeze({
  id:'gt-base', label:'GT GoKart', mode:'gt', size:'medium', scale:.78,
  wheels:{front:{radius:.38, width:.30}, rear:{radius:.38, width:.30}, halfTrack:.745, frontZ:.79, rearZ:-.76},
  frameHeight:.15,
  mounts:{
    nose:point(0,.30,1.20), hood:point(0,.45,1.0), frontBumper:point(0,.25,1.44), frontWing:point(0,.10,1.70),
    sidePanels:point(.70,.10,.015,true), rearBumper:point(0,.15,-1.15),
    fenders:EACH_WHEEL, diffuser:point(0,.15,-1.05), wing:point(0,.55,-1.0),
    mudFlaps:REAR_WHEELS, exhaust:point(0,.35,-1.20), lights:point(0,.45,1.78),
  },
  design:{nose:'gt-nose', hood:'gt-hood', frontBumper:'gt-front-bumper', sidePanels:'gt-skirts', rearBumper:'gt-rear', fenders:'arch', wing:'gt-wing'},
  seat:{hip:v(0,.26,.26), recline:.44},
  upgrades:STOCK,
});

export const F1_GOKART = Object.freeze({
  id:'f1-base', label:'F1 GoKart', mode:'f1', size:'large', scale:.84,
  // Same real wheel size as the GT GoKart (owner): .38 x .78 / .84 design units.
  wheels:{front:{radius:.38*.78/.84, width:.30}, rear:{radius:.38*.78/.84, width:.36}, halfTrack:.82, frontZ:.96, rearZ:-.93},
  frameHeight:.12,
  mounts:{
    nose:point(0,.30,.70), frontWing:point(0,.10,1.32),
    sidePanels:point(.50,.15,-.005,true), rearBumper:point(0,.15,-1.35),
    fenders:EACH_WHEEL, diffuser:point(0,.15,-1.20), wing:point(0,.75,-1.0),
    mudFlaps:REAR_WHEELS, exhaust:point(0,.40,-1.30), lights:point(0,.50,1.90),
  },
  design:{nose:'f1-nose', frontWing:'f1-front-wing', sidePanels:'f1-pods', wing:'f1-wing'},
  seat:{hip:v(0,.26,.35), recline:.61, feetY:.36},// feet rest inside the nose
  upgrades:STOCK,
});

export const KARTS = Object.freeze([GOKART, GT_GOKART, F1_GOKART]);

/** Styles of a part that fit a kart's mode. */
export const stylesFor = (kart, slot) =>
  Object.entries(STYLES[slot] ?? {}).filter(([, s]) => s.modes.includes(kart.mode)).map(([id]) => id);

/** The styles shown by default: the approved design, plus the first fitting
 *  style for every optional mount. */
export function defaultChoices(kart) {
  const choices = {...kart.design};
  for (const slot of Object.keys(kart.mounts)) if (!choices[slot]) choices[slot] = stylesFor(kart, slot)[0];
  return choices;
}

/** The kart's wheels for a set-up: they stay on the ground and move outward
 *  by the wheel offset. */
export function wheelsOf(kart, setup = STOCK) {
  const k = kart.scale, half = kart.wheels.halfTrack*k + (setup.wheelOffset ?? 0), out = [];
  for (const axle of ['front', 'rear']) for (const [side, sign] of [['left', -1], ['right', 1]]) {
    const radius = kart.wheels[axle].radius*k, width = kart.wheels[axle].width*k;
    out.push({id:`${axle}-${side}`, axle, side, radius, width, at:v(sign*half, radius, kart.wheels[`${axle}Z`]*k)});
  }
  return out;
}

/** Where a part snaps on: one anchor per copy of the part. */
function anchorsOf(kart, slot, setup) {
  const mount = kart.mounts[slot], lift = setup.rideHeight ?? 0;
  if (!mount) return [];
  if (mount.kind === 'eachWheel')
    return wheelsOf(kart, setup).map(w => ({id:w.id, sign:Math.sign(w.at[0]), at:v(w.at[0], 2*w.radius + lift, w.at[2])}));
  if (mount.kind === 'rearWheels')
    return wheelsOf(kart, setup).filter(w => w.axle === 'rear').map(w => ({id:w.side, sign:Math.sign(w.at[0]), at:v(w.at[0], w.radius + lift, w.at[2] - w.radius)}));
  const [x, y, z] = mount.at.map(c => c*kart.scale);
  return mount.mirrored
    ? [{id:'left', sign:-1, at:v(-x, y + lift, z)}, {id:'right', sign:1, at:v(x, y + lift, z)}]
    : [{id:null, sign:1, at:v(x, y + lift, z)}];
}

/** Places one part style on a kart: returns its boxes (centre and size). */
export function placePart(kart, slot, styleId, setup = STOCK) {
  const style = STYLES[slot]?.[styleId];
  if (!style) throw new Error(`Unknown ${slot} style "${styleId}"`);
  return anchorsOf(kart, slot, setup).map(a => {
    const mirrored = kart.mounts[slot].kind !== 'point' || kart.mounts[slot].mirrored;
    const k = kart.scale, off = style.offset.map(c => c*k), dx = mirrored ? a.sign*off[0] : off[0];
    return {id:[slot, a.id].filter(Boolean).join('-'), slot, style:styleId, anchor:a.at,
      centre:v(a.at[0] + dx, a.at[1] + off[1], a.at[2] + off[2]), size:style.size.map(c => c*k)};
  });
}

const boundsOf = ({centre, size}) => ({min:centre.map((c, i) => c - size[i]/2), max:centre.map((c, i) => c + size[i]/2)});
const EPS = 1e-9;
/** True when two boxes overlap (touching faces do not count). */
export const overlaps = (a, b) => a.min.every((m, i) => m < b.max[i] - EPS && b.min[i] < a.max[i] - EPS);
/** True when a box overlaps a wheel, treated exactly as a cylinder lying
 *  along X: the X ranges overlap and the box's side view (Y-Z rectangle)
 *  comes closer to the wheel's centre than its radius. */
export function hitsWheel(b, w) {
  const half = w.width/2;
  if (!(b.min[0] < w.at[0] + half - EPS && w.at[0] - half < b.max[0] - EPS)) return false;
  const dy = Math.max(b.min[1] - w.at[1], 0, w.at[1] - b.max[1]), dz = Math.max(b.min[2] - w.at[2], 0, w.at[2] - b.max[2]);
  return dy*dy + dz*dz < w.radius*w.radius - EPS;
}

/** Where the seated driver's joints are (real metres): hips, shoulders and
 *  head centre, leaning back by the seat's recline. Rises with the body. */
export function driverPose(kart, setup = STOCK) {
  const [hx, hy, hz] = kart.seat.hip.map(c => c*kart.scale), r = kart.seat.recline, lift = setup.rideHeight ?? 0;
  const along = d => v(hx, hy + lift + d*Math.cos(r), hz - d*Math.sin(r));// up and back along the spine
  return {hip:v(hx, hy + lift, hz), shoulder:along(AVATAR.hipToShoulder), head:along(AVATAR.hipToHead), recline:r};
}

/** The space the seated driver takes up (boxes, real metres): hips, torso
 *  with shoulders, legs reaching forward with bent knees, and the head.
 *  (Arms reaching the steering wheel are not included.) */
export function driverZones(kart, setup = STOCK) {
  const {hip, shoulder, head} = driverPose(kart, setup), A = AVATAR, back = .14, chest = .14;
  const span = (a, b, pad) => [Math.min(a, b) - pad, Math.max(a, b) + pad];
  const [tz0, tz1] = span(hip[2], shoulder[2], 0), [ty0] = [hip[1] + .15];
  return {
    hips: box(v(-A.hipHalf, hip[1] - .1, hip[2] - back), v(A.hipHalf, hip[1] + .15, hip[2] + chest)),
    body: box(v(-A.shoulderHalf, ty0, tz0 - back), v(A.shoulderHalf, shoulder[1] + .12, tz1 + chest)),
    legs: box(v(-A.hipHalf + .02, hip[1] - .08, hip[2]), v(A.hipHalf - .02, hip[1] + A.kneeRise, hip[2] + A.legReach)),
    head: box(v(-A.headRadius, head[1] - A.headRadius, head[2] - A.headRadius), v(A.headRadius, head[1] + A.headRadius, head[2] + A.headRadius)),
  };
}

/** Every reason a part style cannot go on a kart (empty list = it fits). */
export function fitProblems(kart, slot, styleId, setup = STOCK) {
  const style = STYLES[slot]?.[styleId], who = `${kart.label} ${slot} "${styleId}"`;
  if (!style) return [`${who}: unknown style`];
  if (!style.modes.includes(kart.mode)) return [`${who}: not made for ${kart.mode} karts`];
  if (!kart.mounts[slot]) return [`${who}: this kart has no mount for it`];
  const problems = [], zones = driverZones(kart, setup);
  const wheels = wheelsOf(kart, setup);
  for (const part of placePart(kart, slot, styleId, setup)) {
    const b = boundsOf(part);
    for (const [zone, z] of Object.entries(zones))
      if (overlaps(b, z) && !(style.shell && zone === 'legs')) problems.push(`${who}: ${part.id} would sit in the driver's ${zone}`);
    for (const w of wheels) if (!(style.wrapsWheel && part.id.endsWith(w.id)) && hitsWheel(b, w)) problems.push(`${who}: ${part.id} would hit the ${w.id} wheel`);
    if (b.min[1] < -EPS) problems.push(`${who}: ${part.id} goes below the ground`);
    if (Math.max(Math.abs(b.min[0]), Math.abs(b.max[0])) > LIMITS.halfWidth || b.max[1] > LIMITS.maxY + (setup.rideHeight ?? 0) ||
        Math.max(Math.abs(b.min[2]), Math.abs(b.max[2])) > LIMITS.halfLength) problems.push(`${who}: ${part.id} reaches outside the kart's space`);
  }
  return problems;
}

/** All the parts of a kart for a set of style choices, each with its boxes. */
export function layoutKart(kart, choices = defaultChoices(kart), setup = STOCK) {
  return Object.entries(choices).filter(([, id]) => id).map(([slot, styleId]) => ({
    slot, style:styleId, optional:kart.design[slot] !== styleId,
    boxes:placePart(kart, slot, styleId, setup), problems:fitProblems(kart, slot, styleId, setup),
  }));
}

/** Checks a kart's data and an upgrade set. Returns a list of problems. */
export function checkKart(kart, setup = kart.upgrades) {
  const problems = [], fail = text => problems.push(`${kart.id ?? 'kart'}: ${text}`);
  if (!MODES.includes(kart.mode)) fail(`unknown mode "${kart.mode}"`);
  if (!(kart.scale > 0)) fail('scale must be a positive number');
  if (!kart.seat?.hip?.every(Number.isFinite) || !Number.isFinite(kart.seat?.recline)) fail('seat needs a hip position and a recline');
  for (const [slot, mount] of Object.entries(kart.mounts ?? {})) {
    if (!SLOTS[slot]) { fail(`unknown part "${slot}"`); continue; }
    if (SLOTS[slot].group !== 'body') fail(`"${slot}" is built with the chassis, not mounted`);
    if (mount.kind === 'point' && !mount.at.every(Number.isFinite)) fail(`"${slot}" mount has an invalid position`);
    if (mount.kind === 'point' && mount.mirrored && mount.at[0] <= 0) fail(`mirrored "${slot}" mount must be on the right side (x > 0)`);
    if (!stylesFor(kart, slot).length) fail(`no ${slot} style fits this kart`);
  }
  for (const [slot, styleId] of Object.entries(kart.design ?? {})) {
    if (!kart.mounts?.[slot]) fail(`design uses "${slot}" but there is no mount for it`);
    else problems.push(...fitProblems(kart, slot, styleId, setup));
  }
  for (const [name, rule] of Object.entries(UPGRADES)) {
    const value = setup[name];
    if (rule.choices ? !rule.choices.includes(value) : !(Number.isFinite(value) && value >= rule.min && value <= rule.max))
      fail(`upgrade "${name}" has an invalid value ${JSON.stringify(value)}`);
  }
  return problems;
}
