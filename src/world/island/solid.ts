/**
 * The island as solid ground for movement, straight from its parts and the
 * rulebook: every solid block is a full cube. Flowers are walk-through; the
 * pond water is swum in (not solid), its floor is the dirt one block down.
 */

import type { VoxelWorld } from '../collision.ts';
import { solidWorld } from '../world.ts';
import { islandParts } from './parts.ts';

export function islandSolid(): VoxelWorld {
  return solidWorld(islandParts());
}
