// See-through boxes for a kart's body parts and its driver zone, from the
// data in spec.js (the kart models themselves are in *-kart.js).
import * as T from 'three';
import {SLOTS, STOCK, layoutKart, driverZones} from './spec.js';

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
