import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
  TransformNode,
} from '@babylonjs/core';
import { PlayerState, PLAYER, NETWORK } from 'shared';

export class RemotePlayer {
  private scene: Scene;
  private id: string;
  private root: TransformNode;
  private bodyMesh: Mesh;
  private headMesh: Mesh;
  private allMeshes: Mesh[] = [];

  // Interpolation
  private targetPosition: Vector3 = Vector3.Zero();
  private currentPosition: Vector3 = Vector3.Zero();
  private targetRotation = 0;
  private currentRotation = 0;
  private interpolationBuffer: Array<{
    position: Vector3;
    rotation: number;
    timestamp: number;
  }> = [];

  private isAlive = true;
  private hasReceivedFirstState = false;
  private updateCount = 0;
  private lastReceivedPosition = { x: 0, y: 0, z: 0 };

  constructor(scene: Scene, id: string, color: string) {
    this.scene = scene;
    this.id = id;

    // Create root node
    this.root = new TransformNode(`player_${id}`, scene);

    // Materials
    const bodyColor = Color3.FromHexString(color);
    const darkColor = bodyColor.scale(0.6);
    const skinColor = new Color3(0.9, 0.75, 0.6);

    const bodyMat = new StandardMaterial(`bodyMat_${id}`, scene);
    bodyMat.diffuseColor = bodyColor;
    bodyMat.specularColor = new Color3(0.15, 0.15, 0.15);

    const darkMat = new StandardMaterial(`darkMat_${id}`, scene);
    darkMat.diffuseColor = darkColor;
    darkMat.specularColor = new Color3(0.1, 0.1, 0.1);

    const skinMat = new StandardMaterial(`skinMat_${id}`, scene);
    skinMat.diffuseColor = skinColor;
    skinMat.specularColor = new Color3(0.1, 0.1, 0.1);

    const metalMat = new StandardMaterial(`metalMat_${id}`, scene);
    metalMat.diffuseColor = new Color3(0.2, 0.2, 0.22);
    metalMat.specularColor = new Color3(0.3, 0.3, 0.3);

    // Create torso
    this.bodyMesh = MeshBuilder.CreateBox(`torso_${id}`, {
      width: 0.5,
      height: 0.7,
      depth: 0.3,
    }, scene);
    this.bodyMesh.parent = this.root;
    this.bodyMesh.position.y = 1.1;
    this.bodyMesh.material = bodyMat;
    this.allMeshes.push(this.bodyMesh);

    // Create head
    this.headMesh = MeshBuilder.CreateBox(`head_${id}`, {
      width: 0.3,
      height: 0.35,
      depth: 0.3,
    }, scene);
    this.headMesh.parent = this.root;
    this.headMesh.position.y = 1.65;
    this.headMesh.material = skinMat;
    this.allMeshes.push(this.headMesh);

    // Helmet/hat
    const helmet = MeshBuilder.CreateBox(`helmet_${id}`, {
      width: 0.35,
      height: 0.15,
      depth: 0.35,
    }, scene);
    helmet.parent = this.root;
    helmet.position.y = 1.85;
    helmet.material = darkMat;
    this.allMeshes.push(helmet);

    // Legs
    const leftLeg = MeshBuilder.CreateBox(`leftLeg_${id}`, {
      width: 0.15,
      height: 0.6,
      depth: 0.15,
    }, scene);
    leftLeg.parent = this.root;
    leftLeg.position = new Vector3(-0.12, 0.4, 0);
    leftLeg.material = darkMat;
    this.allMeshes.push(leftLeg);

    const rightLeg = MeshBuilder.CreateBox(`rightLeg_${id}`, {
      width: 0.15,
      height: 0.6,
      depth: 0.15,
    }, scene);
    rightLeg.parent = this.root;
    rightLeg.position = new Vector3(0.12, 0.4, 0);
    rightLeg.material = darkMat;
    this.allMeshes.push(rightLeg);

    // Arms
    const leftArm = MeshBuilder.CreateBox(`leftArm_${id}`, {
      width: 0.12,
      height: 0.5,
      depth: 0.12,
    }, scene);
    leftArm.parent = this.root;
    leftArm.position = new Vector3(-0.35, 1.0, 0.1);
    leftArm.rotation.x = -0.3;
    leftArm.material = bodyMat;
    this.allMeshes.push(leftArm);

    const rightArm = MeshBuilder.CreateBox(`rightArm_${id}`, {
      width: 0.12,
      height: 0.5,
      depth: 0.12,
    }, scene);
    rightArm.parent = this.root;
    rightArm.position = new Vector3(0.35, 1.0, 0.15);
    rightArm.rotation.x = -0.5;
    rightArm.material = bodyMat;
    this.allMeshes.push(rightArm);

    // Gun
    const gun = MeshBuilder.CreateBox(`gun_${id}`, {
      width: 0.08,
      height: 0.1,
      depth: 0.4,
    }, scene);
    gun.parent = this.root;
    gun.position = new Vector3(0.35, 0.95, 0.4);
    gun.material = metalMat;
    this.allMeshes.push(gun);

    // Gun barrel
    const barrel = MeshBuilder.CreateCylinder(`barrel_${id}`, {
      diameter: 0.04,
      height: 0.25,
    }, scene);
    barrel.parent = this.root;
    barrel.rotation.x = Math.PI / 2;
    barrel.position = new Vector3(0.35, 0.97, 0.7);
    barrel.material = metalMat;
    this.allMeshes.push(barrel);

    // Enable collisions only on main meshes
    this.bodyMesh.checkCollisions = true;
    this.headMesh.checkCollisions = true;
  }

  updateState(state: PlayerState): void {
    const newPosition = new Vector3(state.position.x, state.position.y, state.position.z);

    // Check if position actually changed (avoid duplicate buffer entries)
    const positionChanged =
      Math.abs(state.position.x - this.lastReceivedPosition.x) > 0.001 ||
      Math.abs(state.position.y - this.lastReceivedPosition.y) > 0.001 ||
      Math.abs(state.position.z - this.lastReceivedPosition.z) > 0.001;

    // On first state, set position immediately AND add to buffer
    if (!this.hasReceivedFirstState) {
      this.hasReceivedFirstState = true;
      this.currentPosition = newPosition.clone();
      this.targetPosition = newPosition.clone();
      this.currentRotation = state.rotation.x;
      this.targetRotation = state.rotation.x;
      this.root.position.copyFrom(this.currentPosition);
      this.root.rotation.y = this.currentRotation;
      console.log('[RemotePlayer] First state received, position:', state.position);

      // Add first state to buffer so interpolation has data
      this.interpolationBuffer.push({
        position: newPosition.clone(),
        rotation: state.rotation.x,
        timestamp: Date.now(),
      });
      this.lastReceivedPosition = { ...state.position };
      return;
    }

    // Only add to buffer if position changed (new server state)
    if (positionChanged) {
      this.updateCount++;
      this.lastReceivedPosition = { ...state.position };

      // Debug log every 10 actual updates
      if (this.updateCount % 10 === 0) {
        console.log(`[RemotePlayer ${this.id.substring(0, 8)}] Update #${this.updateCount} pos=(${state.position.x.toFixed(1)}, ${state.position.z.toFixed(1)}) mesh=(${this.root.position.x.toFixed(1)}, ${this.root.position.z.toFixed(1)}) bufLen=${this.interpolationBuffer.length}`);
      }

      // Add to interpolation buffer
      this.interpolationBuffer.push({
        position: newPosition,
        rotation: state.rotation.x,
        timestamp: Date.now(),
      });

      // Keep only recent states (last 500ms for smoother interpolation)
      const cutoff = Date.now() - 500;
      this.interpolationBuffer = this.interpolationBuffer.filter(
        s => s.timestamp > cutoff
      );
    }

    // Update alive state
    if (state.isAlive !== this.isAlive) {
      this.isAlive = state.isAlive;
      this.setVisible(state.isAlive);
    }

    // Always perform interpolation (smooth movement between frames)
    this.interpolate();
  }

  private interpolate(): void {
    // Use a smaller delay (50ms = 1 tick at 20Hz)
    const interpolationDelay = 50;
    const renderTime = Date.now() - interpolationDelay;

    // Find two states to interpolate between
    let beforeState = null;
    let afterState = null;

    for (let i = 0; i < this.interpolationBuffer.length - 1; i++) {
      if (
        this.interpolationBuffer[i].timestamp <= renderTime &&
        this.interpolationBuffer[i + 1].timestamp >= renderTime
      ) {
        beforeState = this.interpolationBuffer[i];
        afterState = this.interpolationBuffer[i + 1];
        break;
      }
    }

    if (beforeState && afterState) {
      // Calculate interpolation factor
      const total = afterState.timestamp - beforeState.timestamp;
      const progress = renderTime - beforeState.timestamp;
      const t = Math.min(1, Math.max(0, total > 0 ? progress / total : 0));

      // Interpolate position
      this.targetPosition = Vector3.Lerp(beforeState.position, afterState.position, t);
      this.targetRotation = this.lerpAngle(beforeState.rotation, afterState.rotation, t);
    } else if (this.interpolationBuffer.length > 0) {
      // Use latest state directly
      const latest = this.interpolationBuffer[this.interpolationBuffer.length - 1];
      this.targetPosition = latest.position.clone();
      this.targetRotation = latest.rotation;
    }

    // Calculate distance to target for adaptive smoothing
    const distance = Vector3.Distance(this.currentPosition, this.targetPosition);

    // Use faster lerp (0.5) for snappier movement, even faster (0.8) if far behind
    const lerpFactor = distance > 2 ? 0.8 : 0.5;

    // Smooth current position towards target
    this.currentPosition = Vector3.Lerp(this.currentPosition, this.targetPosition, lerpFactor);
    this.currentRotation = this.lerpAngle(this.currentRotation, this.targetRotation, lerpFactor);

    // Apply to mesh
    this.root.position.copyFrom(this.currentPosition);
    this.root.rotation.y = this.currentRotation;
  }

  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  }

  private setVisible(visible: boolean): void {
    this.allMeshes.forEach(mesh => {
      mesh.isVisible = visible;
    });
  }

  getPosition(): Vector3 {
    return this.root.position;
  }

  dispose(): void {
    this.allMeshes.forEach(mesh => mesh.dispose());
    this.root.dispose();
  }
}
