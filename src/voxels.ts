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
export function addMergedBlocks(root: Group, list: Array<[number, number, number, string]>, name: string): void {
  if (list.length === 0) return;
  const cells = new Map<string, Color>();
  for (const [x, y, z, colour] of list) cells.set(`${x},${y},${z}`, new Color(colour));
  const at = (x: number, y: number, z: number): boolean => cells.has(`${x},${y},${z}`);
  const R = 0.035 / BLOCK; // rounding, as a part of one block
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
    for (const side of SIDES) {
      if (at(x + side.n[0], y + side.n[1], z + side.n[2])) continue; // hidden inside the group
      const base = positions.length / 3;
      for (const b of steps) {
        for (const a of steps) {
          const p = [0, 1, 2].map((i) => side.n[i] * 0.5 + side.u[i] * a + side.v[i] * b);
          // Toward a neighbour the edge stays square, so the blocks join flush.
          const core = p.map((value, i) =>
            Math.max(occupied[i][0] ? -0.5 : -0.5 + R, Math.min(occupied[i][1] ? 0.5 : 0.5 - R, value)),
          );
          const off = p.map((value, i) => value - core[i]);
          const len = Math.hypot(off[0], off[1], off[2]) || 1;
          const n = off.map((value) => value / len);
          positions.push(
            (x + 0.5 + core[0] + n[0] * R) * BLOCK,
            (y + 0.5 + core[1] + n[1] * R) * BLOCK,
            (z + 0.5 + core[2] + n[2] * R) * BLOCK,
          );
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
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colours), 3));
  geometry.setIndex(indices);
  const mesh = new Mesh(geometry, mergedMaterial);
  mesh.name = name;
  root.add(mesh);
}
