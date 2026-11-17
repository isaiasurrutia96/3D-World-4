/**
 * Shared voxel blocks: 43 cm cubes with slightly rounded corners and edges
 * (3.5 cm), each drawn on its own with a fixed slight shade. For collisions
 * every block still counts as a full square cube.
 */

import {
  BufferAttribute, BufferGeometry, Color, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const BLOCK = 0.43;

/** A fixed lighter-or-darker amount per block, the same every time. */
export function shade(x: number, y: number, z: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return 0.92 + (s - Math.floor(s)) * 0.16;
}

const material = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.86, metalness: 0 });

/** Adds blocks [x, y, z, colour] (grid steps; block x spans x..x+1). */
export function addBlocks(root: Group, list: Array<[number, number, number, string]>, name: string): void {
  if (list.length === 0) return;
  const geometry = new RoundedBoxGeometry(BLOCK, BLOCK, BLOCK, 2, 0.035);
  const mesh = new InstancedMesh(geometry, material, list.length);
  const matrix = new Matrix4();
  const tint = new Color();
  list.forEach(([x, y, z, colour], i) => {
    matrix.makeTranslation((x + 0.5) * BLOCK, (y + 0.5) * BLOCK, (z + 0.5) * BLOCK);
    mesh.setMatrixAt(i, matrix);
    mesh.setColorAt(i, tint.set(colour).multiplyScalar(shade(x, y, z)));
  });
  mesh.name = name;
  root.add(mesh);
}

const mergedMaterial = new MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0 });

/**
 * Adds blocks [x, y, z, colour] merged into one solid shape: faces between
 * touching blocks of this group are left out, and edges and corners are
 * rounded (3.5 cm) only where they face the open air. The group reads as one
 * big rounded block. Each block is still its own grid cube underneath.
 */
export function addMergedBlocks(
  root: Group, list: Array<[number, number, number, string]>, name: string, size = BLOCK,
  /** Solid ground these blocks sit on: they sit flat and square on it. */
  restsOn?: (x: number, y: number, z: number) => boolean,
  /** Also fill side faces between blocks (for objects with stepped shapes). */
  fillSides = false,
): void {
  if (list.length === 0) return;
  const cells = new Map<string, Color>();
  for (const [x, y, z, colour] of list) cells.set(`${x},${y},${z}`, new Color(colour));
  const at = (x: number, y: number, z: number): boolean => cells.has(`${x},${y},${z}`) || (restsOn?.(x, y, z) ?? false);
  const R = 0.035 / BLOCK; // rounding, as a part of one block (same look at every size)
  const steps = [-0.5, -0.5 + R * 0.3, -0.5 + R, 0.5 - R, 0.5 - R * 0.3, 0.5];
  const SIDES: Array<{ n: number[]; u: number[]; v: number[] }> = [
    { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
    { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
    { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
    { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
    { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
  ];
  const positions: number[] = [];
  const normals: number[] = [];
  const colours: number[] = [];
  const indices: number[] = [];
  for (const [key, tint] of cells) {
    const [x, y, z] = key.split(',').map(Number);
    // For each axis: is there a neighbour on the low side, and the high side?
    const occupied = [
      [at(x - 1, y, z), at(x + 1, y, z)],
      [at(x, y - 1, z), at(x, y + 1, z)],
      [at(x, y, z - 1), at(x, y, z + 1)],
    ];
    const has = (d: number[]): boolean => at(x + d[0], y + d[1], z + d[2]);
    for (const side of SIDES) {
      // Faces between blocks of the group are drawn too: they stay hidden
      // inside the solid, except in the small slivers that a neighbour's
      // rounded edge leaves open, which they fill so no gap shows through.
      const exposed = !has(side.n);
      // Only the faces under and over a neighbour are needed to fill gaps
      // (where a block's rounded side edges sit on a square-edged block).
      if (!exposed && side.n[1] === 0 && !fillSides) continue;
      // A side face between two blocks of the group: only worth drawing where
      // the neighbour has a block on top (its top edge there is square while
      // ours may be rounded, leaving a sliver). It sits exactly on the shared
      // plane, so it only shows through that sliver.
      if (!exposed && side.n[1] === 0) {
        const nx = x + side.n[0];
        const nz = z + side.n[2];
        if (!at(nx, y + 1, nz) && !at(nx, y - 1, nz)) continue;
      }
      const sideFill = !exposed && side.n[1] === 0;
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
      const base = positions.length / 3;
      for (const b of steps) {
        for (const a of steps) {
          const p = [0, 1, 2].map((i) => side.n[i] * 0.5 + side.u[i] * a + side.v[i] * b);
          // Toward a neighbour the edge stays square, so the blocks join flush.
          const core: number[] = p.map((value, i) =>
            Math.max(occupied[i][0] ? -0.5 : -0.5 + R, Math.min(occupied[i][1] ? 0.5 : 0.5 - R, value)),
          );
          let off = p.map((value, i) => value - core[i]);
          let len = Math.hypot(off[0], off[1], off[2]) || 1;
          let n = off.map((value) => value / len);
          // Inner corners: round this block's corner the same way as the two
          // neighbouring edges meeting there, following whichever is higher,
          // so the curves meet flush (a picture-frame mitre) with no notch.
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
            off = n.map((value) => value * R);
            len = R;
          }
          // Inside faces sit 4% in from the block's surface, so they can never
          // show as lines along the seams; they only show through a gap.
          const k = exposed ? 1 : 0.96;
          // Snapped so edges shared by two blocks land on exactly the same
          // numbers, leaving no hairline crack between them.
          const snap = (v: number): number => (Math.round(v * 1e5) / 1e5) * size;
          const pos = [0, 1, 2].map((i) => (core[i] + n[i] * R) * (sideFill && i === A ? 1 : k));
          positions.push(snap(x + 0.5 + pos[0]), snap(y + 0.5 + pos[1]), snap(z + 0.5 + pos[2]));
          normals.push(n[0], n[1], n[2]);
          colours.push(tint.r, tint.g, tint.b);
        }
      }
      const row = steps.length;
      for (let j = 0; j < row - 1; j++) {
        for (let i = 0; i < row - 1; i++) {
          const k = base + j * row + i;
          indices.push(k, k + 1, k + row + 1, k, k + row + 1, k + row);
        }
      }
    }
  }
  // Safety net: a solid core inside every block, in the block's own colour.
  // It reaches right up to touching neighbours and stops just inside the
  // rounded skin on open sides, so it never shows, except through a tiny
  // pinhole the rounding might leave, which then shows the block's colour
  // instead of whatever is behind it.
  const inset = 0.5 - 0.4 * R;
  for (const [key, tint] of cells) {
    const [x, y, z] = key.split(',').map(Number);
    const lo = [at(x - 1, y, z) ? -0.5 : -inset, at(x, y - 1, z) ? -0.5 : -inset, at(x, y, z - 1) ? -0.5 : -inset];
    const hi = [at(x + 1, y, z) ? 0.5 : inset, at(x, y + 1, z) ? 0.5 : inset, at(x, y, z + 1) ? 0.5 : inset];
    for (const side of SIDES) {
      if (at(x + side.n[0], y + side.n[1], z + side.n[2])) continue; // inside the group: not needed
      const A = side.n.findIndex((v) => v !== 0);
      const plane = side.n[A] > 0 ? hi[A] : lo[A];
      const base = positions.length / 3;
      for (const [a, b] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
        const q = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
          if (i === A) q[i] = plane;
          else {
            const t = side.u[i] !== 0 ? (side.u[i] > 0 ? a : 1 - a) : side.v[i] !== 0 ? (side.v[i] > 0 ? b : 1 - b) : 0;
            q[i] = lo[i] + (hi[i] - lo[i]) * t;
          }
        }
        positions.push((x + 0.5 + q[0]) * size, (y + 0.5 + q[1]) * size, (z + 0.5 + q[2]) * size);
        normals.push(side.n[0], side.n[1], side.n[2]);
        colours.push(tint.r, tint.g, tint.b);
      }
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }

  // Where two blocks touch only along one edge (diagonal, with both blocks
  // beside them empty), their rounded edges leave a thin slot you could see
  // through. A thin core along that shared edge closes it.
  const box = (c: number[], h: number[], tint: Color): void => {
    for (const side of SIDES) {
      const A = side.n.findIndex((v) => v !== 0);
      const base = positions.length / 3;
      for (const [a, b] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
        const q = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
          if (i === A) q[i] = c[i] + side.n[A] * h[i];
          else {
            const t = side.u[i] !== 0 ? (side.u[i] > 0 ? a : 1 - a) : side.v[i] !== 0 ? (side.v[i] > 0 ? b : 1 - b) : 0;
            q[i] = c[i] - h[i] + 2 * h[i] * t;
          }
        }
        positions.push(q[0] * size, q[1] * size, q[2] * size);
        normals.push(side.n[0], side.n[1], side.n[2]);
        colours.push(tint.r, tint.g, tint.b);
      }
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  };
  const w = 0.55 * R;
  for (const [key, tint] of cells) {
    const [x, y, z] = key.split(',').map(Number);
    // Each pair once: look only in the + direction of the first axis.
    for (const [axisA, axisB] of [[0, 2], [0, 1], [2, 1]]) {
      for (const sb of [1, -1]) {
        const d = [0, 0, 0]; d[axisA] = 1; d[axisB] = sb;
        const sideA = [0, 0, 0]; sideA[axisA] = 1;
        const sideB = [0, 0, 0]; sideB[axisB] = sb;
        if (!at(x + d[0], y + d[1], z + d[2])) continue;
        if (at(x + sideA[0], y + sideA[1], z + sideA[2]) || at(x + sideB[0], y + sideB[1], z + sideB[2])) continue;
        const c = [x + 0.5, y + 0.5, z + 0.5];
        c[axisA] += 0.5;
        c[axisB] += 0.5 * sb;
        const h = [0.5, 0.5, 0.5];
        h[axisA] = w;
        h[axisB] = w;
        box(c, h, tint);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colours), 3));
  geometry.setIndex(indices);
  const mesh = new Mesh(geometry, mergedMaterial);
  mesh.name = name;
  root.add(mesh);
}
