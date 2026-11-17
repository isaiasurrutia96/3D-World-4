/**
 * Solid world for movement. Every block counts as a full square cube
 * (the rounded edges are only for looks). All block sizes are stored on one
 * fine grid of tiny cells (10.75 cm), so 43 cm and 21.5 cm blocks simply
 * fill 64 or 8 tiny cells.
 *
 * What it answers:
 *  - solidAt(x, y, z): is this point inside a solid block?
 *  - groundBelow(x, z, fromY): the top of the highest solid block under a
 *    point (and which material it is).
 *  - moveBox(...): moves a standing box (a character) by a step, sliding
 *    along walls, stepping up low ledges, landing on floors.
 */

import { TINY, type Cell } from './grid.ts';

const RES = TINY; // metres per collision cell
const key = (i: number, j: number, k: number): number => ((i + 4096) * 8192 + (j + 4096)) * 8192 + (k + 4096);

export interface GroundHit { y: number; material: string }
export interface Box { x: number; y: number; z: number } // feet centre
export interface MoveResult { x: number; y: number; z: number; onGround: boolean; hitWall: boolean; stepped: boolean; ground: string | null }

export class VoxelWorld {
  private readonly cells = new Map<number, string>();

  /** Adds blocks of one material. `size` is their block size in metres. */
  add(list: Cell[], size: number, material: string): void {
    const n = Math.round(size / RES);
    for (const [x, y, z] of list) {
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
        this.cells.set(key(x * n + i, y * n + j, z * n + k), material);
      }
    }
  }

  get size(): number { return this.cells.size; }

  /** Material of the tiny cell holding this point, or null if empty. */
  materialAt(x: number, y: number, z: number): string | null {
    return this.cells.get(key(Math.floor(x / RES), Math.floor(y / RES), Math.floor(z / RES))) ?? null;
  }
  solidAt(x: number, y: number, z: number): boolean { return this.materialAt(x, y, z) !== null; }

  /** Highest solid top at or below `fromY` under (x, z), searching down `reach` metres. */
  groundBelow(x: number, z: number, fromY: number, reach = 50): GroundHit | null {
    const i = Math.floor(x / RES), k = Math.floor(z / RES);
    const top = Math.floor((fromY - 1e-6) / RES), bottom = Math.floor((fromY - reach) / RES);
    for (let j = top; j >= bottom; j--) {
      const m = this.cells.get(key(i, j, k));
      if (m !== undefined) return { y: (j + 1) * RES, material: m };
    }
    return null;
  }

  /** True if any solid cell overlaps the box [min, max] (metres). */
  boxBlocked(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): boolean {
    const e = 1e-6;
    const i0 = Math.floor((minX + e) / RES), i1 = Math.floor((maxX - e) / RES);
    const j0 = Math.floor((minY + e) / RES), j1 = Math.floor((maxY - e) / RES);
    const k0 = Math.floor((minZ + e) / RES), k1 = Math.floor((maxZ - e) / RES);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) {
      if (this.cells.has(key(i, j, k))) return true;
    }
    return false;
  }

  /** Highest solid top under the whole footprint of a box, at or below fromY. */
  groundUnderBox(x: number, z: number, half: number, fromY: number, reach = 50): GroundHit | null {
    let best: GroundHit | null = null;
    const e = 1e-6;
    for (let i = Math.floor((x - half + e) / RES); i <= Math.floor((x + half - e) / RES); i++) {
      for (let k = Math.floor((z - half + e) / RES); k <= Math.floor((z + half - e) / RES); k++) {
        const hit = this.groundBelow((i + 0.5) * RES, (k + 0.5) * RES, fromY, reach);
        if (hit && (!best || hit.y > best.y)) best = hit;
      }
    }
    return best;
  }

  /**
   * Moves a standing box (feet centre at `from`, square footprint of
   * half-width `half`, `height` tall) by (dx, dy, dz). Horizontal moves
   * slide along walls one axis at a time and may step up ledges no higher
   * than `stepUp`; the vertical move lands on floors and stops at ceilings.
   */
  moveBox(from: Box, dx: number, dy: number, dz: number, half: number, height: number, stepUp: number): MoveResult {
    let { x, y, z } = from;
    let hitWall = false, stepped = false;
    const blocked = (px: number, py: number, pz: number): boolean =>
      this.boxBlocked(px - half, py, pz - half, px + half, py + height, pz + half);

    // Split long moves so a fast box can never pass through a thin block.
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / (RES * 0.5)));
    for (let s = 0; s < steps; s++) {
      for (const axis of ['x', 'z'] as const) {
        const d = (axis === 'x' ? dx : dz) / steps;
        if (d === 0) continue;
        const nx = axis === 'x' ? x + d : x, nz = axis === 'z' ? z + d : z;
        if (!blocked(nx, y, nz)) { x = nx; z = nz; continue; }
        // Low ledge: step up onto it if there is room above.
        const g = this.groundUnderBox(nx, nz, half, y + stepUp + 1e-4, stepUp + 1e-4);
        if (g && g.y > y && g.y - y <= stepUp + 1e-6 && !blocked(nx, g.y, nz)) { x = nx; z = nz; y = g.y; stepped = true; continue; }
        hitWall = true;
      }
    }

    // Vertical: land on the floor, or stop under a ceiling.
    let onGround = false, ground: string | null = null;
    if (dy <= 0) {
      const g = this.groundUnderBox(x, z, half, y + 1e-4, -dy + 0.02);
      if (g && g.y >= y + dy - 1e-6) { y = g.y; onGround = true; ground = g.material; }
      else y += dy;
    } else {
      // Rise in small steps, stopping just under any ceiling.
      const target = y + dy, inc = RES * 0.25;
      while (y < target) {
        const ny = Math.min(target, y + inc);
        if (blocked(x, ny, z)) break;
        y = ny;
      }
    }
    return { x, y, z, onGround, hitWall, stepped, ground };
  }
}

