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

  constructor(scene: Scene, id: string, color: string) {
    this.scene = scene;
    this.id = id;

    // Create root node
    this.root = new TransformNode(`player_${id}`, scene);

    // Create body
    this.bodyMesh = MeshBuilder.CreateCylinder(`body_${id}`, {
      diameter: PLAYER.RADIUS * 2,
      height: PLAYER.HEIGHT - 0.4,
    }, scene);
    this.bodyMesh.parent = this.root;
    this.bodyMesh.position.y = (PLAYER.HEIGHT - 0.4) / 2;

    const bodyMat = new StandardMaterial(`bodyMat_${id}`, scene);
    bodyMat.diffuseColor = Color3.FromHexString(color);
    bodyMat.specularColor = new Color3(0.2, 0.2, 0.2);
    this.bodyMesh.material = bodyMat;

    // Create head
    this.headMesh = MeshBuilder.CreateSphere(`head_${id}`, {
      diameter: 0.4,
    }, scene);
    this.headMesh.parent = this.root;
    this.headMesh.position.y = PLAYER.HEIGHT - 0.2;

    const headMat = new StandardMaterial(`headMat_${id}`, scene);
    headMat.diffuseColor = Color3.FromHexString(color).scale(0.8);
    this.headMesh.material = headMat;

    // Enable collisions
    this.bodyMesh.checkCollisions = true;
    this.headMesh.checkCollisions = true;
  }

  updateState(state: PlayerState): void {
    // Add to interpolation buffer
    this.interpolationBuffer.push({
      position: new Vector3(state.position.x, state.position.y, state.position.z),
      rotation: state.rotation.x,
      timestamp: Date.now(),
    });

    // Keep only recent states
    const cutoff = Date.now() - NETWORK.INTERPOLATION_DELAY * 2;
    this.interpolationBuffer = this.interpolationBuffer.filter(
      s => s.timestamp > cutoff
    );

    // Update alive state
    if (state.isAlive !== this.isAlive) {
      this.isAlive = state.isAlive;
      this.setVisible(state.isAlive);
    }

    // Perform interpolation
    this.interpolate();
  }

  private interpolate(): void {
    const renderTime = Date.now() - NETWORK.INTERPOLATION_DELAY;

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
      const t = total > 0 ? progress / total : 0;

      // Interpolate position
      this.targetPosition = Vector3.Lerp(beforeState.position, afterState.position, t);
      this.targetRotation = this.lerpAngle(beforeState.rotation, afterState.rotation, t);
    } else if (this.interpolationBuffer.length > 0) {
      // Use latest state
      const latest = this.interpolationBuffer[this.interpolationBuffer.length - 1];
      this.targetPosition = latest.position.clone();
      this.targetRotation = latest.rotation;
    }

    // Smooth current position towards target
    this.currentPosition = Vector3.Lerp(this.currentPosition, this.targetPosition, 0.2);
    this.currentRotation = this.lerpAngle(this.currentRotation, this.targetRotation, 0.2);

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
    this.bodyMesh.isVisible = visible;
    this.headMesh.isVisible = visible;
  }

  getPosition(): Vector3 {
    return this.root.position;
  }

  dispose(): void {
    this.bodyMesh.dispose();
    this.headMesh.dispose();
    this.root.dispose();
  }
}
