export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}

export class InputManager {
  private canvas: HTMLCanvasElement;
  private keys: Set<string> = new Set();
  private mouseDown = false;
  private mouseDeltaX = 0;
  private mouseDeltaY = 0;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleKeyUp: (e: KeyboardEvent) => void;
  private boundHandleMouseDown: (e: MouseEvent) => void;
  private boundHandleMouseUp: (e: MouseEvent) => void;
  private boundHandleMouseMove: (e: MouseEvent) => void;
  private boundHandleContextMenu: (e: Event) => void;

  // Mobile touch input state
  private touchMoveX = 0;
  private touchMoveY = 0;
  private touchJump = false;
  private touchShooting = false;
  private isMobile = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Detect mobile device
    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
    this.boundHandleMouseDown = this.handleMouseDown.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleContextMenu = (e) => e.preventDefault();

    window.addEventListener('keydown', this.boundHandleKeyDown);
    window.addEventListener('keyup', this.boundHandleKeyUp);
    canvas.addEventListener('mousedown', this.boundHandleMouseDown);
    window.addEventListener('mouseup', this.boundHandleMouseUp);
    document.addEventListener('mousemove', this.boundHandleMouseMove);
    canvas.addEventListener('contextmenu', this.boundHandleContextMenu);
  }

  isMobileDevice(): boolean {
    return this.isMobile;
  }

  // Touch input methods for mobile controls
  setTouchMove(x: number, y: number): void {
    this.touchMoveX = x;
    this.touchMoveY = y;
  }

  setTouchLook(dx: number, dy: number): void {
    this.mouseDeltaX += dx;
    this.mouseDeltaY += dy;
  }

  setTouchShoot(shooting: boolean): void {
    this.touchShooting = shooting;
  }

  triggerTouchJump(): void {
    this.touchJump = true;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Prevent default for game keys
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    this.keys.add(e.code);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0) { // Left click
      this.mouseDown = true;
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.mouseDown = false;
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    // Check if pointer lock is active
    if (document.pointerLockElement) {
      this.mouseDeltaX += e.movementX;
      this.mouseDeltaY += e.movementY;
    }
  }

  getInput(): InputState {
    // Combine keyboard and touch inputs
    const jump = this.keys.has('Space') || this.touchJump;

    // Reset touch jump after reading (one-shot)
    if (this.touchJump) {
      this.touchJump = false;
    }

    return {
      forward: this.keys.has('KeyW') || this.touchMoveY > 0.3,
      backward: this.keys.has('KeyS') || this.touchMoveY < -0.3,
      left: this.keys.has('KeyA') || this.touchMoveX < -0.3,
      right: this.keys.has('KeyD') || this.touchMoveX > 0.3,
      jump,
    };
  }

  isMouseDown(): boolean {
    return this.mouseDown || this.touchShooting;
  }

  consumeMouseDelta(): { x: number; y: number } {
    const delta = { x: this.mouseDeltaX, y: this.mouseDeltaY };
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return delta;
  }

  isKeyDown(code: string): boolean {
    return this.keys.has(code);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    window.removeEventListener('keyup', this.boundHandleKeyUp);
    this.canvas.removeEventListener('mousedown', this.boundHandleMouseDown);
    window.removeEventListener('mouseup', this.boundHandleMouseUp);
    document.removeEventListener('mousemove', this.boundHandleMouseMove);
    this.canvas.removeEventListener('contextmenu', this.boundHandleContextMenu);
  }
}
