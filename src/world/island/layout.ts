/**
 * Island layout: the fixed plan every part is placed from. Positions are in
 * terrain blocks (43 cm) unless named otherwise.
 */

/** The island is 14 × 14 terrain blocks, centred on the origin (-7..6). */
export const SIZE = 14;
export const HALF = SIZE / 2;

/** Height of the main grass top: 1 block, i.e. 2 small or 4 tiny steps. */
export const TOP_SMALL = 2;
export const TOP_TINY = 4;

/** The raised corner under the tree: 5 × 5 blocks at the back left, 1 block up. */
export const isRaised = (x: number, z: number): boolean => x <= -3 && z <= -3;
export const RAISED_SMALL = TOP_SMALL + 2;
export const RAISED_TINY = TOP_TINY + 4;

/** The pond: a rounded 4 × 3 patch at the front right, cut into the grass. */
export function isPond(x: number, z: number): boolean {
  const inBox = x >= 2 && x <= 5 && z >= 1 && z <= 3;
  const corner = (x === 2 || x === 5) && (z === 1 || z === 3);
  return inBox && !corner;
}
/** Pond water surface, as a share of a block above y = 0. */
export const WATER_LEVEL = 0.72;

/** Tree trunk: 2 × 2 small blocks, its back-left cell here (small grid). */
export const TRUNK = { x: -8, z: -8, height: 7 };
/** Bush centre (small grid), back right. */
export const BUSH = { x: 7, z: -8 };
/** Rock origin (small grid), front left. */
export const ROCK = { x: -9, z: 6 };
/** Flowers (tiny grid): position and petal colour. */
export const FLOWERS: Array<[x: number, z: number, petal: string]> = [
  [-2, 3, '#e8475f'], [1, 5, '#f4f1ea'], [-4, 7, '#9a6ee0'],
];
