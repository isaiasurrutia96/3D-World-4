/**
 * Keyboard (the 3D-WORLD-3 layout) and touch controls, read once per frame.
 *
 * Keyboard: E S D F or arrows move, Shift walks, Space jumps,
 * J L I K turn the camera, mouse drag turns the camera, wheel zooms.
 * Touch: left half is a floating stick, right half drags the camera,
 * the Jump button jumps, two fingers pinch to zoom.
 */

export class Input {
  /** Move direction in screen terms: x right, y forward. Length 0..1. */
  readonly move = { x: 0, y: 0 };
  /** Camera turn this frame, in radians. */
  look = { x: 0, y: 0 };
  /** Zoom change this frame (positive = farther). */
  zoom = 0;
  jumpHeld = false;
  private jumpQueued = false;
  readonly touch: boolean;

  private readonly keys = new Set<string>();
  private stick: { id: number; x0: number; y0: number; x: number; y: number } | null = null;
  private lookPointer: { id: number; x: number; y: number } | null = null;
  private pinch = new Map<number, { x: number; y: number }>();
  private pinchDistance = 0;
  private mouseDrag: { x: number; y: number } | null = null;
  private stickBase: HTMLDivElement | null = null;
  private stickKnob: HTMLDivElement | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) this.jumpQueued = true;
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    const releaseAll = (): void => {
      this.keys.clear();
      this.stick = null;
      this.lookPointer = null;
      this.pinch.clear();
      this.mouseDrag = null;
      this.jumpHeld = false;
      this.showStick();
    };
    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', () => document.hidden && releaseAll());

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoom += e.deltaY * 0.002;
    }, { passive: false });

    canvas.addEventListener('pointerdown', (e) => this.onDown(e, canvas));
    canvas.addEventListener('pointermove', (e) => this.onMove(e));
    const up = (e: PointerEvent): void => this.onUp(e);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    if (this.touch) this.buildTouchUi();
  }

  private onDown(e: PointerEvent, canvas: HTMLCanvasElement): void {
    canvas.setPointerCapture(e.pointerId);
    if (e.pointerType === 'mouse') {
      this.mouseDrag = { x: e.clientX, y: e.clientY };
      return;
    }
    this.pinch.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pinch.size === 2) {
      // A second finger means pinch: stop steering the camera with either.
      this.lookPointer = null;
      this.pinchDistance = this.pinchSpan();
      return;
    }
    if (e.clientX < window.innerWidth / 2 && !this.stick) {
      this.stick = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
      this.showStick();
    } else if (!this.lookPointer) {
      this.lookPointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
    }
  }

  private onMove(e: PointerEvent): void {
    if (e.pointerType === 'mouse') {
      if (!this.mouseDrag) return;
      this.look.x += (e.clientX - this.mouseDrag.x) * 0.006;
      this.look.y += (e.clientY - this.mouseDrag.y) * 0.006;
      this.mouseDrag = { x: e.clientX, y: e.clientY };
      return;
    }
    if (this.pinch.has(e.pointerId)) this.pinch.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pinch.size === 2 && !this.stick) {
      const span = this.pinchSpan();
      if (this.pinchDistance > 0) this.zoom += (this.pinchDistance - span) * 0.01;
      this.pinchDistance = span;
      return;
    }
    if (this.stick && e.pointerId === this.stick.id) {
      this.stick.x = e.clientX;
      this.stick.y = e.clientY;
      this.showStick();
    } else if (this.lookPointer && e.pointerId === this.lookPointer.id) {
      this.look.x += (e.clientX - this.lookPointer.x) * 0.008;
      this.look.y += (e.clientY - this.lookPointer.y) * 0.008;
      this.lookPointer.x = e.clientX;
      this.lookPointer.y = e.clientY;
    }
  }

  private onUp(e: PointerEvent): void {
    if (e.pointerType === 'mouse') this.mouseDrag = null;
    this.pinch.delete(e.pointerId);
    this.pinchDistance = 0;
    if (this.stick && e.pointerId === this.stick.id) {
      this.stick = null;
      this.showStick();
    }
    if (this.lookPointer && e.pointerId === this.lookPointer.id) this.lookPointer = null;
  }

  private pinchSpan(): number {
    const [a, b] = [...this.pinch.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }

  private buildTouchUi(): void {
    const css = document.createElement('style');
    css.textContent = `
      .stick-base,.stick-knob{position:fixed;border-radius:50%;pointer-events:none;display:none;transform:translate(-50%,-50%)}
      .stick-base{width:120px;height:120px;background:rgba(60,58,54,.12);border:2px solid rgba(60,58,54,.25)}
      .stick-knob{width:56px;height:56px;background:rgba(60,58,54,.35)}
      .jump-btn{position:fixed;right:max(24px,env(safe-area-inset-right));bottom:max(32px,env(safe-area-inset-bottom));
        width:84px;height:84px;border-radius:50%;border:2px solid rgba(60,58,54,.35);background:rgba(255,255,255,.55);
        font:600 15px system-ui,sans-serif;color:#3b3a37;touch-action:none;user-select:none;-webkit-user-select:none}
      .jump-btn:active{background:rgba(255,255,255,.85)}`;
    document.head.appendChild(css);
    this.stickBase = document.createElement('div');
    this.stickBase.className = 'stick-base';
    this.stickKnob = document.createElement('div');
    this.stickKnob.className = 'stick-knob';
    document.body.append(this.stickBase, this.stickKnob);

    const jump = document.createElement('button');
    jump.className = 'jump-btn';
    jump.textContent = 'JUMP';
    const press = (e: Event): void => {
      e.preventDefault();
      e.stopPropagation();
      this.jumpQueued = true;
      this.jumpHeld = true;
    };
    const release = (e: Event): void => {
      e.preventDefault();
      this.jumpHeld = false;
    };
    jump.addEventListener('pointerdown', press);
    jump.addEventListener('pointerup', release);
    jump.addEventListener('pointercancel', release);
    jump.addEventListener('pointerleave', release);
    document.body.appendChild(jump);
  }

  private showStick(): void {
    if (!this.stickBase || !this.stickKnob) return;
    const s = this.stick;
    this.stickBase.style.display = this.stickKnob.style.display = s ? 'block' : 'none';
    if (!s) return;
    const max = 50;
    let dx = s.x - s.x0;
    let dy = s.y - s.y0;
    const len = Math.hypot(dx, dy);
    if (len > max) {
      dx *= max / len;
      dy *= max / len;
    }
    this.stickBase.style.left = `${s.x0}px`;
    this.stickBase.style.top = `${s.y0}px`;
    this.stickKnob.style.left = `${s.x0 + dx}px`;
    this.stickKnob.style.top = `${s.y0 + dy}px`;
  }

  /** Call once per frame before reading. Returns true if a jump was pressed. */
  update(dt: number): boolean {
    let x = 0;
    let y = 0;
    const k = this.keys;
    if (k.has('KeyE') || k.has('ArrowUp')) y += 1;
    if (k.has('KeyD') || k.has('ArrowDown')) y -= 1;
    if (k.has('KeyS') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyF') || k.has('ArrowRight')) x += 1;
    if (x || y) {
      const len = Math.hypot(x, y);
      const walk = k.has('ShiftLeft') || k.has('ShiftRight') ? 0.45 : 1;
      x = (x / len) * walk;
      y = (y / len) * walk;
    } else if (this.stick) {
      const dx = (this.stick.x - this.stick.x0) / 50;
      const dy = (this.stick.y - this.stick.y0) / 50;
      const len = Math.hypot(dx, dy);
      const amount = len < 0.15 ? 0 : Math.min(1, (len - 0.15) / 0.85);
      x = len ? (dx / len) * amount : 0;
      y = len ? (-dy / len) * amount : 0;
    }
    this.move.x = x;
    this.move.y = y;

    const turn = 2.4 * dt;
    if (k.has('KeyJ')) this.look.x -= turn;
    if (k.has('KeyL')) this.look.x += turn;
    if (k.has('KeyI')) this.look.y -= turn;
    if (k.has('KeyK')) this.look.y += turn;

    if (k.has('Space')) this.jumpHeld = true;
    else if (!this.touch) this.jumpHeld = false;

    const jumped = this.jumpQueued;
    this.jumpQueued = false;
    return jumped;
  }

  /** Clears per-frame camera deltas after the camera has used them. */
  endFrame(): void {
    this.look = { x: 0, y: 0 };
    this.zoom = 0;
  }
}
