/**
 * A tiny floating island, 14 × 14 blocks of 43 cm: one layer of grass on
 * top, two layers of dirt, then stone that narrows layer by layer down to a
 * point. The underside is slightly uneven so it looks natural, but the same
 * every time. No plants or objects yet.
 */

import { Group, Scene, Vector3 } from 'three';
import { BLOCK, addBlocks } from './voxels.ts';

const SIZE = 14;
const GRASS = '#93d91e';
const DIRT = '#da965a';
const STONE = '#8f8a84';

/** A fixed pseudo-random number 0..1 for a grid spot. */
function hash(x: number, z: number, y: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233 + y * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

export function buildIsland(scene: Scene): { root: Group; centre: Vector3 } {
  const root = new Group();
  root.name = 'floating-island';
  const half = SIZE / 2;
  const grass: Array<[number, number, number, string]> = [];
  const dirt: Array<[number, number, number, string]> = [];
  const stone: Array<[number, number, number, string]> = [];

  // Top: grass, then two dirt layers, all the full 14 × 14.
  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      grass.push([x, 0, z, GRASS]);
      dirt.push([x, -1, z, DIRT]);
      dirt.push([x, -2, z, DIRT]);
    }
  }

  // Underside: stone layers that start nearly as wide as the top and narrow
  // by about one block per side each layer, down to a point. A little fixed
  // unevenness keeps the edge from being a perfect staircase, and every
  // stone block rests on a block above it.
  const centre = -0.5;
  let above = new Set<string>();
  for (let x = -half; x < half; x++) for (let z = -half; z < half; z++) above.add(`${x},${z}`);
  for (let layer = 0; layer < 8; layer++) {
    const y = -3 - layer;
    const radius = half - 0.2 - layer * 0.9;
    if (radius <= 0.5) break;
    const here = new Set<string>();
    for (let x = -half; x < half; x++) {
      for (let z = -half; z < half; z++) {
        if (!above.has(`${x},${z}`)) continue;
        const dx = Math.abs(x - centre);
        const dz = Math.abs(z - centre);
        // Square-ish footprint with softened corners.
        const d = Math.max(dx, dz) * 0.7 + Math.hypot(dx, dz) * 0.3;
        const wobble = (hash(x, z, y) - 0.5) * 0.7;
        if (d + wobble <= radius) {
          stone.push([x, y, z, STONE]);
          here.add(`${x},${z}`);
        }
      }
    }
    above = here;
  }

  addBlocks(root, grass, 'grass');
  addBlocks(root, dirt, 'dirt');
  addBlocks(root, stone, 'stone');
  scene.add(root);
  return { root, centre: new Vector3(0, -1.0, 0) };
}

export const ISLAND_WIDTH = SIZE * BLOCK;
