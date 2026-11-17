/**
 * THE BUILD RULE. Every material is set once and behaves the same everywhere:
 *  - 'merged': anything large and flat (grass, dirt) or a big, regular,
 *    perfectly shaped object (tree trunk) is one solid shape, rounded only
 *    on its outside edges.
 *  - 'blocks': natural detail (stone, rock, leaves, bush, roots) shows every
 *    block as its own rounded cube.
 * New materials get an entry here when they are added to the world.
 * Flowers are their own case (merged with edge cores) and are left exactly
 * as approved.
 */

import type { Group } from 'three';
import { addSeparateBlocks } from './blocks.ts';
import { BLOCK, type Cell, type Support } from './grid.ts';
import { addMergedBlocks } from './merged.ts';

export type Material = 'grass' | 'dirt' | 'stone' | 'tree-trunk' | 'tree-leaves' | 'tree-roots' | 'bush' | 'rock';

export const MATERIAL_STYLE: Record<Material, 'merged' | 'blocks'> = {
  grass: 'merged',
  dirt: 'merged',
  'tree-trunk': 'merged',
  stone: 'blocks',
  rock: 'blocks',
  'tree-leaves': 'blocks',
  'tree-roots': 'blocks',
  bush: 'blocks',
};

export const COLOURS = {
  grass: '#93d91e',
  dirt: '#da965a',
  stone: '#8f8a84',
  wood: '#7a5434',
  leaf: '#47ad35',
  leafDark: '#3d9a2e',
  bush: '#3f9c32',
  rock: '#9a958d',
  stem: '#3e8f2c',
  flowerCentre: '#f2c230',
  water: '#3f9fd6',
} as const;

/** Builds a material's cells in that material's fixed style. */
export function build(root: Group, cells: Cell[], material: Material, size = BLOCK, restsOn?: Support): void {
  if (MATERIAL_STYLE[material] === 'blocks') addSeparateBlocks(root, cells, material, size);
  else addMergedBlocks(root, cells, material, size, { restsOn });
}
