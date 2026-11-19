/**
 * The floating island: 14 × 14 blocks of 43 cm. Terrain (grass, dirt, bedrock
 * diamond underneath) plus nature (pond, tree with roots, bush, rock,
 * flowers). Built from clean layers: grid → rulebook → blocks/merged →
 * world (draw, solid, check) → layout → terrain/nature → parts.
 */

import { Group, type Scene, Vector3 } from 'three';
import { BLOCK } from '../grid.ts';
import { drawWorld } from '../world.ts';
import { SIZE } from './layout.ts';
import { islandParts } from './parts.ts';

export const ISLAND_WIDTH = SIZE * BLOCK;

export function buildIsland(scene: Scene): { root: Group; centre: Vector3 } {
  const root = new Group();
  root.name = 'floating-island';
  drawWorld(root, islandParts());
  scene.add(root);
  return { root, centre: new Vector3(0, 0.2, 0) };
}
