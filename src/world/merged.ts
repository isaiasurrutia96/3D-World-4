/**
 * Merged blocks: a group of cells drawn as one solid shape. Used for large,
 * flat or regular things (grass, dirt, tree trunk).
 *
 * How the shape is made, in three parts:
 *  1. Skin. Each open face of each cell is a 6 × 6 grid of points. Edges and
 *     corners are rounded only where they face open air; toward a neighbour
 *     they stay square so blocks join flush. Where two neighbours meet at an
 *     inner corner, the curves are mitred like a picture frame.
 *     Faces under and over a neighbour are also drawn, 4% inside, to fill
 *     the thin slivers a neighbour's rounded edge would otherwise leave.
 *  2. Cores. A solid box inside every cell, in its own colour, reaching
 *     neighbours and stopping just under the rounded skin, so a pinhole can
 *     only ever show the block's own colour.
 *  3. Edge cores (optional). Where two cells touch only along an edge, a thin
 *     box along that edge closes the slot between their rounded edges.
 * Every cell is still a full grid cube for collisions.
 */

import { BufferAttribute, BufferGeometry, Color, Group, Mesh, MeshStandardMaterial } from 'three';
import { BLOCK, ROUNDING, cellKey, type Cell, type Support } from './grid.ts';

type Vec = [number, number, number];
interface Side { n: Vec; u: Vec; v: Vec }

/** The six faces of a cube: outward normal n, and the face's u/v directions. */
const SIDES: Side[] = [
  { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
];

/** Rounding as a share of one block, so every block size looks the same. */
const R = ROUNDING / BLOCK;
/** Where the 6 × 6 points of a face sit, across the face (-0.5 .. 0.5). */
const STEPS = [-0.5, -0.5 + R * 0.3, -0.5 + R, 0.5 - R, 0.5 - R * 0.3, 0.5];
/** Inside faces sit this far in (as a scale), so they never show as seams. */
const INSIDE = 0.96;
/** Cores stop this far inside the surface on open sides. */
const CORE_INSET = 0.5 - 0.4 * R;
/** Half-width of an edge core. */
const EDGE_CORE = 0.55 * R;

const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0 });

/** Growing arrays for one mesh. */
class MeshData {
  positions: number[] = [];
  normals: number[] = [];
  colours: number[] = [];
  indices: number[] = [];
  get count(): number { return this.positions.length / 3; }
  point(p: number[], n: number[], c: Color): void {
    this.positions.push(p[0], p[1], p[2]);
    this.normals.push(n[0], n[1], n[2]);
    this.colours.push(c.r, c.g, c.b);
  }
  quad(base: number): void { this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3); }
  toMesh(name: string): Mesh {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(this.positions), 3));
    g.setAttribute('normal', new BufferAttribute(new Float32Array(this.normals), 3));
    g.setAttribute('color', new BufferAttribute(new Float32Array(this.colours), 3));
    g.setIndex(this.indices);
    const mesh = new Mesh(g, material);
    mesh.name = name;
    return mesh;
  }
}

/** One corner of a box face, as 0/1 steps along the face's u and v. */
const QUAD: Array<[number, number]> = [[0, 0], [1, 0], [1, 1], [0, 1]];
/** Point on a box face: `plane` on the normal axis, lo..lo+span across the face. */
function boxFacePoint(side: Side, axis: number, plane: number, lo: number[], span: number[], a: number, b: number): number[] {
  const q = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    if (i === axis) { q[i] = plane; continue; }
    const t = side.u[i] !== 0 ? (side.u[i] > 0 ? a : 1 - a) : side.v[i] !== 0 ? (side.v[i] > 0 ? b : 1 - b) : 0;
    q[i] = lo[i] + span[i] * t;
  }
  return q;
}

export interface MergedOptions {
  /** Solid ground the cells sit on: they sit flat and square on it. */
  restsOn?: Support;
  /** Thin cores where cells touch only along an edge. */
  edgeCores?: boolean;
}

export function addMergedBlocks(root: Group, list: Cell[], name: string, size = BLOCK, options: MergedOptions = {}): void {
  if (list.length === 0) return;
  const { restsOn, edgeCores = false } = options;
  const cells = new Map<string, Color>();
  for (const [x, y, z, colour] of list) cells.set(cellKey(x, y, z), new Color(colour));
  const solid = (x: number, y: number, z: number): boolean => cells.has(cellKey(x, y, z)) || (restsOn?.(x, y, z) ?? false);
  const data = new MeshData();
  const snap = (v: number): number => (Math.round(v * 1e5) / 1e5) * size;

  // ---- 1. Skin -----------------------------------------------------------
  for (const [key, tint] of cells) {
    const [x, y, z] = key.split(',').map(Number);
    const has = (d: number[]): boolean => solid(x + d[0], y + d[1], z + d[2]);
    const occupied = [
      [solid(x - 1, y, z), solid(x + 1, y, z)],
      [solid(x, y - 1, z), solid(x, y + 1, z)],
      [solid(x, y, z - 1), solid(x, y, z + 1)],
    ];
    for (const side of SIDES) {
      const exposed = !has(side.n);
      if (!exposed && side.n[1] === 0) continue; // inside, and not under/over: not needed
      const A = side.n.findIndex((v) => v !== 0);
      const sa = side.n[A];
      const [B, C] = [0, 1, 2].filter((i) => i !== A);

      // Inner corners on this face: neighbours on two sides, the spot between
      // them empty. Each neighbour's edge there is rounded only if the face
      // beyond it (in this face's direction) is open.
      const corners: Array<{ sb: number; sc: number; roundU: boolean; roundW: boolean }> = [];
      if (exposed) {
        for (const sb of [1, -1]) {
          for (const sc of [1, -1]) {
            const dB = [0, 0, 0]; dB[B] = sb;
            const dC = [0, 0, 0]; dC[C] = sc;
            const dD = [0, 0, 0]; dD[B] = sb; dD[C] = sc;
            if (!has(dB) || !has(dC) || has(dD)) continue;
            const upC = dC.slice(); upC[A] += sa;
            const upB = dB.slice(); upB[A] += sa;
            corners.push({ sb, sc, roundU: !has(upC), roundW: !has(upB) });
          }
        }
      }

      const base = data.count;
      for (const b of STEPS) {
        for (const a of STEPS) {
          const p = [0, 1, 2].map((i) => side.n[i] * 0.5 + side.u[i] * a + side.v[i] * b);
          // The rounding centre: pulled in from open sides, flush at neighbours.
          const core = p.map((value, i) =>
            Math.max(occupied[i][0] ? -0.5 : -0.5 + R, Math.min(occupied[i][1] ? 0.5 : 0.5 - R, value)));
          const off = p.map((value, i) => value - core[i]);
          const len = Math.hypot(off[0], off[1], off[2]) || 1;
          let n = off.map((value) => value / len);
          // Inner corners: follow whichever neighbouring curve is higher, so
          // the two curves meet flush (a mitre) with no notch.
          for (const { sb, sc, roundU, roundW } of corners) {
            const u = p[B] * sb;
            const w = p[C] * sc;
            if (u <= 0.5 - R || w <= 0.5 - R) continue;
            const tu = u - (0.5 - R);
            const tw = w - (0.5 - R);
            const hu = roundU ? Math.sqrt(Math.max(0, R * R - tu * tu)) : R;
            const hw = roundW ? Math.sqrt(Math.max(0, R * R - tw * tw)) : R;
            const fromW = hw >= hu;
            const h = fromW ? hw : hu;
            const nn = [0, 0, 0];
            nn[A] = (sa * h) / R;
            if (fromW && roundW) nn[C] = (tw / R) * sc;
            if (!fromW && roundU) nn[B] = (tu / R) * sb;
            const l = Math.hypot(nn[0], nn[1], nn[2]) || 1;
            n = nn.map((value) => value / l);
            const local = p.slice();
            local[A] = sa * (0.5 - R + h);
            for (let i = 0; i < 3; i++) core[i] = local[i] - n[i] * R;
          }
          const k = exposed ? 1 : INSIDE;
          const pos = [0, 1, 2].map((i) => (core[i] + n[i] * R) * k);
          // Snapped so edges shared by two blocks land on exactly the same numbers.
          data.point([snap(x + 0.5 + pos[0]), snap(y + 0.5 + pos[1]), snap(z + 0.5 + pos[2])], n, tint);
        }
      }
      const row = STEPS.length;
      for (let j = 0; j < row - 1; j++) {
        for (let i = 0; i < row - 1; i++) {
          const k = base + j * row + i;
          data.indices.push(k, k + 1, k + row + 1, k, k + row + 1, k + row);
        }
      }
    }
  }

  // ---- 2. Cores ----------------------------------------------------------
  for (const [key, tint] of cells) {
    const [x, y, z] = key.split(',').map(Number);
    const lo = [solid(x - 1, y, z) ? -0.5 : -CORE_INSET, solid(x, y - 1, z) ? -0.5 : -CORE_INSET, solid(x, y, z - 1) ? -0.5 : -CORE_INSET];
    const hi = [solid(x + 1, y, z) ? 0.5 : CORE_INSET, solid(x, y + 1, z) ? 0.5 : CORE_INSET, solid(x, y, z + 1) ? 0.5 : CORE_INSET];
    for (const side of SIDES) {
      if (solid(x + side.n[0], y + side.n[1], z + side.n[2])) continue;
      const A = side.n.findIndex((v) => v !== 0);
      const plane = side.n[A] > 0 ? hi[A] : lo[A];
      const base = data.count;
      for (const [a, b] of QUAD) {
        const q = boxFacePoint(side, A, plane, lo, [0, 1, 2].map((i) => hi[i] - lo[i]), a, b);
        data.point([(x + 0.5 + q[0]) * size, (y + 0.5 + q[1]) * size, (z + 0.5 + q[2]) * size], side.n, tint);
      }
      data.quad(base);
    }
  }

  // ---- 3. Edge cores -----------------------------------------------------
  if (edgeCores) {
    for (const [key, tint] of cells) {
      const [x, y, z] = key.split(',').map(Number);
      // Each pair once: look only in the + direction of the first axis.
      for (const [axisA, axisB] of [[0, 2], [0, 1], [2, 1]]) {
        for (const sb of [1, -1]) {
          const d = [0, 0, 0]; d[axisA] = 1; d[axisB] = sb;
          const sideA = [0, 0, 0]; sideA[axisA] = 1;
          const sideB = [0, 0, 0]; sideB[axisB] = sb;
          if (!solid(x + d[0], y + d[1], z + d[2])) continue;
          if (solid(x + sideA[0], y + sideA[1], z + sideA[2]) || solid(x + sideB[0], y + sideB[1], z + sideB[2])) continue;
          const c = [x + 0.5, y + 0.5, z + 0.5];
          c[axisA] += 0.5;
          c[axisB] += 0.5 * sb;
          const h = [0.5, 0.5, 0.5];
          h[axisA] = EDGE_CORE;
          h[axisB] = EDGE_CORE;
          const lo = c.map((v, i) => v - h[i]);
          const span = h.map((v) => 2 * v);
          for (const side of SIDES) {
            const A = side.n.findIndex((v) => v !== 0);
            const base = data.count;
            for (const [a, b] of QUAD) {
              const q = boxFacePoint(side, A, c[A] + side.n[A] * h[A], lo, span, a, b);
              data.point([q[0] * size, q[1] * size, q[2] * size], side.n, tint);
            }
            data.quad(base);
          }
        }
      }
    }
  }

  root.add(data.toMesh(name));
}
