/**
 * Shared voxel blocks: 43 cm cubes with slightly rounded corners and edges
 * (3.5 cm), each drawn on its own with a fixed slight shade. For collisions
 * every block still counts as a full square cube.
 */

import { Color, Group, InstancedMesh, Matrix4, MeshStandardMaterial } from 'three';
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
