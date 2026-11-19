/**
 * A world is a list of parts. Each part is some cells of ONE rulebook block at
 * ONE size. The same list is drawn (drawWorld), turned into solid ground
 * (solidWorld) and checked (checker.ts), so what you see, what you stand on
 * and what is checked can never disagree.
 */

import { type Group, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';
import { addSeparateBlocks } from './blocks.ts';
import { VoxelWorld } from './collision.ts';
import type { Cell, Support } from './grid.ts';
import { addMergedBlocks } from './merged.ts';
import { BLOCKS, type BlockId, type Shape } from './rulebook.ts';

export interface Part {
  /** Which rulebook block. */
  block: BlockId;
  /** Block size in metres (one of the three grid sizes). */
  size: number;
  cells: Cell[];
  /** Mesh name (unique in the world). */
  name: string;
  /** Shape of every cell in this part. Default: cube. */
  shape?: Shape;
  /** Merged blocks: solid ground under them, so they sit flat and square on it. */
  restsOn?: Support;
  /** Merged blocks: edge rounding in metres, when one shape mixes sizes. */
  rounding?: number;
  /** Decor only: solid (true) or walk-through (false). Required for decor. */
  solid?: boolean;
  /** Water only: the surface height, as a share of one block. */
  level?: number;
}

/** Is this part solid ground (from the rulebook; decor from its own choice)? */
export function isSolid(part: Part): boolean {
  const body = BLOCKS[part.block].body;
  return body === 'solid' || (body === 'choice' && part.solid === true);
}

/** Draws every part in its block's one fixed style. */
export function drawWorld(root: Group, parts: Part[]): void {
  for (const part of parts) {
    const rule = BLOCKS[part.block];
    switch (rule.style) {
      case 'separate':
        addSeparateBlocks(root, part.cells, part.name, part.size);
        break;
      case 'merged':
        addMergedBlocks(root, part.cells, part.name, part.size, { restsOn: part.restsOn, rounding: part.rounding });
        break;
      case 'flower':
        addMergedBlocks(root, part.cells, part.name, part.size, { restsOn: part.restsOn, edgeCores: true });
        break;
      case 'water':
        addWater(root, part);
        break;
    }
  }
}

/** Water: one flat see-through tile per cell, at the part's surface level. */
function addWater(root: Group, part: Part): void {
  const water = new MeshStandardMaterial({ color: BLOCKS.water.colour, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.82 });
  const level = part.level ?? 1;
  for (const [x, y, z] of part.cells) {
    const tile = new Mesh(new PlaneGeometry(part.size, part.size), water);
    tile.rotation.x = -Math.PI / 2;
    tile.position.set((x + 0.5) * part.size, (y + level) * part.size, (z + 0.5) * part.size);
    tile.name = part.name;
    root.add(tile);
  }
}

/** Solid ground for movement: every solid part, as full cubes. */
export function solidWorld(parts: Part[]): VoxelWorld {
  const world = new VoxelWorld();
  for (const part of parts) if (isSolid(part)) world.add(part.cells, part.size, part.block);
  return world;
}
