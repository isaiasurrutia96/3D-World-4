/**
 * The island as solid ground for movement. Every block is a full cube.
 * Solid: grass, dirt, stone, trunk, roots, leaves, bush, rock.
 * Not solid: flowers (you walk through them) and the pond water (the pond is
 * a hole in the grass; its floor is the dirt one block down).
 */

import { BLOCK, SMALL, TINY } from '../grid.ts';
import { VoxelWorld } from '../collision.ts';
import { natureCells } from './nature.ts';
import { terrainCells } from './terrain.ts';

export function islandSolid(): VoxelWorld {
  const t = terrainCells(), n = natureCells(), world = new VoxelWorld();
  world.add(t.grass, BLOCK, 'grass');
  world.add(t.dirt, BLOCK, 'dirt');
  world.add(t.stone, BLOCK, 'stone');
  world.add(n.trunk, SMALL, 'tree-trunk');
  world.add(n.leaves, SMALL, 'tree-leaves');
  world.add(n.bush, SMALL, 'bush');
  world.add(n.rock, SMALL, 'rock');
  world.add(n.roots, TINY, 'tree-roots');
  return world;
}
