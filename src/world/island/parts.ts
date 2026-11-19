/**
 * The island as a world: a list of parts, each one rulebook block at one
 * size. Drawing, solid ground and the checker all use this one list.
 */

import { BLOCK, SMALL, TINY } from '../grid.ts';
import type { Part } from '../world.ts';
import { RAISED_SMALL, TOP_TINY, WATER_LEVEL } from './layout.ts';
import { natureCells } from './nature.ts';
import { terrainCells } from './terrain.ts';

export function islandParts(): Part[] {
  const t = terrainCells(), n = natureCells();
  return [
    { block: 'grass', size: BLOCK, cells: t.grass, name: 'grass' },
    { block: 'dirt', size: BLOCK, cells: t.dirt, name: 'dirt' },
    { block: 'bedrock', size: BLOCK, cells: t.bedrock, name: 'bedrock' },
    { block: 'water', size: BLOCK, cells: n.pond, name: 'pond-water', level: WATER_LEVEL },
    { block: 'trunk', size: SMALL, cells: n.trunk, name: 'tree-trunk', restsOn: (_x, y) => y < RAISED_SMALL },
    // Roots: their own block, each one separate (not merged with the trunk or each other).
    { block: 'roots', size: TINY, cells: n.roots, name: 'tree-roots' },
    { block: 'leaves', size: SMALL, cells: n.leaves, name: 'tree-leaves' },
    { block: 'leaves', size: SMALL, cells: n.bush, name: 'bush' },
    { block: 'rock', size: SMALL, cells: n.rock, name: 'rock' },
    { block: 'flower', size: TINY, cells: n.stems, name: 'flower-stems', restsOn: (_x, y) => y < TOP_TINY },
    { block: 'flower', size: TINY, cells: n.centres, name: 'flower-centres' },
    // Each petal group is its own mesh so neighbouring flowers never merge.
    { block: 'flower', size: TINY, cells: n.petals, name: 'flower-petals' },
  ];
}
