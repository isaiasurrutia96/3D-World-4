/**
 * The world grid. Every piece of the world is made of cubes on one grid:
 * terrain blocks are 43 cm; detail uses half (21.5 cm) and quarter
 * (10.75 cm) blocks that line up exactly with them.
 *
 * A cell [x, y, z] spans x..x+1 (in its own block size) on each axis.
 */

export const BLOCK = 0.43;
export const SMALL = BLOCK / 2;
export const TINY = BLOCK / 4;

/** Edge rounding of a 43 cm block, in metres; smaller blocks scale it down. */
export const ROUNDING = 0.035;

/** A cell: grid position plus its colour (hex string). */
export type Cell = [x: number, y: number, z: number, colour: string];

/** Something solid a group of blocks can sit on (in that group's grid). */
export type Support = (x: number, y: number, z: number) => boolean;

export const cellKey = (x: number, y: number, z: number): string => `${x},${y},${z}`;

/** A fixed pseudo-random number 0..1 for a grid spot, the same every time. */
export function hash(x: number, z: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** A fixed brightness 0.92..1.08 per block, so separate blocks read apart. */
export function shade(x: number, y: number, z: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return 0.92 + (s - Math.floor(s)) * 0.16;
}
