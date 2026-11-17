/**
 * Separate blocks: every cell is its own rounded cube, drawn together in one
 * instanced mesh, each with a fixed slight shade so the blocks read apart.
 * Used for natural detail (stone, rocks, leaves, bushes, roots).
 */

import { Color, Group, InstancedMesh, Matrix4, MeshStandardMaterial } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BLOCK, ROUNDING, shade, type Cell } from './grid.ts';

const material = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.86, metalness: 0 });

export function addSeparateBlocks(root: Group, cells: Cell[], name: string, size = BLOCK): void {
  if (cells.length === 0) return;
  const geometry = new RoundedBoxGeometry(size, size, size, 2, ROUNDING * (size / BLOCK));
  const mesh = new InstancedMesh(geometry, material, cells.length);
  const matrix = new Matrix4();
  const tint = new Color();
  cells.forEach(([x, y, z, colour], i) => {
    matrix.makeTranslation((x + 0.5) * size, (y + 0.5) * size, (z + 0.5) * size);
    mesh.setMatrixAt(i, matrix);
    mesh.setColorAt(i, tint.set(colour).multiplyScalar(shade(x, y, z)));
  });
  mesh.name = name;
  root.add(mesh);
}
