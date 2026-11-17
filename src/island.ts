/**
 * A tiny floating island, 14 × 14 blocks of 43 cm: one layer of grass on
 * top, two layers of dirt, then a stone underside shaped like a perfect
 * upside-down diamond, flat on top. Each material merges into one shape,
 * rounded only on its outside edges. On top: a pond, a tree, a bush, a rock
 * and three flowers.
 */

import { Color, Group, Scene, Vector3 } from 'three';
import { BLOCK, addBlocks, addMergedBlocks } from './voxels.ts';
import { Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';

const SIZE = 14;
const GRASS = '#93d91e';
const DIRT = '#da965a';
const STONE = '#8f8a84';

/**
 * THE BUILD RULE. Every material is set once and behaves the same everywhere:
 *  - 'merged': anything large and flat (grass, dirt) or a big, regular,
 *    perfectly shaped object (tree trunk) is one solid shape, rounded only on
 *    its outside edges.
 *  - 'blocks': natural detail (stone, rock, leaves, bush) shows every block
 *    as its own rounded cube.
 * New materials get a setting here when they are added to the world.
 * (Flowers are built separately and are left exactly as approved.)
 */
const MATERIAL_STYLE: Record<string, 'merged' | 'blocks'> = {
  grass: 'merged',
  dirt: 'merged',
  'tree-trunk': 'merged',
  stone: 'blocks',
  rock: 'blocks',
  'tree-leaves': 'blocks',
  'tree-roots': 'blocks',
  bush: 'blocks',
};

function build(
  root: Group, list: Array<[number, number, number, string]>, material: string, size = BLOCK,
  restsOn?: (x: number, y: number, z: number) => boolean,
): void {
  if (MATERIAL_STYLE[material] === 'blocks') addBlocks(root, list, material, size);
  else addMergedBlocks(root, list, material, size, restsOn);
}

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
      if (!isPond(x, z)) grass.push([x, 0, z, grassColour(x, z)]);
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

  build(root, grass, 'grass');
  build(root, dirt, 'dirt');
  build(root, stone, 'stone');
  addNature(root);
  scene.add(root);
  return { root, centre: new Vector3(0, 0.2, 0) };
}

export const ISLAND_WIDTH = SIZE * BLOCK;

// ---------------------------------------------------------------------------
// Nature: a pond (cut into the grass), a tree, a bush, a rock and flowers.
// Tree leaves, the trunk, the bush and the rock use 21.5 cm blocks (half the
// 43 cm terrain block); flowers use 10.75 cm blocks. Everything sits on the
// same grid, so every piece lines up with the terrain blocks.
// ---------------------------------------------------------------------------

const SMALL = BLOCK / 2; // 21.5 cm
const TINY = BLOCK / 4; // 10.75 cm
/** Height of the grass top, in small and tiny block steps. */
const TOP_SMALL = 2;
const TOP_TINY = 4;

/** The pond: a rounded 4 × 3 patch of terrain cells at the front right. */
function isPond(x: number, z: number): boolean {
  const inBox = x >= 2 && x <= 5 && z >= 1 && z <= 3;
  const corner = (x === 2 || x === 5) && (z === 1 || z === 3);
  return inBox && !corner;
}

type Cell = [number, number, number, string];

/** Below the grass top (in small-block steps) is solid ground to sit on. */
const onGround = (_x: number, y: number): boolean => y < TOP_SMALL;

function addNature(root: Group): void {
  // ---- Pond water, a little below the grass top ----
  const water = new MeshStandardMaterial({
    color: '#3f9fd6', roughness: 0.15, metalness: 0, transparent: true, opacity: 0.82,
  });
  for (let x = 2; x <= 5; x++) {
    for (let z = 1; z <= 3; z++) {
      if (!isPond(x, z)) continue;
      const tile = new Mesh(new PlaneGeometry(BLOCK, BLOCK), water);
      tile.rotation.x = -Math.PI / 2;
      tile.position.set((x + 0.5) * BLOCK, BLOCK * 0.72, (z + 0.5) * BLOCK);
      tile.name = 'pond-water';
      root.add(tile);
    }
  }

  // ---- Tree: trunk 2 × 2 small blocks (43 cm wide), leafy crown on top ----
  const trunk: Cell[] = [];
  const leaves: Cell[] = [];
  const tx = -7; // small-block grid: back left of the island
  const tz = -7;
  const trunkTop = TOP_SMALL + 7;
  for (let y = TOP_SMALL; y < trunkTop; y++) {
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) trunk.push([tx + dx, y, tz + dz, '#7a5434']);
  }
  const cx = tx + 1;
  const cz = tz + 1;
  const cy = trunkTop + 1.5;
  for (let x = cx - 5; x <= cx + 4; x++) {
    for (let y = trunkTop - 2; y <= trunkTop + 5; y++) {
      for (let z = cz - 5; z <= cz + 4; z++) {
        const d = Math.hypot((x + 0.5 - cx) / 4.6, (y + 0.5 - cy) / 3.6, (z + 0.5 - cz) / 4.6);
        const nibble = hash(x * 3.1 + y, z * 1.7 - y) * 0.22;
        const inTrunk = y < trunkTop && x >= tx && x <= tx + 1 && z >= tz && z <= tz + 1;
        if (d + nibble <= 1.02 && !inTrunk) leaves.push([x, y, z, hash(x + 9, z + y * 5) < 0.12 ? '#3d9a2e' : '#47ad35']);
      }
    }
  }
  build(root, trunk, 'tree-trunk', SMALL, onGround);

  // Root stumps: 10.75 cm blocks, 6 each as a 3-2-1 staircase stepping away
  // from the trunk, two on each side, each next to a corner of the trunk.
  const roots: Cell[] = [];
  const x0 = tx * 2, x1 = tx * 2 + 3, z0 = tz * 2, z1 = tz * 2 + 3; // trunk in tiny cells
  const stair = (x: number, z: number, dx: number, dz: number): void => {
    for (let step = 0; step < 3; step++) {
      for (let h = 0; h < 3 - step; h++) {
        roots.push([x + dx * step, TOP_TINY + h, z + dz * step, '#7a5434']);
      }
    }
  };
  for (const z of [z0, z1]) { stair(x0 - 1, z, -1, 0); stair(x1 + 1, z, 1, 0); }
  for (const x of [x0, x1]) { stair(x, z0 - 1, 0, -1); stair(x, z1 + 1, 0, 1); }
  build(root, roots, 'tree-roots', TINY, (_x, y) => y < TOP_TINY);
  build(root, leaves, 'tree-leaves', SMALL);

  // ---- Bush: a small rounded mound of leafy small blocks, back right ----
  const bush: Cell[] = [];
  const bx = 7;
  const bz = -8;
  for (let x = bx - 2; x <= bx + 2; x++) {
    for (let y = TOP_SMALL; y <= TOP_SMALL + 2; y++) {
      for (let z = bz - 2; z <= bz + 2; z++) {
        const d = Math.hypot((x + 0.5 - (bx + 0.5)) / 2.6, (y - TOP_SMALL + 0.3) / 2.4, (z + 0.5 - (bz + 0.5)) / 2.3);
        if (d <= 1) bush.push([x, y, z, '#3f9c32']);
      }
    }
  }
  build(root, bush, 'bush', SMALL, onGround);

  // ---- Rock: a lumpy grey cluster of small blocks, front left ----
  const rock: Cell[] = [];
  const rockShape: Array<[number, number, number]> = [
    [0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 0, 1], [1, 0, 1], [2, 0, 1], [1, 0, 2], [3, 0, 1],
    [0, 1, 0], [1, 1, 0], [1, 1, 1], [2, 1, 1], [1, 2, 1],
  ];
  for (const [dx, dy, dz] of rockShape) rock.push([-9 + dx, TOP_SMALL + dy, 6 + dz, '#9a958d']);
  build(root, rock, 'rock', SMALL, onGround);

  // ---- Flowers: three small flowers near the middle, in tiny blocks ----
  const stems: Cell[] = [];
  const petals: Cell[] = [];
  const centres: Cell[] = [];
  const flowers: Array<[number, number, string]> = [
    [-2, 3, '#e8475f'], [1, 5, '#f4f1ea'], [-4, 7, '#9a6ee0'],
  ];
  for (const [fx, fz, colour] of flowers) {
    for (let y = TOP_TINY; y < TOP_TINY + 3; y++) stems.push([fx, y, fz, '#3e8f2c']);
    const head = TOP_TINY + 3;
    centres.push([fx, head, fz, '#f2c230']);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) petals.push([fx + dx, head, fz + dz, colour]);
  }
  addMergedBlocks(root, stems, 'flower-stems', TINY, (_x, y) => y < TOP_TINY, true);
  addMergedBlocks(root, centres, 'flower-centres', TINY, undefined, true);
  // Each petal is its own group so neighbouring flowers never merge.
  addMergedBlocks(root, petals, 'flower-petals', TINY, undefined, true);
}
