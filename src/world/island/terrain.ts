/**
 * Island terrain, in layers from the top down:
 *  1. Grass: one layer over the whole 14 × 14, a pond cut out at the front
 *     right, and one block higher over the raised tree corner. About one
 *     block in ten is a very slightly lighter or darker green.
 *  2. Dirt: two full layers, plus one under the raised corner's grass.
 *  3. Stone: an upside-down diamond (square pyramid), flat on top:
 *     14, 12, 10 … 2 blocks wide, one block narrower on every side each layer.
 */

import { Color, type Group } from 'three';
import { hash, type Cell } from '../grid.ts';
import { COLOURS, build } from '../materials.ts';
import { HALF, isPond, isRaised } from './layout.ts';

/** Grass colour for a block: mostly plain, a few slightly lighter or darker. */
export function grassColour(x: number, z: number): string {
  const h = hash(x, z);
  if (h < 0.05) return '#' + new Color(COLOURS.grass).multiplyScalar(0.965).getHexString();
  if (h < 0.1) return '#' + new Color(COLOURS.grass).multiplyScalar(1.04).getHexString();
  return COLOURS.grass;
}

export interface Terrain { grass: Cell[]; dirt: Cell[]; stone: Cell[] }

/** The terrain cells, without drawing anything (so they can be checked). */
export function terrainCells(): Terrain {
  const grass: Cell[] = [];
  const dirt: Cell[] = [];
  const stone: Cell[] = [];
  for (let x = -HALF; x < HALF; x++) {
    for (let z = -HALF; z < HALF; z++) {
      if (isRaised(x, z)) {
        grass.push([x, 1, z, grassColour(x, z)]);
        dirt.push([x, 0, z, COLOURS.dirt]);
      } else if (!isPond(x, z)) grass.push([x, 0, z, grassColour(x, z)]);
      dirt.push([x, -1, z, COLOURS.dirt]);
      dirt.push([x, -2, z, COLOURS.dirt]);
    }
  }
  for (let layer = 0; layer < HALF; layer++) {
    const y = -3 - layer;
    for (let x = -HALF + layer; x < HALF - layer; x++) {
      for (let z = -HALF + layer; z < HALF - layer; z++) stone.push([x, y, z, COLOURS.stone]);
    }
  }
  return { grass, dirt, stone };
}

export function addTerrain(root: Group, t: Terrain = terrainCells()): void {
  build(root, t.grass, 'grass');
  build(root, t.dirt, 'dirt');
  build(root, t.stone, 'stone');
}
