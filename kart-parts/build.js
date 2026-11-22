// Builds a kart's chassis (real geometry), its wheels, see-through boxes for its
// body parts and the driver zone, from the data in spec.js. Looks only: nothing here drives the kart.
// Every mesh is named after its part so tests and later chunks can find it.
import * as T from 'three';
import {SLOTS, STOCK, wheelsOf, layoutKart, driverZones} from './spec.js';

const UP = new T.Vector3(0, 1, 0);
const COLORS = {frame:'#9aa3ad', rubber:'#16191f', rim:'#c9d0d8', hub:'#3d4654', seat:'#22304a', seatTrim:'#5b6e8f', floor:'#2c333d'};

function makeMaterials() {
  const m = {};
  for (const [name, color] of Object.entries(COLORS)) m[name] = new T.MeshStandardMaterial({color, roughness: name === 'rim' || name === 'frame' ? .35 : .7, metalness: name === 'rim' || name === 'frame' ? .6 : 0, side: name === 'rim' ? T.DoubleSide : T.FrontSide});
  return m;
}

/** A tube between two points. */
function tube(parent, a, b, radius, material, name = 'frame tube') {
  const start = new T.Vector3(...a), end = new T.Vector3(...b), delta = end.clone().sub(start);
  const mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, delta.length(), 10), material);
  mesh.name = name; mesh.position.copy(start).add(end).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(UP, delta.normalize()); mesh.castShadow = true; parent.add(mesh);
  return mesh;
}
const loop = (parent, points, radius, material) => points.forEach((p, i) => tube(parent, p, points[(i + 1) % points.length], radius, material));

/** One wheel: tire, five-spoke rim and hub. The wheel spins about its X axis. */
function wheel(id, w, mats) {
  const g = new T.Group(); g.name = `wheel-${id}`;
  const r = w.radius, half = w.width/2, inner = r*.56;
  const profile = [[inner,-half],[r*.84,-half],[r*.97,-half*.75],[r,-half*.4],[r,half*.4],[r*.97,half*.75],[r*.84,half],[inner,half],[inner,-half]];
  const tire = new T.Mesh(new T.LatheGeometry(profile.map(([a, b]) => new T.Vector2(a, b)), 24), mats.rubber);
  tire.name = 'tire'; tire.rotation.z = Math.PI/2; tire.castShadow = true; g.add(tire);
  const outward = Math.sign(w.at[0]);
  const rim = new T.Group(); rim.name = 'rim'; g.add(rim);
  const barrel = new T.Mesh(new T.CylinderGeometry(inner, inner, w.width*.92, 20, 1, true), mats.rim);
  barrel.rotation.z = Math.PI/2; rim.add(barrel);
  const face = outward*half*.6;
  for (let i = 0; i < 5; i++) {
    const a = i*Math.PI*2/5, spoke = new T.Mesh(new T.BoxGeometry(.035, inner*.92, .06), mats.rim);
    spoke.position.set(face, Math.cos(a)*inner*.48, Math.sin(a)*inner*.48); spoke.rotation.x = a; rim.add(spoke);
  }
  const hub = new T.Mesh(new T.CylinderGeometry(.07, .07, w.width*.7, 12), mats.hub);
  hub.name = 'hub'; hub.rotation.z = Math.PI/2; hub.position.x = face*.4; g.add(hub);
  g.position.set(...w.at);
  return g;
}

/** A bucket seat: a curved shell seen from the side, pushed out across the kart. */
function seat(y, mats) {
  const g = new T.Group(); g.name = 'seat';
  const s = new T.Shape();// side profile (z forward, y up), seat front at z = -.1
  s.moveTo(-.10, .0); s.lineTo(-.62, .0); s.quadraticCurveTo(-.74, .0, -.76, .12);
  s.lineTo(-.90, .66); s.lineTo(-.82, .68); s.lineTo(-.68, .16); s.quadraticCurveTo(-.66, .08, -.58, .08); s.lineTo(-.10, .08);
  const shell = new T.Mesh(new T.ExtrudeGeometry(s, {depth:.56, bevelEnabled:true, bevelThickness:.03, bevelSize:.025, bevelSegments:2, curveSegments:8}), mats.seat);
  shell.rotation.y = -Math.PI/2; shell.position.set(.28, y, 0); shell.castShadow = true; shell.name = 'seat_shell'; g.add(shell);
  for (const side of [-1, 1]) {// side bolsters with a light trim edge
    const bolster = new T.Mesh(new T.BoxGeometry(.07, .16, .5), mats.seat);
    bolster.position.set(side*.31, y + .12, -.38); bolster.castShadow = true; bolster.name = 'seat_bolster'; g.add(bolster);
    const trim = new T.Mesh(new T.BoxGeometry(.075, .02, .5), mats.seatTrim); trim.position.set(side*.31, y + .205, -.38); g.add(trim);
  }
  return g;
}

/** Four wheels on their own (for karts whose chassis is not built yet). */
export function buildWheels(kart, setup = STOCK) {
  const mats = makeMaterials(), group = new T.Group(); group.name = 'wheels';
  for (const w of wheelsOf(kart, setup)) group.add(wheel(w.id, w, mats));
  return group;
}

/** The real chassis: frame, floor, axles, wheels, seat and steering. */
export function buildChassis(kart, setup = STOCK) {
  const mats = makeMaterials(), wheels = wheelsOf(kart, setup), y = kart.frameHeight + (setup.rideHeight ?? 0);
  const root = new T.Group(); root.name = `${kart.id} chassis`;
  const frame = new T.Group(); frame.name = 'frame'; root.add(frame);
  loop(frame, [[-.62,y,-1.16],[.62,y,-1.16],[.66,y,.70],[.40,y,1.42],[-.40,y,1.42],[-.66,y,.70]], .032, mats.frame);
  for (const z of [-.95, -.40, .25, .92]) { const half = z > .7 ? .58 : .64; tube(frame, [-half,y,z], [half,y,z], .028, mats.frame); }
  for (const side of [-1, 1]) {// raised side bars (nerf bars)
    tube(frame, [side*.62,y,-1.10], [side*.72,y+.15,-.86], .026, mats.frame);
    tube(frame, [side*.72,y+.15,-.86], [side*.72,y+.15,.34], .026, mats.frame);
    tube(frame, [side*.72,y+.15,.34], [side*.66,y,.62], .026, mats.frame);
  }
  const floor = new T.Mesh(new T.BoxGeometry(1.12, .02, 1.9), mats.floor);
  floor.name = 'floor_tray'; floor.position.set(0, y - .02, .05); floor.receiveShadow = true; frame.add(floor);
  // Axles: a full rear axle, front stub axles. Raising the kart lengthens the uprights.
  const wheelGroup = new T.Group(); wheelGroup.name = 'wheels'; root.add(wheelGroup);
  for (const w of wheels) {
    wheelGroup.add(wheel(w.id, w, mats));
    const sign = Math.sign(w.at[0]);
    tube(frame, [sign*.62, y, w.at[2]], [sign*(Math.abs(w.at[0]) - w.width*.45), w.radius, w.at[2]], .03, mats.frame, 'axle support');
  }
  const rear = wheels.find(w => w.id === 'rear-right'), rearX = rear.at[0] - rear.width*.4;
  tube(frame, [-rearX, rear.radius, rear.at[2]], [rearX, rear.radius, rear.at[2]], .04, mats.frame, 'rear axle');
  root.add(seat(y + .14, mats));
  // Steering: column, round wheel with three spokes, links to the front wheels.
  const steering = new T.Group(); steering.name = 'steering'; root.add(steering);
  const base = [0, y + .04, .66], top = [0, y + .62, .2];
  tube(steering, base, top, .026, mats.frame, 'steering_column');
  const ring = new T.Mesh(new T.TorusGeometry(.2, .024, 8, 28), mats.rubber); ring.name = 'steering_wheel';
  ring.position.set(...top); ring.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(...top).sub(new T.Vector3(...base)).normalize()); steering.add(ring);
  for (let i = 0; i < 3; i++) { const a = Math.PI/2 + i*Math.PI*2/3; tube(ring, [0,0,0], [Math.cos(a)*.18, Math.sin(a)*.18, 0], .014, mats.rubber, 'steering spoke'); }
  for (const w of wheels.filter(w => w.axle === 'front')) tube(steering, base, [Math.sign(w.at[0])*(Math.abs(w.at[0]) - w.width*.5), w.radius, w.at[2] - .06], .016, mats.frame, 'steering link');
  root.userData = {kartId: kart.id, mode: kart.mode};
  return root;
}

const OUTLINE_COLORS = {design: '#5fe0d0', optional: '#ffbe4d', blocked: '#ff4d6d'};
function outlineBox(name, centre, size, color, opacity = .16) {
  const g = new T.Group(); g.name = name; g.position.set(...centre);
  const geometry = new T.BoxGeometry(...size);
  const fill = new T.Mesh(geometry, new T.MeshBasicMaterial({color, transparent: true, opacity, depthWrite: false}));
  fill.name = 'outline fill'; g.add(fill);
  const edges = new T.LineSegments(new T.EdgesGeometry(geometry), new T.LineBasicMaterial({color, transparent: true}));
  edges.name = 'outline edges'; g.add(edges);
  return g;
}

/** See-through boxes for the chosen part styles. Parts of the approved design
 *  are teal, optional parts amber, and any part that does not fit is red.
 *  Each box is named `slot:<part id>`. */
export function buildOutlines(kart, choices, setup = STOCK) {
  const root = new T.Group(); root.name = `${kart.id} part outlines`;
  for (const part of layoutKart(kart, choices, setup)) {
    const color = part.problems.length ? OUTLINE_COLORS.blocked : part.optional ? OUTLINE_COLORS.optional : OUTLINE_COLORS.design;
    for (const b of part.boxes) {
      const g = outlineBox(`slot:${b.id}`, b.centre, b.size, color);
      g.userData = {slot: part.slot, style: part.style, optional: part.optional, fits: !part.problems.length, label: SLOTS[part.slot].label};
      root.add(g);
    }
  }
  return root;
}

/** The driver zone: red see-through boxes where no part may go. */
export function buildDriverZone(kart, setup = STOCK) {
  const root = new T.Group(); root.name = 'driver zone';
  for (const [name, z] of Object.entries(driverZones(kart, setup)))
    root.add(outlineBox(`driver:${name}`, z.min.map((m, i) => (m + z.max[i])/2), z.min.map((m, i) => z.max[i] - m), '#ff5d73', .10));
  return root;
}

/** Triangles drawn by every mesh under an object (outlines excluded). */
export function countTriangles(object) {
  let n = 0;
  object.traverse(o => {
    if (!o.isMesh || o.name === 'outline fill') return;
    const g = o.geometry; n += (g.index ? g.index.count : g.attributes.position.count)/3;
  });
  return n;
}
