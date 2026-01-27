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
    // Create a more detailed gun shape
    const gunParent = new Mesh('gunParent', this.scene);
    gunParent.parent = this.camera;
    gunParent.position = new Vector3(0.35, -0.25, 0.6);
    gunParent.rotation = new Vector3(0, 0, 0);

    // Gun materials
    const metalMat = new StandardMaterial('metalMat', this.scene);
    metalMat.diffuseColor = new Color3(0.15, 0.15, 0.17);
    metalMat.specularColor = new Color3(0.5, 0.5, 0.5);
    metalMat.specularPower = 64;

    const darkMetalMat = new StandardMaterial('darkMetalMat', this.scene);
    darkMetalMat.diffuseColor = new Color3(0.08, 0.08, 0.1);
    darkMetalMat.specularColor = new Color3(0.3, 0.3, 0.3);

    const handleMat = new StandardMaterial('handleMat', this.scene);
    handleMat.diffuseColor = new Color3(0.25, 0.2, 0.15);
    handleMat.specularColor = new Color3(0.1, 0.1, 0.1);

    // Main body (receiver)
    const body = MeshBuilder.CreateBox('gunBody', {
      width: 0.06,
      height: 0.08,
      depth: 0.35,
    }, this.scene);
    body.material = metalMat;
    body.parent = gunParent;
    body.position = new Vector3(0, 0, 0);

    // Barrel
    const barrel = MeshBuilder.CreateCylinder('barrel', {
      diameter: 0.025,
      height: 0.4,
    }, this.scene);
    barrel.material = darkMetalMat;
    barrel.parent = gunParent;
    barrel.rotation.x = Math.PI / 2;
    barrel.position = new Vector3(0, 0.02, 0.35);

    // Barrel shroud
    const shroud = MeshBuilder.CreateBox('shroud', {
      width: 0.05,
      height: 0.04,
      depth: 0.25,
    }, this.scene);
    shroud.material = metalMat;
    shroud.parent = gunParent;
    shroud.position = new Vector3(0, 0.01, 0.2);

    // Magazine
    const magazine = MeshBuilder.CreateBox('magazine', {
      width: 0.04,
      height: 0.12,
      depth: 0.08,
    }, this.scene);
    magazine.material = darkMetalMat;
    magazine.parent = gunParent;
    magazine.position = new Vector3(0, -0.1, -0.02);

    // Handle/Grip
    const grip = MeshBuilder.CreateBox('grip', {
      width: 0.045,
      height: 0.1,
      depth: 0.06,
    }, this.scene);
    grip.material = handleMat;
    grip.parent = gunParent;
    grip.rotation.x = -0.3;
    grip.position = new Vector3(0, -0.08, -0.12);

    // Stock
    const stock = MeshBuilder.CreateBox('stock', {
      width: 0.04,
      height: 0.06,
      depth: 0.2,
    }, this.scene);
    stock.material = handleMat;
    stock.parent = gunParent;
    stock.position = new Vector3(0, -0.01, -0.25);

    // Sight rail
    const rail = MeshBuilder.CreateBox('rail', {
      width: 0.03,
      height: 0.015,
      depth: 0.15,
    }, this.scene);
    rail.material = metalMat;
    rail.parent = gunParent;
    rail.position = new Vector3(0, 0.05, 0.05);

    // Front sight
    const frontSight = MeshBuilder.CreateBox('frontSight', {
      width: 0.008,
      height: 0.025,
      depth: 0.008,
    }, this.scene);
    frontSight.material = metalMat;
    frontSight.parent = gunParent;
    frontSight.position = new Vector3(0, 0.065, 0.12);

    // Rear sight
    const rearSight = MeshBuilder.CreateBox('rearSight', {
      width: 0.025,
      height: 0.02,
      depth: 0.008,
    }, this.scene);
    rearSight.material = metalMat;
    rearSight.parent = gunParent;
    rearSight.position = new Vector3(0, 0.06, -0.02);

    // Muzzle flash placeholder (initially invisible)
    this.muzzleFlash = MeshBuilder.CreatePlane('muzzleFlash', { size: 0.15 }, this.scene);
    const flashMat = new StandardMaterial('flashMat', this.scene);
    flashMat.diffuseColor = new Color3(1, 0.8, 0.3);
    flashMat.emissiveColor = new Color3(1, 0.6, 0.2);
    flashMat.alpha = 0;
    this.muzzleFlash.material = flashMat;
    this.muzzleFlash.parent = gunParent;
    this.muzzleFlash.position = new Vector3(0, 0.02, 0.55);
    this.muzzleFlash.billboardMode = Mesh.BILLBOARDMODE_ALL;

    return gunParent;
  }

  private muzzleFlash!: Mesh;

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
      this.bobTime += dt * 12;
      const bobX = Math.sin(this.bobTime) * 0.012;
      const bobY = Math.abs(Math.cos(this.bobTime * 2)) * 0.015;
      this.weaponMesh.position.x = 0.35 + bobX;
      this.weaponMesh.position.y = -0.25 + bobY;
    } else {
      // Subtle idle bob
      this.bobTime += dt * 2;
      const idleBob = Math.sin(this.bobTime) * 0.003;
      this.weaponMesh.position.y = -0.25 + idleBob;
    }
  }

  canShoot(): boolean {
    const now = performance.now();
    return now - this.lastShotTime >= this.fireRate;
  }

  shoot(): void {
    this.lastShotTime = performance.now();

    // Recoil animation
    this.weaponMesh.position.z -= 0.08;
    this.weaponMesh.rotation.x = 0.1;
    setTimeout(() => {
      this.weaponMesh.position.z = 0.6;
      this.weaponMesh.rotation.x = 0;
    }, 60);

    // Muzzle flash
    if (this.muzzleFlash) {
      const flashMat = this.muzzleFlash.material as StandardMaterial;
      flashMat.alpha = 1;
      this.muzzleFlash.scaling.setAll(1 + Math.random() * 0.3);
      this.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
      setTimeout(() => {
        flashMat.alpha = 0;
      }, 40);
    }
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
