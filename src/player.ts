/**
 * Basic movement for the approved avatar on a flat floor slab: walk, run,
 * jump, turn toward the direction of travel, and fall off the edge.
 * Animation is procedural: legs and arms swing with distance travelled.
 */

import { Group, MathUtils, Vector3 } from 'three';

export const TUNING = {
  runSpeed: 6,
  acceleration: 35,
  deceleration: 45,
  airControl: 0.35,
  turnRate: 12,
  jumpHeight: 1.1,
  timeToPeak: 0.36,
  fallGravityScale: 1.8,
  coyoteTime: 0.1,
  jumpBuffer: 0.12,
};

const GRAVITY = (2 * TUNING.jumpHeight) / TUNING.timeToPeak ** 2;
const JUMP_VELOCITY = (2 * TUNING.jumpHeight) / TUNING.timeToPeak;

interface Rig {
  root: Group;
  body: Group;
  shoulderLeft: Group;
  shoulderRight: Group;
  elbowLeft: Group;
  elbowRight: Group;
  hipLeft: Group;
  hipRight: Group;
  kneeLeft: Group;
  kneeRight: Group;
}

export class Player {
  readonly position = new Vector3();
  readonly velocity = new Vector3();
  facing = 0;
  onGround = true;
  private coyote = 0;
  private buffer = 0;
  private phase = 0;
  private readonly base: Map<Group, { x: number; y: number }> = new Map();

  constructor(private readonly rig: Rig, private readonly slabHalf: number) {
    for (const part of [
      rig.body, rig.shoulderLeft, rig.shoulderRight, rig.elbowLeft, rig.elbowRight,
      rig.hipLeft, rig.hipRight, rig.kneeLeft, rig.kneeRight,
    ]) {
      this.base.set(part, { x: part.rotation.x, y: part.position.y });
    }
  }

  get speed(): number {
    return Math.hypot(this.velocity.x, this.velocity.z);
  }

  /**
   * One fixed step. `wish` is the desired direction on the ground (x, z),
   * already turned to match the camera, with length 0..1.
   */
  step(dt: number, wishX: number, wishZ: number, jumpPressed: boolean, jumpHeld: boolean): void {
    if (jumpPressed) this.buffer = TUNING.jumpBuffer;
    this.buffer = Math.max(0, this.buffer - dt);
    this.coyote = this.onGround ? TUNING.coyoteTime : Math.max(0, this.coyote - dt);

    // Horizontal: accelerate toward the wished velocity.
    const control = this.onGround ? 1 : TUNING.airControl;
    const targetX = wishX * TUNING.runSpeed;
    const targetZ = wishZ * TUNING.runSpeed;
    const accelerating = wishX !== 0 || wishZ !== 0;
    const rate = (accelerating ? TUNING.acceleration : TUNING.deceleration) * control * dt;
    const dx = targetX - this.velocity.x;
    const dz = targetZ - this.velocity.z;
    const gap = Math.hypot(dx, dz);
    if (gap <= rate) {
      this.velocity.x = targetX;
      this.velocity.z = targetZ;
    } else {
      this.velocity.x += (dx / gap) * rate;
      this.velocity.z += (dz / gap) * rate;
    }

    // Turn to face the way he is going.
    if (accelerating) {
      const want = Math.atan2(wishX, wishZ);
      let diff = want - this.facing;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.facing += diff * Math.min(1, TUNING.turnRate * dt);
    }

    // Jump (buffered press, coyote time after leaving the edge).
    if (this.buffer > 0 && this.coyote > 0) {
      this.velocity.y = JUMP_VELOCITY;
      this.onGround = false;
      this.buffer = 0;
      this.coyote = 0;
    }

    // Gravity: heavier on the way down, and a short hop if released early.
    if (!this.onGround) {
      let g = GRAVITY;
      if (this.velocity.y < 0) g *= TUNING.fallGravityScale;
      else if (!jumpHeld) g *= 2.5;
      this.velocity.y -= g * dt;
    }

    this.position.addScaledVector(this.velocity, dt);

    // The floor slab: solid only within its edges.
    const overSlab = Math.abs(this.position.x) <= this.slabHalf && Math.abs(this.position.z) <= this.slabHalf;
    if (overSlab && this.position.y <= 0 && this.velocity.y <= 0 && this.position.y > -0.6) {
      this.position.y = 0;
      this.velocity.y = 0;
      this.onGround = true;
    } else if (this.onGround && !overSlab) {
      this.onGround = false;
    } else if (this.onGround && this.position.y > 0) {
      this.onGround = false;
    }

    // Fell off: back to the middle.
    if (this.position.y < -25) {
      this.position.set(0, 0, 0);
      this.velocity.set(0, 0, 0);
      this.onGround = true;
    }
  }

  /** Places the model and poses it for this frame. */
  animate(dt: number): void {
    const rig = this.rig;
    rig.root.position.copy(this.position);
    rig.root.rotation.y = this.facing;

    const run = MathUtils.clamp(this.speed / TUNING.runSpeed, 0, 1);
    this.phase += this.speed * dt * 2.2;
    const s = Math.sin(this.phase);
    const swing = this.onGround ? 0.85 * run : 0;
    const set = (part: Group, rotX: number): void => {
      part.rotation.x = (this.base.get(part)?.x ?? 0) + rotX;
    };

    if (this.onGround) {
      set(rig.hipLeft, s * swing);
      set(rig.hipRight, -s * swing);
      set(rig.kneeLeft, Math.max(0, -s) * swing * 1.1);
      set(rig.kneeRight, Math.max(0, s) * swing * 1.1);
      set(rig.shoulderLeft, -s * swing * 0.8);
      set(rig.shoulderRight, s * swing * 0.8);
      set(rig.elbowLeft, -0.25 * run);
      set(rig.elbowRight, -0.25 * run);
      const bob = Math.abs(Math.cos(this.phase)) * 0.05 * run;
      rig.body.position.y = (this.base.get(rig.body)?.y ?? 0) + bob;
      rig.body.rotation.x = 0.12 * run; // lean into the run
    } else {
      // In the air: knees up, arms out a little.
      const rising = this.velocity.y > 0 ? 1 : 0.6;
      set(rig.hipLeft, -0.5 * rising);
      set(rig.hipRight, 0.2 * rising);
      set(rig.kneeLeft, 0.9 * rising);
      set(rig.kneeRight, 0.5 * rising);
      set(rig.shoulderLeft, -0.6);
      set(rig.shoulderRight, -0.6);
      set(rig.elbowLeft, -0.3);
      set(rig.elbowRight, -0.3);
      rig.body.position.y = this.base.get(rig.body)?.y ?? 0;
      rig.body.rotation.x = 0.05;
    }
  }
}
