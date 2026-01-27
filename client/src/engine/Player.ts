import {
  Scene,
  FreeCamera,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Ray,
  Mesh,
} from '@babylonjs/core';
import { PLAYER, WEAPON } from 'shared';
import { InputManager } from './InputManager';

export class Player {
  private scene: Scene;
  private camera: FreeCamera;
  private inputManager: InputManager;
  private velocity: Vector3 = Vector3.Zero();
  private isGrounded = true;
  private lastShotTime = 0;
  private readonly fireRate = 60000 / WEAPON.FIRE_RATE; // ms between shots

  // Weapon visual (simple placeholder)
  private weaponMesh: Mesh;

  constructor(scene: Scene, camera: FreeCamera, inputManager: InputManager) {
    this.scene = scene;
    this.camera = camera;
    this.inputManager = inputManager;

    // Create simple weapon visual
    this.weaponMesh = this.createWeaponMesh();
  }

  private createWeaponMesh(): Mesh {
    // Simple gun shape
    const gun = MeshBuilder.CreateBox('gun', {
      width: 0.1,
      height: 0.1,
      depth: 0.5,
    }, this.scene);

    const gunMat = new StandardMaterial('gunMat', this.scene);
    gunMat.diffuseColor = new Color3(0.2, 0.2, 0.2);
    gunMat.specularColor = new Color3(0.3, 0.3, 0.3);
    gun.material = gunMat;

    // Attach to camera
    gun.parent = this.camera;
    gun.position = new Vector3(0.3, -0.2, 0.5);
    gun.rotation = new Vector3(0, 0, 0);

    return gun;
  }

  update(dt: number): void {
    // Handle mouse look
    const mouseDelta = this.inputManager.consumeMouseDelta();
    this.camera.rotation.y += mouseDelta.x * PLAYER.MOUSE_SENSITIVITY;
    this.camera.rotation.x += mouseDelta.y * PLAYER.MOUSE_SENSITIVITY;

    // Clamp vertical rotation
    this.camera.rotation.x = Math.max(
      -Math.PI / 2 + 0.1,
      Math.min(Math.PI / 2 - 0.1, this.camera.rotation.x)
    );

    // Get input
    const input = this.inputManager.getInput();

    // Calculate movement direction
    const forward = this.camera.getDirection(Vector3.Forward());
    forward.y = 0;
    forward.normalize();

    const right = this.camera.getDirection(Vector3.Right());
    right.y = 0;
    right.normalize();

    // Calculate movement
    let moveDirection = Vector3.Zero();

    if (input.forward) {
      moveDirection.addInPlace(forward);
    }
    if (input.backward) {
      moveDirection.subtractInPlace(forward);
    }
    if (input.left) {
      moveDirection.subtractInPlace(right);
    }
    if (input.right) {
      moveDirection.addInPlace(right);
    }

    // Normalize and apply speed
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      moveDirection.scaleInPlace(PLAYER.MOVE_SPEED);
    }

    // Apply horizontal velocity
    this.velocity.x = moveDirection.x;
    this.velocity.z = moveDirection.z;

    // Handle jumping
    if (input.jump && this.isGrounded) {
      this.velocity.y = PLAYER.JUMP_FORCE;
      this.isGrounded = false;
    }

    // Apply gravity
    if (!this.isGrounded) {
      this.velocity.y += PLAYER.GRAVITY * dt;
    }

    // Move camera
    const movement = this.velocity.scale(dt);

    // Check collisions and move
    this.moveWithCollisions(movement);

    // Check ground
    this.checkGround();

    // Weapon bob
    this.updateWeaponBob(dt, moveDirection.length() > 0);
  }

  private moveWithCollisions(movement: Vector3): void {
    // Simple collision detection using raycasts
    const position = this.camera.position.clone();
    const newPosition = position.add(movement);

    // Check horizontal movement
    if (movement.x !== 0 || movement.z !== 0) {
      const horizontalDir = new Vector3(movement.x, 0, movement.z).normalize();
      const ray = new Ray(position, horizontalDir, PLAYER.RADIUS + 0.1);
      const hit = this.scene.pickWithRay(ray, (mesh) => mesh.checkCollisions);

      if (hit?.hit && hit.distance < PLAYER.RADIUS + movement.length()) {
        // Slide along wall
        const normal = hit.getNormal(true);
        if (normal) {
          const slideDir = movement.subtract(normal.scale(Vector3.Dot(movement, normal)));
          this.camera.position.addInPlace(slideDir);
        }
      } else {
        this.camera.position.x = newPosition.x;
        this.camera.position.z = newPosition.z;
      }
    }

    // Apply vertical movement
    this.camera.position.y = Math.max(PLAYER.HEIGHT, newPosition.y);
  }

  private checkGround(): void {
    const ray = new Ray(
      this.camera.position,
      Vector3.Down(),
      PLAYER.HEIGHT + 0.1
    );
    const hit = this.scene.pickWithRay(ray, (mesh) => mesh.checkCollisions);

    if (hit?.hit && hit.distance <= PLAYER.HEIGHT + 0.1) {
      this.isGrounded = true;
      this.velocity.y = Math.max(0, this.velocity.y);
      this.camera.position.y = (hit.pickedPoint?.y || 0) + PLAYER.HEIGHT;
    } else {
      this.isGrounded = false;
    }
  }

  private bobTime = 0;

  private updateWeaponBob(dt: number, isMoving: boolean): void {
    if (isMoving) {
      this.bobTime += dt * 10;
      const bobX = Math.sin(this.bobTime) * 0.01;
      const bobY = Math.abs(Math.cos(this.bobTime)) * 0.01;
      this.weaponMesh.position.x = 0.3 + bobX;
      this.weaponMesh.position.y = -0.2 + bobY;
    } else {
      // Subtle idle bob
      this.bobTime += dt * 2;
      const idleBob = Math.sin(this.bobTime) * 0.002;
      this.weaponMesh.position.y = -0.2 + idleBob;
    }
  }

  canShoot(): boolean {
    const now = performance.now();
    return now - this.lastShotTime >= this.fireRate;
  }

  shoot(): void {
    this.lastShotTime = performance.now();

    // Recoil animation
    this.weaponMesh.position.z -= 0.05;
    setTimeout(() => {
      this.weaponMesh.position.z = 0.5;
    }, 50);
  }

  getPosition(): Vector3 {
    return this.camera.position;
  }

  getDirection(): Vector3 {
    return this.camera.getDirection(Vector3.Forward());
  }

  setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y + PLAYER.HEIGHT, z);
  }

  dispose(): void {
    this.weaponMesh.dispose();
  }
}
