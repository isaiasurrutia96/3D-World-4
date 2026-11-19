/**
 * The island as a world: a list of parts, each one rulebook block at one
 * size. Drawing, solid ground and the checker all use this one list.
 */

import { BLOCK, ROUNDING, SMALL, TINY, type Cell } from '../grid.ts';
import type { Part } from '../world.ts';
import { RAISED_TINY, TOP_TINY, WATER_LEVEL } from './layout.ts';
import { natureCells } from './nature.ts';
import { terrainCells } from './terrain.ts';

/** A half-block cell as its 8 quarter cells (so roots can join the trunk). */
const toQuarter = (cells: Cell[]): Cell[] => cells.flatMap(([x, y, z, c]) => {
  const out: Cell[] = [];
  for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) for (let i = 0; i < 2; i++) out.push([x * 2 + i, y * 2 + j, z * 2 + k, c]);
  return out;
});

export function islandParts(): Part[] {
  const t = terrainCells(), n = natureCells();
  return [
    { block: 'grass', size: BLOCK, cells: t.grass, name: 'grass' },
    { block: 'dirt', size: BLOCK, cells: t.dirt, name: 'dirt' },
    { block: 'bedrock', size: BLOCK, cells: t.bedrock, name: 'bedrock' },
    { block: 'water', size: BLOCK, cells: n.pond, name: 'pond-water', level: WATER_LEVEL },
    // Trunk and roots: one merged shape, drawn in quarter cells, rounded like the trunk always was.
    {
      block: 'trunk', size: TINY, cells: [...toQuarter(n.trunk), ...n.roots], name: 'tree-trunk',
      restsOn: (_x, y) => y < RAISED_TINY, rounding: ROUNDING * (SMALL / BLOCK),
    },
    { block: 'leaves', size: SMALL, cells: n.leaves, name: 'tree-leaves' },
    { block: 'leaves', size: SMALL, cells: n.bush, name: 'bush' },
    { block: 'rock', size: SMALL, cells: n.rock, name: 'rock' },
    { block: 'flower', size: TINY, cells: n.stems, name: 'flower-stems', restsOn: (_x, y) => y < TOP_TINY },
    { block: 'flower', size: TINY, cells: n.centres, name: 'flower-centres' },
    // Each petal group is its own mesh so neighbouring flowers never merge.
    { block: 'flower', size: TINY, cells: n.petals, name: 'flower-petals' },
  ];
}
