/**
 * Island nature: the pond water, a tree (trunk, root stumps, leaves), a bush,
 * a rock and three flowers. Trunk, leaves, bush and rock use half blocks
 * (21.5 cm); roots and flowers use quarter blocks (10.75 cm). All sit on the
 * same grid as the terrain. Roots are their own separate blocks; the bush is leaves.
 */

import { hash, type Cell } from '../grid.ts';
import { COLOURS } from '../materials.ts';
import { BUSH, FLOWERS, RAISED_SMALL, RAISED_TINY, ROCK, TOP_SMALL, TOP_TINY, TRUNK, isPond } from './layout.ts';

export interface Nature {
  trunk: Cell[]; roots: Cell[]; leaves: Cell[]; bush: Cell[]; rock: Cell[];
  stems: Cell[]; centres: Cell[]; petals: Cell[]; pond: Cell[];
}

/** Tree: a 2 × 2 trunk on the raised corner, crowned with leaves. */
function tree(): Pick<Nature, 'trunk' | 'roots' | 'leaves'> {
  const { x: tx, z: tz, height } = TRUNK;
  const top = RAISED_SMALL + height;
  const trunk: Cell[] = [];
  for (let y = RAISED_SMALL; y < top; y++) {
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) trunk.push([tx + dx, y, tz + dz, COLOURS.wood]);
  }

  // Leaves: a slightly squashed ball with a nibbled edge, never inside the trunk.
  const leaves: Cell[] = [];
  const cx = tx + 1, cz = tz + 1, cy = top + 1.5;
  for (let x = cx - 5; x <= cx + 4; x++) {
    for (let y = top - 2; y <= top + 5; y++) {
      for (let z = cz - 5; z <= cz + 4; z++) {
        const d = Math.hypot((x + 0.5 - cx) / 4.6, (y + 0.5 - cy) / 3.6, (z + 0.5 - cz) / 4.6);
        const nibble = hash(x * 3.1 + y, z * 1.7 - y) * 0.22;
        const inTrunk = y < top && x >= tx && x <= tx + 1 && z >= tz && z <= tz + 1;
        if (d + nibble <= 1.02 && !inTrunk) leaves.push([x, y, z, hash(x + 9, z + y * 5) < 0.12 ? COLOURS.leafDark : COLOURS.leaf]);
      }
    }
  }

  // Root stumps: 6 tiny blocks each, a 3-2-1 staircase stepping away from the
  // trunk; two on each side, each beside a corner of the trunk.
  const roots: Cell[] = [];
  const x0 = tx * 2, x1 = tx * 2 + 3, z0 = tz * 2, z1 = tz * 2 + 3; // trunk in tiny cells
  const stair = (x: number, z: number, dx: number, dz: number): void => {
    for (let step = 0; step < 3; step++) {
      for (let h = 0; h < 3 - step; h++) roots.push([x + dx * step, RAISED_TINY + h, z + dz * step, COLOURS.wood]);
    }
  };
  for (const z of [z0, z1]) { stair(x0 - 1, z, -1, 0); stair(x1 + 1, z, 1, 0); }
  for (const x of [x0, x1]) { stair(x, z0 - 1, 0, -1); stair(x, z1 + 1, 0, 1); }
  return { trunk, roots, leaves };
}

/** Bush: a small rounded mound, back right. */
function bush(): Cell[] {
  const cells: Cell[] = [];
  const { x: bx, z: bz } = BUSH;
  for (let x = bx - 2; x <= bx + 2; x++) {
    for (let y = TOP_SMALL; y <= TOP_SMALL + 2; y++) {
      for (let z = bz - 2; z <= bz + 2; z++) {
        const d = Math.hypot((x + 0.5 - (bx + 0.5)) / 2.6, (y - TOP_SMALL + 0.3) / 2.4, (z + 0.5 - (bz + 0.5)) / 2.3);
        if (d <= 1) cells.push([x, y, z, COLOURS.bush]);
      }
    }
  }
  return cells;
}

/** Rock: a lumpy cluster, front left. */
const ROCK_SHAPE: Array<[number, number, number]> = [
  [0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 0, 1], [1, 0, 1], [2, 0, 1], [1, 0, 2], [3, 0, 1],
  [0, 1, 0], [1, 1, 0], [1, 1, 1], [2, 1, 1], [1, 2, 1],
];
const rock = (): Cell[] => ROCK_SHAPE.map(([dx, dy, dz]) => [ROCK.x + dx, TOP_SMALL + dy, ROCK.z + dz, COLOURS.rock]);

/** Flowers: a 3-block stem, a centre, and four petals around it. */
function flowers(): Pick<Nature, 'stems' | 'centres' | 'petals'> {
  const stems: Cell[] = [], centres: Cell[] = [], petals: Cell[] = [];
  for (const [fx, fz, colour] of FLOWERS) {
    for (let y = TOP_TINY; y < TOP_TINY + 3; y++) stems.push([fx, y, fz, COLOURS.stem]);
    const head = TOP_TINY + 3;
    centres.push([fx, head, fz, COLOURS.flowerCentre]);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) petals.push([fx + dx, head, fz + dz, colour]);
  }
  return { stems, centres, petals };
}

/** All nature cells, without drawing anything (so they can be checked). */
export function natureCells(): Nature {
  return { ...tree(), bush: bush(), rock: rock(), ...flowers(), pond: pond() };
}

/** Pond water: one big cell per pond spot, on the dirt floor one block down. */
function pond(): Cell[] {
  const cells: Cell[] = [];
  for (let x = 2; x <= 5; x++) for (let z = 1; z <= 3; z++) if (isPond(x, z)) cells.push([x, 0, z, COLOURS.water]);
  return cells;
}
