/**
 * The floating island: 14 × 14 blocks of 43 cm. Terrain (grass, dirt, stone
 * diamond underneath) plus nature (pond, tree with roots, bush, rock,
 * flowers). Built from clean layers: grid → blocks/merged → build rule →
 * layout → terrain → nature.
 */

import { Group, type Scene, Vector3 } from 'three';
import { BLOCK } from '../grid.ts';
import { SIZE } from './layout.ts';
import { addNature } from './nature.ts';
import { addTerrain } from './terrain.ts';

export const ISLAND_WIDTH = SIZE * BLOCK;

export function buildIsland(scene: Scene): { root: Group; centre: Vector3 } {
  const root = new Group();
  root.name = 'floating-island';
  addTerrain(root);
  addNature(root);
  scene.add(root);
  return { root, centre: new Vector3(0, 0.2, 0) };
}
