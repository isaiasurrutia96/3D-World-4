/**
 * THE WORLD CHECKER. Every world (a list of parts, world.ts), built by Claude
 * or Codex, must pass it before it is used. It returns the problems found;
 * an empty list means the world follows every rule.
 *
 * Rules:
 *  1. known block     every part uses a block from the rulebook
 *  2. size            the block allows that size
 *  3. shape           the block allows that shape
 *  4. on the grid     every cell sits exactly on the grid
 *  5. colour          every cell has a valid colour
 *  6. decor choice    decor says solid or walk-through; nothing else does
 *  7. no overlap      no two blocks share the same space
 *  8. attached        every connected group of blocks touches bedrock (an
 *                     island), except groups made only of cloud
 *  9. solid matches   the solid ground is exactly the solid blocks you see:
 *                     solid where a solid block is, empty where a walk-through
 *                     or water block is
 *
 * Everything is compared on one fine grid of quarter cells (10.75 cm), so
 * all three block sizes line up.
 */

import { TINY } from './grid.ts';
import { BLOCKS, isBlock, sizeName } from './rulebook.ts';
import { type Part, isSolid, solidWorld } from './world.ts';

export interface Problem { rule: string; part: string; detail: string }

const HEX = /^#[0-9a-f]{6}$/i;
const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;

export function checkWorld(parts: Part[]): Problem[] {
  const problems: Problem[] = [];
  const report = (rule: string, part: Part, detail: string): void => { problems.push({ rule, part: part.name, detail }); };

  // ---- 1–6: each part on its own ----
  const valid: Part[] = [];
  for (const part of parts) {
    if (!isBlock(part.block)) { report('known block', part, `"${part.block}" is not in the rulebook`); continue; }
    const rule = BLOCKS[part.block];
    const size = sizeName(part.size);
    if (!size) { report('size', part, `${part.size} m is not one of the three grid sizes`); continue; }
    if (!rule.sizes.includes(size)) report('size', part, `${rule.name} allows ${rule.sizes.join(', ')}, not ${size}`);
    const shape = part.shape ?? 'cube';
    if (!rule.shapes.includes(shape)) report('shape', part, `${rule.name} allows ${rule.shapes.join(', ')}, not ${shape}`);
    const offGrid = part.cells.filter(([x, y, z]) => !Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z));
    if (offGrid.length) report('on the grid', part, `${offGrid.length} cell(s) off the grid, first at ${offGrid[0].slice(0, 3).join(', ')}`);
    const badColour = part.cells.filter((c) => !HEX.test(c[3]));
    if (badColour.length) report('colour', part, `${badColour.length} cell(s) with an invalid colour, first "${badColour[0][3]}"`);
    if (rule.body === 'choice' && typeof part.solid !== 'boolean') report('decor choice', part, 'decor must say solid: true or false');
    if (rule.body !== 'choice' && part.solid !== undefined) report('decor choice', part, `only decor chooses solid; ${rule.name} is always ${rule.body}`);
    if (!offGrid.length) valid.push(part);
  }

  // ---- 7: no overlap (fill the fine grid) ----
  const owner = new Map<string, Part>();
  const fine = (part: Part, visit: (fx: number, fy: number, fz: number) => void): void => {
    const n = Math.round(part.size / TINY);
    for (const [x, y, z] of part.cells) {
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) visit(x * n + i, y * n + j, z * n + k);
    }
  };
  const clashes = new Map<string, number>();
  for (const part of valid) {
    if (!sizeName(part.size)) continue;
    fine(part, (fx, fy, fz) => {
      const k = key(fx, fy, fz), other = owner.get(k);
      if (other) { const pair = `${other.name} + ${part.name}`; clashes.set(pair, (clashes.get(pair) ?? 0) + 1); } else owner.set(k, part);
    });
  }
  for (const [pair, count] of clashes) problems.push({ rule: 'no overlap', part: pair, detail: `${count} quarter cell(s) shared` });

  // ---- 8: attached (connected groups through face contact) ----
  const seen = new Set<string>();
  for (const [start] of owner) {
    if (seen.has(start)) continue;
    const group: string[] = [start];
    seen.add(start);
    const kinds = new Set<string>();
    const names = new Set<string>();
    for (let i = 0; i < group.length; i++) {
      const p = owner.get(group[i]) as Part;
      kinds.add(p.block); names.add(p.name);
      const [x, y, z] = group[i].split(',').map(Number);
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
        const k = key(x + dx, y + dy, z + dz);
        if (owner.has(k) && !seen.has(k)) { seen.add(k); group.push(k); }
      }
    }
    const cloudOnly = kinds.size === 1 && kinds.has('cloud');
    if (!kinds.has('bedrock') && !cloudOnly) {
      problems.push({ rule: 'attached', part: [...names].join(' + '), detail: `${group.length} quarter cell(s) float, touching no bedrock` });
    }
  }

  // ---- 9: solid ground matches the blocks ----
  const solid = solidWorld(valid.filter((p) => sizeName(p.size)));
  let wrongSolid = 0, wrongEmpty = 0;
  let firstWrong = '';
  for (const [k, part] of owner) {
    const [fx, fy, fz] = k.split(',').map(Number);
    const isThere = solid.solidAt((fx + 0.5) * TINY, (fy + 0.5) * TINY, (fz + 0.5) * TINY);
    const should = isSolid(part);
    if (should && !isThere) { wrongEmpty++; firstWrong ||= `${part.name} at ${k}`; }
    if (!should && isThere) { wrongSolid++; firstWrong ||= `${part.name} at ${k}`; }
  }
  if (wrongSolid + wrongEmpty) {
    problems.push({ rule: 'solid matches', part: '(world)', detail: `${wrongEmpty} solid cell(s) missing, ${wrongSolid} walk-through cell(s) solid; first: ${firstWrong}` });
  }
  return problems;
}
