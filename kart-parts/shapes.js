// Shape-building methods for kart bodywork, each a proven, standard technique:
//  - superellipse (Lamé curve) cross-sections: the rounded-box sections used
//    for car and aircraft bodies; one exponent moves from oval to boxy;
//  - lofting: joining matching cross-sections along the length (boat hulls,
//    aircraft fuselages, the same idea CAD "loft" tools use);
//  - NACA 4-digit airfoils: the published NACA equations for wing sections;
//  - earcut triangulation (three.js ShapeUtils) to close the loft ends;
//  - merging geometries per material to keep draw calls low on phones.
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const UP = new T.Vector3(0, 1, 0);

/** A superellipse ring: `count` points, counter-clockwise seen from the front
 *  (+Z), starting at the bottom. halfWidth/halfHeight are the half sizes;
 *  exponent 2 is an ellipse, higher is boxier. `shapeTop(x, y, t)` can move
 *  points (used to open a cockpit in the top). */
export function superellipse({cx = 0, cy, halfWidth, halfHeight, exponent = 2.6, count = 32, shapeTop}) {
  const ring = [], e = 2/exponent;
  for (let i = 0; i < count; i++) {
    const t = -Math.PI/2 + i*2*Math.PI/count, c = Math.cos(t), s = Math.sin(t);
    let x = cx + halfWidth*Math.sign(c)*Math.abs(c)**e, y = cy + halfHeight*Math.sign(s)*Math.abs(s)**e;
    if (shapeTop && s > 0) y = shapeTop(x - cx, y, s);
    ring.push([x, y]);
  }
  return ring;
}

/** Lofts rings placed along Z (each `{z, ring}`, z increasing, every ring the
 *  same point count, counter-clockwise seen from +Z) into a closed solid.
 *  Shading is smooth; colour is per face: `color(x, y, z, u)` gets the face's
 *  centre and `u`, its place around the ring (0 = bottom, .25 = right side,
 *  .5 = top, .75 = left side; -1 for the end caps). Colouring by `u` makes
 *  stripes follow the body lengthwise with clean, straight edges. */
export function loft(sections, color) {
  const n = sections[0].ring.length;
  if (!sections.every(s => s.ring.length === n)) throw new Error('loft: every ring needs the same number of points');
  for (let i = 1; i < sections.length; i++) if (!(sections[i].z > sections[i - 1].z)) throw new Error('loft: rings must go from back to front');
  const positions = [], index = [], faceU = [];
  const push = (x, y, z) => { positions.push(x, y, z); return positions.length/3 - 1; };
  sections.forEach(({z, ring}) => ring.forEach(([x, y]) => push(x, y, z)));
  for (let s = 0; s < sections.length - 1; s++) for (let i = 0; i < n; i++) {
    const a = s*n + i, b = s*n + (i + 1)%n, a2 = a + n, b2 = b + n, u = (i + .5)/n;
    index.push(a, b, a2, b, b2, a2);// outward-facing (checked by tests)
    faceU.push(u, u);
  }
  for (const [end, facing] of [[sections[0], -1], [sections[sections.length - 1], 1]]) {
    const contour = end.ring.map(([x, y]) => new T.Vector2(x, y)), start = positions.length/3;
    end.ring.forEach(([x, y]) => push(x, y, end.z));
    for (const [p, q, r] of T.ShapeUtils.triangulateShape(contour, [])) {
      const clockwise = T.ShapeUtils.area([contour[p], contour[q], contour[r]]) < 0;
      // A front cap must turn counter-clockwise seen from the front; a back cap the other way.
      if ((facing > 0) === !clockwise) index.push(start + p, start + q, start + r); else index.push(start + p, start + r, start + q);
      faceU.push(-1);
    }
  }
  const indexed = new T.BufferGeometry();
  indexed.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  indexed.setIndex(index); indexed.computeVertexNormals();// smooth normals from shared vertices
  const g = indexed.toNonIndexed(), p = g.attributes.position.array, colors = new Float32Array(p.length), c = new T.Color();
  for (let f = 0; f < faceU.length; f++) {
    const o = f*9;
    c.set(color((p[o] + p[o + 3] + p[o + 6])/3, (p[o + 1] + p[o + 4] + p[o + 7])/3, (p[o + 2] + p[o + 5] + p[o + 8])/3, faceU[f]));
    for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], o + 3*k);
  }
  g.setAttribute('color', new T.BufferAttribute(colors, 3));
  return g;
}

/** NACA 4-digit airfoil outline (unit chord), from the published equations:
 *  camber m, camber position p, thickness t (e.g. 6412 = .06, .4, .12).
 *  Closed trailing edge; cosine spacing puts more points at the nose.
 *  Returns points going over the top from the trailing edge, then back
 *  underneath, as [x, y] with x from 0 (leading edge) to 1. */
export function naca4(m, p, t, count = 16) {
  const upper = [], lower = [];
  for (let i = 0; i <= count; i++) {
    const x = (1 - Math.cos(Math.PI*i/count))/2;
    const yt = 5*t*(.2969*Math.sqrt(x) - .126*x - .3516*x*x + .2843*x**3 - .1036*x**4);
    const yc = x < p ? m/(p*p)*(2*p*x - x*x) : m/((1 - p)**2)*(1 - 2*p + 2*p*x - x*x);
    const slope = x < p ? 2*m/(p*p)*(p - x) : 2*m/((1 - p)**2)*(p - x), th = Math.atan(slope);
    upper.push([x - yt*Math.sin(th), yc + yt*Math.cos(th)]);
    lower.push([x + yt*Math.sin(th), yc - yt*Math.cos(th)]);
  }
  return [...upper.reverse(), ...lower.slice(1, -1)];
}

/** A straight wing: an airfoil of `chord` metres pushed across `span`,
 *  centred on x = 0. Leading edge at `leadingZ`, height `y`. `inverted` flips
 *  it upside down (race-car wings push down). `angle` tilts the trailing edge
 *  up (radians) about the leading edge. */
export function wing({span, chord, y, leadingZ, airfoil = [.06, .4, .12], inverted = true, angle = 0}, color) {
  const pts = naca4(...airfoil).map(([x, h]) => {
    const along = x*chord, up = (inverted ? -h : h)*chord;
    return [along*Math.cos(angle) - up*Math.sin(angle), along*Math.sin(angle) + up*Math.cos(angle)];
  });
  const shape = new T.Shape(pts.map(([a, b]) => new T.Vector2(a, b)));
  const g = new T.ExtrudeGeometry(shape, {depth: span, bevelEnabled: false, curveSegments: 1});
  g.rotateY(Math.PI/2);// chord runs backwards (-Z), span along +X
  g.translate(-span/2, y, leadingZ);
  return paint(g, color);
}

/** A flat plate with rounded corners, `thickness` thick across X (endplates). */
export function plate({x, zMin, zMax, yMin, yMax, thickness = .02, radius = .04}, color) {
  const w = zMax - zMin, h = yMax - yMin, r = Math.min(radius, w/2, h/2), s = new T.Shape();
  s.moveTo(r, 0); s.lineTo(w - r, 0); s.quadraticCurveTo(w, 0, w, r); s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h);
  s.lineTo(r, h); s.quadraticCurveTo(0, h, 0, h - r); s.lineTo(0, r); s.quadraticCurveTo(0, 0, r, 0);
  const g = new T.ExtrudeGeometry(s, {depth: thickness, bevelEnabled: false, curveSegments: 3});
  g.rotateY(-Math.PI/2);// shape x -> +Z, depth -> -X
  g.translate(x + thickness/2, yMin, zMin);
  return paint(g, color);
}

/** A round tube between two points. */
export function tube(a, b, radius, color, segments = 8) {
  const start = new T.Vector3(...a), end = new T.Vector3(...b), d = end.clone().sub(start);
  const g = new T.CylinderGeometry(radius, radius, d.length(), segments, 1);
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(UP, d.normalize()));
  g.translate(...start.add(end).multiplyScalar(.5).toArray());
  return paint(g, color);
}

/** A smooth tube along points (Catmull-Rom curve), e.g. a roll hoop. */
export function curvedTube(points, radius, color, closed = false) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)), closed);
  return paint(new T.TubeGeometry(curve, closed ? 48 : 24, radius, 8, closed), color);
}

/** A box with its centre and size. */
export function block(centre, size, color) {
  const g = new T.BoxGeometry(...size); g.translate(...centre); return paint(g, color);
}

/** Gives every vertex one colour (so different parts can share a material). */
export function paint(geometry, color) {
  const c = new T.Color(color), n = geometry.attributes.position.count, colors = new Float32Array(n*3);
  for (let i = 0; i < n; i++) { colors[3*i] = c.r; colors[3*i + 1] = c.g; colors[3*i + 2] = c.b; }
  geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
  return geometry;
}

/** Mirrors a geometry to the other side (x -> -x), keeping faces outward. */
export function mirrorX(geometry) {
  const g = geometry.clone(); g.scale(-1, 1, 1);
  const index = g.index;
  if (index) { const a = index.array; for (let i = 0; i < a.length; i += 3) [a[i + 1], a[i + 2]] = [a[i + 2], a[i + 1]]; index.needsUpdate = true; }
  else {// non-indexed: swap the 2nd and 3rd vertex of every triangle in every attribute
    for (const attr of Object.values(g.attributes)) {
      const s = attr.itemSize, a = attr.array;
      for (let i = 0; i < a.length; i += 3*s) for (let k = 0; k < s; k++) [a[i + s + k], a[i + 2*s + k]] = [a[i + 2*s + k], a[i + s + k]];
      attr.needsUpdate = true;
    }
  }
  g.computeVertexNormals();
  return g;
}

/** Merges geometries into one (positions, normals and colours only). */
export function merge(geometries) {
  const clean = geometries.map(g => {
    const flat = g.index ? g.toNonIndexed() : g.clone();
    for (const name of Object.keys(flat.attributes)) if (!['position', 'normal', 'color'].includes(name)) flat.deleteAttribute(name);
    if (!flat.attributes.normal) flat.computeVertexNormals();
    return flat;
  });
  const merged = mergeGeometries(clean, false);
  if (!merged) throw new Error('merge: geometries could not be merged');
  return merged;
}

/** Monotone cubic interpolation (PCHIP, Fritsch–Carlson with the
 *  Fritsch–Butland weighted harmonic-mean slopes, as in SciPy's
 *  PchipInterpolator). The curve passes through every point, is smooth, and
 *  never overshoots: between two measured values it stays between them, so
 *  lofted surfaces have no ripples. Returns a function of x. */
export function pchip(xs, ys) {
  const n = xs.length;
  if (n !== ys.length || n < 2) throw new Error('pchip: needs matching x and y lists of 2 or more');
  for (let i = 1; i < n; i++) if (!(xs[i] > xs[i - 1])) throw new Error('pchip: x values must increase');
  const h = [], d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) { h.push(xs[i + 1] - xs[i]); d.push((ys[i + 1] - ys[i])/h[i]); }
  if (n === 2) m[0] = m[1] = d[0];
  else {
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1]*d[i] <= 0) { m[i] = 0; continue; }
      const w1 = 2*h[i] + h[i - 1], w2 = h[i] + 2*h[i - 1];
      m[i] = (w1 + w2)/(w1/d[i - 1] + w2/d[i]);
    }
    const end = (h0, h1, d0, d1) => {// one-sided three-point slope, kept shape-preserving
      let s = ((2*h0 + h1)*d0 - h0*d1)/(h0 + h1);
      if (Math.sign(s) !== Math.sign(d0)) s = 0;
      else if (Math.sign(d0) !== Math.sign(d1) && Math.abs(s) > Math.abs(3*d0)) s = 3*d0;
      return s;
    };
    m[0] = end(h[0], h[1], d[0], d[1]);
    m[n - 1] = end(h[n - 2], h[n - 3], d[n - 2], d[n - 3]);
  }
  return x => {
    let i = 0;
    if (x <= xs[0]) i = 0; else if (x >= xs[n - 1]) i = n - 2; else while (x > xs[i + 1]) i++;
    const t = Math.min(1, Math.max(0, (x - xs[i])/h[i])), t2 = t*t, t3 = t2*t;
    return (2*t3 - 3*t2 + 1)*ys[i] + (t3 - 2*t2 + t)*h[i]*m[i] + (-2*t3 + 3*t2)*ys[i + 1] + (t3 - t2)*h[i]*m[i + 1];
  };
}

/** Smooth stations: from a list of measured cross-sections ({z, ...values}),
 *  returns a function giving every value at any z, using PCHIP per value. */
export function stationCurve(list) {
  const zs = list.map(s => s.z), keys = Object.keys(list[0]).filter(k => k !== 'z');
  const curves = Object.fromEntries(keys.map(k => [k, pchip(zs, list.map(s => s[k]))]));
  return z => Object.fromEntries([['z', z], ...keys.map(k => [k, curves[k](z)])]);
}

/** `steps + 1` evenly spaced values from `from` to `to`. */
export const range = (from, to, steps) => Array.from({length: steps + 1}, (_, i) => from + (to - from)*i/steps);
