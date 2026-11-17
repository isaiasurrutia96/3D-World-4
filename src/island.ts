/**
 * A tiny floating island, 14 × 14 blocks of 43 cm: one layer of grass on
 * top, two layers of dirt, then a stone underside shaped like a perfect
 * upside-down diamond, flat on top. Each material merges into one shape,
 * rounded only on its outside edges. No plants or objects yet.
 */

import { Color, Group, Scene, Vector3 } from 'three';
import { BLOCK, addMergedBlocks } from './voxels.ts';

const SIZE = 14;
const GRASS = '#93d91e';
const DIRT = '#da965a';
const STONE = '#8f8a84';

/** A fixed pseudo-random number 0..1 for a grid spot. */
function hash(x: number, z: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Grass colour for a block: mostly the plain green, but about one block in
 * ten is a very slightly lighter or darker green, picked the same every time.
 */
function grassColour(x: number, z: number): string {
  const h = hash(x, z);
  if (h < 0.05) return '#' + new Color(GRASS).multiplyScalar(0.965).getHexString();
  if (h < 0.1) return '#' + new Color(GRASS).multiplyScalar(1.04).getHexString();
  return GRASS;
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
      grass.push([x, 0, z, grassColour(x, z)]);
      dirt.push([x, -1, z, DIRT]);
      dirt.push([x, -2, z, DIRT]);
    }
  }

  // Underside: a perfect upside-down diamond (square pyramid). The top stone
  // layer is the full 14 × 14 so it fits flat under the dirt; each layer
  // below is exactly one block narrower on every side: 14, 12, 10 … 2.
  for (let layer = 0; layer < half; layer++) {
    const y = -3 - layer;
    for (let x = -half + layer; x < half - layer; x++) {
      for (let z = -half + layer; z < half - layer; z++) stone.push([x, y, z, STONE]);
    }
  }

  addMergedBlocks(root, grass, 'grass');
  addMergedBlocks(root, dirt, 'dirt');
  addMergedBlocks(root, stone, 'stone');
  scene.add(root);
  return { root, centre: new Vector3(0, -1.3, 0) };
}

export const ISLAND_WIDTH = SIZE * BLOCK;
