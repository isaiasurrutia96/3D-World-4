/**
 * The small NASCAR-style oval from 3D-WORLD-3 (branch
 * claude/intelligent-clarke-occyfc, commit 17d170b), copied unchanged:
 * banked turns built up from 43 cm blocks, a smooth road over them, a smooth
 * grass-to-concrete edge, an outside wall, and the grass and dirt blocks
 * around the track. Change since: every block is now individually rounded.
 */

import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Scene,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const TERRAIN = 0.43;

/** A fixed lighter-or-darker amount per block, the same every time. */
function shade(x: number, y: number, z: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return 0.92 + (s - Math.floor(s)) * 0.16;
}



const blockMaterial = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.86, metalness: 0 });

/**
 * Blocks of one size, each [x, y, z, colour] in steps of that size. Every
 * block is drawn on its own as a cube with slightly rounded corners and
 * edges (3.5 cm on a 43 cm block, the same as the Test Lab blocks), each a
 * fixed slight shade lighter or darker. For collisions each block still
 * counts as a full square cube, so the grooves between blocks are only looks.
 */
function blocks(
  root: Group,
  size: number,
  list: Array<[number, number, number, string]>,
  name: string,
  _restsOn?: (x: number, y: number, z: number) => boolean,
): void {
  if (list.length === 0) return;
  const geometry = new RoundedBoxGeometry(size, size, size, 2, size * (0.035 / 0.43));
  const mesh = new InstancedMesh(geometry, blockMaterial, list.length);
  const matrix = new Matrix4();
  const tint = new Color();
  list.forEach(([x, y, z, colour], i) => {
    matrix.makeTranslation((x + 0.5) * size, (y + 0.5) * size, (z + 0.5) * size);
    mesh.setMatrixAt(i, matrix);
    mesh.setColorAt(i, tint.set(colour).multiplyScalar(shade(x, y, z)));
  });
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
}

export interface OvalScene {
  root: Group;
  characterAt: Vector3;
  centre: Vector3;
  extent: { width: number; height: number; depth: number };
}


/**
 * A small NASCAR-style oval: two straights and two half-circle turns, the
 * turns banked inward. The banking is built up from blocks — stacked 43 cm
 * blocks that step up toward the outside of each turn — and a smooth road is
 * laid over them, flat on the straights and tilting into the turns, with a
 * concrete wall along the outside.
 */
export function buildOvalScene(scene: Scene): OvalScene {
  const root = new Group();
  root.name = 'oval-scene';
  const B = TERRAIN;
  const L = 14 * B; // the straights
  const R = 6 * B; // the turns, to the middle of the road
  const WIDE = 4 * B; // the road
  const BANK = 2 * B; // how high the outside of a turn stands
  const GRASS = '#93d91e';
  const DIRT = '#da965a';
  const CONCRETE = '#c4bfb5';

  const smooth = (a: number, b: number, v: number) => {
    const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  /** How far into a turn a point is, 0 on the straights to 1 in the turns. */
  const turnAt = (x: number) => smooth(L / 2 - 1.3, L / 2 + 0.7, Math.abs(x));
  /** A point's offset across the road: −WIDE/2 at the inside edge, +WIDE/2 outside. */
  const across = (x: number, z: number) =>
    Math.abs(x) <= L / 2 ? Math.abs(z) - R : Math.hypot(Math.abs(x) - L / 2, z) - R;
  /** The road's height at a point on it. */
  const roadHeight = (x: number, z: number) =>
    turnAt(x) * BANK * Math.min(1, Math.max(0, (across(x, z) + WIDE / 2) / WIDE));

  /** Positive inside the concrete round the road, negative on the grass. */
  const concreteness = (x: number, z: number) => WIDE / 2 + B * 0.5 - Math.abs(across(x, z));
  /** Blocks the grass-to-concrete edge passes through, with the value at each corner. */
  const edgeCells: Array<[number, number, number[]]> = [];

  // ---- The dirt slab and the ground layer of blocks ----
  const halfX = Math.ceil((L / 2 + R + WIDE / 2) / B) + 1;
  const halfZ = Math.ceil((R + WIDE / 2) / B) + 1;
  const dirt: Array<[number, number, number, string]> = [];
  const ground: Array<[number, number, number, string]> = [];
  const raised: Array<[number, number, number, string]> = [];
  for (let i = -halfX; i < halfX; i += 1) {
    for (let k = -halfZ; k < halfZ; k += 1) {
      const x = (i + 0.5) * B;
      const z = (k + 0.5) * B;
      dirt.push([i, -2, k, DIRT]);
      const off = across(x, z);
      const onRoad = Math.abs(off) <= WIDE / 2 + B * 0.5;
      // A block wholly inside the concrete is concrete; one the edge passes
      // through is grass, with its concrete part laid on top further down.
      const corners = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].map(([dx, dz]) => concreteness((i + 0.5 + dx) * B, (k + 0.5 + dz) * B));
      const allConcrete = corners.every((v) => v > 0);
      const someConcrete = corners.some((v) => v > 0);
      ground.push([i, -1, k, allConcrete ? CONCRETE : GRASS]);
      if (someConcrete && !allConcrete) edgeCells.push([i, k, corners]);
      if (!onRoad) continue;
      // The foundation: whole blocks up to just under the road at the lowest
      // point of this cell, so none pokes through the road laid on top.
      let lowest = Infinity;
      for (const [dx, dz] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
        const px = x + dx * B;
        const pz = z + dz * B;
        const o = across(px, pz);
        lowest = Math.min(lowest, Math.abs(o) <= WIDE / 2 ? roadHeight(px, pz) : 0);
      }
      const layers = Math.floor(lowest / B + 1e-6);
      for (let y = 0; y < layers; y += 1) raised.push([i, y, k, CONCRETE]);
    }
  }
  blocks(root, B, dirt, 'dirt-slab');
  const inSlab = (x: number, y: number, z: number) => y === -2 && x >= -halfX && x < halfX && z >= -halfZ && z < halfZ;
  blocks(root, B, ground, 'ground', inSlab);
  const groundAt = new Set(ground.map(([x, , z]) => `${x},${z}`));
  const raisedAt = new Set(raised.map(([x, y, z]) => `${x},${y},${z}`));
  blocks(root, B, raised, 'banking-blocks', (x, y, z) => (y === -1 ? groundAt.has(`${x},${z}`) : raisedAt.has(`${x},${y},${z}`)));

  // ---- The smooth grass-to-concrete edge ----
  // Where the edge passes through a block, the concrete part of its top is
  // laid over the grass: cut along the true curve, so a block can have a
  // corner of concrete, or half of it, and the line round the track runs
  // smoothly instead of in steps.
  {
    const positions: number[] = [];
    const tint = new Color(CONCRETE);
    for (const [i, k, v] of edgeCells) {
      const pts: Array<[number, number]> = [];
      const cx = [i, i + 1, i + 1, i];
      const cz = [k, k, k + 1, k + 1];
      for (let c = 0; c < 4; c += 1) {
        const n = (c + 1) % 4;
        if (v[c] > 0) pts.push([cx[c], cz[c]]);
        if ((v[c] > 0) !== (v[n] > 0)) {
          const t = v[c] / (v[c] - v[n]);
          pts.push([cx[c] + (cx[n] - cx[c]) * t, cz[c] + (cz[n] - cz[c]) * t]);
        }
      }
      for (let t = 1; t < pts.length - 1; t += 1) {
        for (const p of [pts[0], pts[t + 1], pts[t]]) positions.push(p[0] * B, 0.003, p[1] * B);
      }
    }
    // The fully concrete blocks get the same flat top, so the whole concrete
    // band is one smooth surface: the grooves between the rounded blocks
    // underneath (which showed thin green lines) are covered.
    for (const [i, , k, colour] of ground) {
      if (colour !== CONCRETE) continue;
      for (const [a, c] of [[0, 0], [1, 1], [1, 0], [0, 0], [0, 1], [1, 1]]) positions.push((i + a) * B, 0.003, (k + c) * B);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    const normals = new Float32Array(positions.length);
    for (let n = 1; n < normals.length; n += 3) normals[n] = 1;
    g.setAttribute('normal', new BufferAttribute(normals, 3));
    const m = new MeshStandardMaterial({ color: tint, roughness: 0.86, side: DoubleSide });
    m.toneMapped = false;
    const edge = new Mesh(g, m);
    edge.name = 'concrete-edge';
    edge.receiveShadow = true;
    root.add(edge);
  }

  // ---- The road: a smooth surface over the blocks, round the whole oval ----
  const P = 2 * L + 2 * Math.PI * R;
  const centre = (s: number): { x: number; z: number; nx: number; nz: number } => {
    s = ((s % P) + P) % P;
    if (s < L) return { x: -L / 2 + s, z: R, nx: 0, nz: 1 };
    s -= L;
    if (s < Math.PI * R) {
      const t = Math.PI / 2 - s / R;
      return { x: L / 2 + R * Math.cos(t), z: R * Math.sin(t), nx: Math.cos(t), nz: Math.sin(t) };
    }
    s -= Math.PI * R;
    if (s < L) return { x: L / 2 - s, z: -R, nx: 0, nz: -1 };
    s -= L;
    const t = -Math.PI / 2 - s / R;
    return { x: -L / 2 + R * Math.cos(t), z: R * Math.sin(t), nx: Math.cos(t), nz: Math.sin(t) };
  };
  const ALONG = 240;
  const ACROSS = 10;
  const road = new BufferGeometry();
  {
    const positions: number[] = [];
    const indices: number[] = [];
    for (let a = 0; a <= ALONG; a += 1) {
      const c = centre((a / ALONG) * P);
      const tf = turnAt(c.x);
      for (let b = 0; b <= ACROSS; b += 1) {
        const t = b / ACROSS; // 0 inside, 1 outside
        const off = (t - 0.5) * WIDE;
        positions.push(c.x + c.nx * off, tf * BANK * t + 0.004, c.z + c.nz * off);
      }
    }
    const row = ACROSS + 1;
    for (let a = 0; a < ALONG; a += 1) {
      for (let b = 0; b < ACROSS; b += 1) {
        const k = a * row + b;
        indices.push(k, k + 1, k + row + 1, k, k + row + 1, k + row);
      }
    }
    road.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    road.setIndex(indices);
    road.computeVertexNormals();
  }
  const asphalt = new MeshStandardMaterial({ color: '#4a4f57', roughness: 0.9, side: DoubleSide });
  asphalt.toneMapped = false;
  const roadMesh = new Mesh(road, asphalt);
  roadMesh.name = 'road';
  roadMesh.receiveShadow = true;
  root.add(roadMesh);

  // White lines just inside each edge.
  const line = (t0: number, t1: number) => {
    const positions: number[] = [];
    const indices: number[] = [];
    for (let a = 0; a <= ALONG; a += 1) {
      const c = centre((a / ALONG) * P);
      const tf = turnAt(c.x);
      for (const t of [t0, t1]) {
        const off = (t - 0.5) * WIDE;
        positions.push(c.x + c.nx * off, tf * BANK * t + 0.008, c.z + c.nz * off);
      }
      if (a > 0) {
        const k = a * 2;
        indices.push(k - 2, k - 1, k + 1, k - 2, k + 1, k);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    const m = new MeshStandardMaterial({ color: '#f2f2f2', roughness: 0.8, side: DoubleSide });
    m.toneMapped = false;
    const mesh = new Mesh(g, m);
    mesh.name = 'road-line';
    root.add(mesh);
  };
  line(0.04, 0.07);
  line(0.93, 0.96);

  // ---- The outside wall: from the ground to a lip above the road ----
  {
    const positions: number[] = [];
    const indices: number[] = [];
    const LIP = 0.22;
    for (let a = 0; a <= ALONG; a += 1) {
      const c = centre((a / ALONG) * P);
      const top = turnAt(c.x) * BANK + LIP;
      const off = WIDE / 2 + 0.03;
      const x = c.x + c.nx * off;
      const z = c.z + c.nz * off;
      positions.push(x, 0, z, x, top, z);
      if (a > 0) {
        const k = a * 2;
        indices.push(k - 2, k, k + 1, k - 2, k + 1, k - 1);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    const m = new MeshStandardMaterial({ color: '#e8e4dc', roughness: 0.9, side: DoubleSide });
    m.toneMapped = false;
    const wall = new Mesh(g, m);
    wall.name = 'wall';
    wall.castShadow = true;
    root.add(wall);
  }

  // The blocks are now rounded one by one; lift the road surfaces 2.5 cm so
  // they never flicker against the block tops beneath them.
  for (const child of root.children) {
    if (child.name === 'concrete-edge') child.position.y += 0.025;
    if (child.name === 'road' || child.name === 'road-line') child.position.y += 0.045;
  }

  scene.add(root);
  return {
    root,
    characterAt: new Vector3(0, 0.004, R),
    centre: new Vector3(0, 0.3, 0),
    extent: { width: 2 * halfX * B, height: 2, depth: 2 * halfZ * B },
  };
}
