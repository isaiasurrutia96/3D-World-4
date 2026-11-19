/**
 * THE BLOCK RULEBOOK. Every block in the game, one entry each, exactly as
 * approved by the owner card by card (19 Nov 2026, docs/WORLD-RULES.md).
 * Every world, built by Claude or Codex, uses only these blocks and passes
 * the world checker (checker.ts).
 *
 * Adding a block: the owner approves its card first, then it gets an entry
 * here and a line in docs/WORLD-RULES.md. Nothing else may invent a block.
 *
 * Feel numbers (walking speed, kart grip and speed, ball roll and bounce) are
 * left null ("not set yet"). Each block gets them, with the owner's approval,
 * when the game that uses it is built. The `feel` text says what was approved.
 */

import { BLOCK, SMALL, TINY } from './grid.ts';

/** The three block sizes on the one grid. */
export type Size = 'big' | 'half' | 'quarter';
export const SIZE_METRES: Record<Size, number> = { big: BLOCK, half: SMALL, quarter: TINY };
export const ALL_SIZES: readonly Size[] = ['big', 'half', 'quarter'];

/** cube; wedge (triangle ramp); smooth (a smooth surface laid over blocks). */
export type Shape = 'cube' | 'wedge' | 'smooth';
const ALL_SHAPES: readonly Shape[] = ['cube', 'wedge', 'smooth'];

/**
 * How it is drawn:
 *  merged    one solid shape, rounded only on outside edges and corners
 *  separate  every block its own rounded cube
 *  flower    the approved flower look (merged parts with edge cores), unchanged
 *  water     one flat see-through surface
 */
export type Style = 'merged' | 'separate' | 'flower' | 'water';

/**
 * How it meets bodies:
 *  solid         stands on it, cannot pass through
 *  walk-through  passes through
 *  swim          sinks in and swims
 *  choice        solid or walk-through, chosen when placed (decor)
 */
export type Body = 'solid' | 'walk-through' | 'swim' | 'choice';

/** Feel numbers. null = not set yet (set with the owner when its game is built). */
export interface Feel {
  /** Walking and running speed, as a share of normal (1). */
  walk: number | null;
  /** Kart grip, as a share of road (1). */
  kartGrip: number | null;
  /** Kart top speed, as a share of road (1). */
  kartSpeed: number | null;
  /** How far a ball rolls, as a share of green (1). */
  ballRoll: number | null;
  /** How high a ball bounces back, as a share of the height it fell from. */
  ballBounce: number | null;
}

/** What touching it does. */
export interface Hazard {
  /** Touching it bumps him away (lava strongly, cactus mildly). */
  touch: 'none' | 'bump';
  /** Falling into it respawns him (and a kart) at the last safe spot. */
  fallIn: 'none' | 'respawn';
  /** Landing directly on top of it kills him. */
  landOnTop: 'none' | 'die';
}

/** Extra settings only some blocks have (colour, paint and bouncy are universal). */
export type OwnSetting = 'current' | 'falling-current' | 'solid-choice';

export interface BlockRule {
  name: string;
  usedFor: string;
  /** Default colour. Every block can be any colour (universal setting). */
  colour: string;
  style: Style;
  sizes: readonly Size[];
  shapes: readonly Shape[];
  body: Body;
  /** He can climb it and hang from its edges. */
  climbable: boolean;
  hazard: Hazard;
  ownSettings: readonly OwnSetting[];
  /** What the owner approved about how it feels, in words. */
  feel: string;
  numbers: Feel;
}

/** Settings every block has: any colour, a painted design, bouncy. */
export const UNIVERSAL_SETTINGS = ['colour', 'paint', 'bouncy'] as const;
/** Bouncy never launches karts upward (owner's rule). */
export const KARTS_BOUNCE_UP = false;

const NOT_SET: Feel = Object.freeze({ walk: null, kartGrip: null, kartSpeed: null, ballRoll: null, ballBounce: null });
const SAFE: Hazard = Object.freeze({ touch: 'none', fallIn: 'none', landOnTop: 'none' });

type Entry = Omit<BlockRule, 'numbers' | 'hazard' | 'ownSettings' | 'climbable'> & Partial<Pick<BlockRule, 'hazard' | 'ownSettings' | 'climbable'>>;
const block = (e: Entry): BlockRule => Object.freeze({
  hazard: SAFE, ownSettings: [], climbable: e.body === 'solid' || e.body === 'choice', ...e, numbers: NOT_SET,
});

export const BLOCKS = Object.freeze({
  grass: block({
    name: 'Grass', usedFor: 'the main ground on every island', colour: '#93d91e',
    style: 'merged', sizes: ['big'], shapes: ALL_SHAPES, body: 'solid',
    feel: 'normal walk; karts slower than dirt and slippery; balls roll slow and short',
  }),
  dirt: block({
    name: 'Dirt', usedFor: 'under grass, pond floors, rally sections', colour: '#da965a',
    style: 'merged', sizes: ['big'], shapes: ALL_SHAPES, body: 'solid',
    feel: 'normal walk; karts grip better and go faster than on grass (rally), slower than road; balls roll slowly',
  }),
  sand: block({
    name: 'Sand', usedFor: 'beaches, golf bunkers, long-jump pit, under water', colour: '#ecd9a0',
    style: 'merged', sizes: ['big'], shapes: ALL_SHAPES, body: 'solid',
    feel: 'walk and run very slightly slower; karts very slow, slide a lot; balls barely roll',
  }),
  bedrock: block({
    name: 'Bedrock', usedFor: 'the stone under every island', colour: '#8f8a84',
    style: 'merged', sizes: ['big'], shapes: ['cube'], body: 'solid',
    feel: 'one colour; rarely touched',
  }),
  concrete: block({
    name: 'Concrete', usedFor: 'the universal building block: track sides and curbs, sidewalks, parking lots, outdoor courts, walls, signs, poles, hoops, bridges, arches, rails',
    colour: '#c9c6c0', style: 'merged', sizes: ALL_SIZES, shapes: ALL_SHAPES, body: 'solid',
    feel: 'normal walk; karts full grip and speed; balls bounce well, roll far',
  }),
  water: block({
    name: 'Water', usedFor: 'ponds, lakes, the lazy river (also through tunnels), diving pool, golf hazards', colour: '#3f9fd6',
    style: 'water', sizes: ALL_SIZES, shapes: ['cube'], body: 'swim', climbable: false,
    ownSettings: ['current', 'falling-current'],
    feel: 'swims slower than walking; underwater view: shades of blue with bubbles; a kart respawns; a golf ball is out; other balls float',
  }),
  ice: block({
    name: 'Ice', usedFor: 'frozen ponds, skating rink and race, tricky spots in mini golf', colour: '#cfeaf4',
    style: 'merged', sizes: ALL_SIZES, shapes: ALL_SHAPES, body: 'solid',
    feel: 'he slides (glides fast on skates); karts slide a lot; balls glide far',
  }),
  snow: block({
    name: 'Snow', usedFor: 'ski slopes, snowy ground', colour: '#f2f6fa',
    style: 'merged', sizes: ALL_SIZES, shapes: ALL_SHAPES, body: 'solid',
    feel: 'walk and run a bit slower; skis glide fast, push with poles; karts slow, slide (less than ice); balls barely roll',
  }),
  road: block({
    name: 'Road', usedFor: 'race tracks and free-roam roads (start/finish is road painted checkered)', colour: '#4a4d52',
    style: 'merged', sizes: ALL_SIZES, shapes: ALL_SHAPES, body: 'solid',
    feel: 'karts: most grip, fastest; balls roll far; sounds as concrete',
  }),
  fairway: block({
    name: 'Fairway', usedFor: 'full golf, frisbee golf, sports fields (with painted lines)', colour: '#6fbf2a',
    style: 'merged', sizes: ['big'], shapes: ALL_SHAPES, body: 'solid',
    feel: 'like grass, but balls roll farther and smoother',
  }),
  green: block({
    name: 'Green', usedFor: 'putting surface; the whole mini-golf course', colour: '#7ad13a',
    style: 'merged', sizes: ['big'], shapes: ALL_SHAPES, body: 'solid',
    feel: 'balls roll smoothest and farthest',
  }),
  'green-cup': block({
    name: 'Green with cup', usedFor: 'the golf cup (10.75 cm hole in the centre of a green block)', colour: '#7ad13a',
    style: 'merged', sizes: ['big'], shapes: ['cube'], body: 'solid',
    feel: 'as green; a slow ball drops in, a fast one can skip over',
  }),
  'bowling-lane': block({
    name: 'Bowling lane', usedFor: 'bowling lanes and approach; maybe skee-ball', colour: '#e3c08d',
    style: 'merged', sizes: ALL_SIZES, shapes: ['cube'], body: 'solid',
    feel: 'he can slide a little at the line; balls glide with almost no slowing',
  }),
  'court-floor': block({
    name: 'Court floor', usedFor: 'indoor basketball courts', colour: '#d9a35b',
    style: 'merged', sizes: ALL_SIZES, shapes: ['cube'], body: 'solid',
    feel: 'good grip; karts full grip; highest ball bounce',
  }),
  rock: block({
    name: 'Rock', usedFor: 'boulders, obstacle course, canyon and volcanic rock (by colour)', colour: '#9a958d',
    style: 'separate', sizes: ALL_SIZES, shapes: ['cube'], body: 'solid',
    feel: 'solid boulders',
  }),
  trunk: block({
    name: 'Tree trunk', usedFor: 'trunks, branches, logs', colour: '#7a5434',
    style: 'merged', sizes: ALL_SIZES, shapes: ['cube', 'wedge'], body: 'solid',
    feel: 'solid, climbable; wedges for flared bases and angled branches, sparingly',
  }),
  roots: block({
    name: 'Roots', usedFor: 'roots spreading from tree trunks, each block on its own (not merged)', colour: '#7a5434',
    style: 'separate', sizes: ['quarter'], shapes: ['cube'], body: 'solid',
    feel: 'low steps at the base of a tree he walks up without jumping; balls bounce off',
  }),
  leaves: block({
    name: 'Leaves', usedFor: 'tree tops and bushes, any colour (fall, cherry blossom)', colour: '#47ad35',
    style: 'separate', sizes: ALL_SIZES, shapes: ['cube'], body: 'solid',
    feel: 'climb and stand on; balls bounce off',
  }),
  flower: block({
    name: 'Flower', usedFor: 'flowers on grass (stem, centre, petals), kept exactly as approved', colour: '#3e8f2c',
    style: 'flower', sizes: ['quarter'], shapes: ['cube'], body: 'walk-through',
    feel: 'walk through; karts and balls pass through',
  }),
  decor: block({
    name: 'Decor', usedFor: 'small details: tufts, mushrooms, pebbles, lights, lily pads, vines', colour: '#ffffff',
    style: 'separate', sizes: ['half', 'quarter'], shapes: ['cube', 'wedge'], body: 'choice',
    ownSettings: ['solid-choice'],
    feel: 'solid ones behave like concrete; walk-through ones let everything pass',
  }),
  gravel: block({
    name: 'Gravel', usedFor: 'rally sections, cart paths, trails', colour: '#9b9182',
    style: 'merged', sizes: ['big'], shapes: ALL_SHAPES, body: 'solid',
    feel: 'karts slower than dirt, slide more; balls stop fast',
  }),
  wood: block({
    name: 'Wood', usedFor: 'bridges, docks, huts, fences, wooden curbs', colour: '#a87a4f',
    style: 'merged', sizes: ALL_SIZES, shapes: ['cube', 'wedge'], body: 'solid',
    feel: 'normal walk; karts full grip; balls bounce',
  }),
  glass: block({
    name: 'Glass', usedFor: 'windows, greenhouses, display cases', colour: '#dff3ff',
    style: 'merged', sizes: ALL_SIZES, shapes: ['cube'], body: 'solid',
    feel: 'see-through, any tint',
  }),
  lava: block({
    name: 'Lava', usedFor: 'volcano islands', colour: '#ff6a1a',
    style: 'merged', sizes: ALL_SIZES, shapes: ALL_SHAPES, body: 'solid', climbable: false,
    hazard: { touch: 'bump', fallIn: 'respawn', landOnTop: 'none' },
    feel: 'glowing; touching bumps him away; falling in respawns him (kart too); balls are lost',
  }),
  cactus: block({
    name: 'Cactus', usedFor: 'desert and canyon islands', colour: '#4f9a3a',
    style: 'separate', sizes: ['half', 'quarter'], shapes: ['cube'], body: 'solid', climbable: false,
    hazard: { touch: 'bump', fallIn: 'none', landOnTop: 'die' },
    feel: 'touching bumps him back; landing directly on top kills him',
  }),
  cloud: block({
    name: 'Cloud', usedFor: 'high, hard-to-reach spots (secret ramps, drop-offs)', colour: '#ffffff',
    style: 'separate', sizes: ['big', 'half'], shapes: ['cube'], body: 'solid',
    feel: 'stand on it; grab its edge to hang and pull up; balls bounce softly',
  }),
} satisfies Record<string, BlockRule>);

export type BlockId = keyof typeof BLOCKS;
export const BLOCK_IDS = Object.keys(BLOCKS) as BlockId[];
export const isBlock = (id: string): id is BlockId => Object.prototype.hasOwnProperty.call(BLOCKS, id);

/** The size name for a block size in metres, or null if it is not one of the three. */
export function sizeName(metres: number): Size | null {
  for (const s of ALL_SIZES) if (Math.abs(SIZE_METRES[s] - metres) < 1e-9) return s;
  return null;
}
