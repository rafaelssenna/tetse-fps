import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  Mesh,
  PointerEventTypes,
} from '@babylonjs/core';
import { PLAYER, WEAPON, MAPS, MapId, CHARACTERS } from 'shared';
import { InputManager } from './InputManager';
import { Player } from './Player';
import { RemotePlayer } from './RemotePlayer';
import { NetworkManager } from '../network/NetworkManager';
import { useGameStore } from '../store/gameStore';

export class Game {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private camera: FreeCamera;
  private inputManager: InputManager;
  private player: Player;
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private network: NetworkManager;
  private lastUpdateTime = 0;
  private inputSequence = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.5, 0.7, 0.9, 1);

    // Setup camera (FPS style)
    this.camera = new FreeCamera('camera', new Vector3(0, PLAYER.HEIGHT, 0), this.scene);
    this.camera.attachControl(canvas, true);
    this.camera.minZ = 0.1;
    this.camera.fov = 1.2; // ~69 degrees FOV
    this.camera.inertia = 0;
    this.camera.angularSensibility = 1000 / PLAYER.MOUSE_SENSITIVITY;

    // Remove default camera controls (we'll handle input ourselves)
    this.camera.inputs.clear();

    // Setup input manager
    this.inputManager = new InputManager(canvas);

    // Create player
    this.player = new Player(this.scene, this.camera, this.inputManager);

    // Network
    this.network = NetworkManager.getInstance();

    // Build the map
    this.buildMap();

    // Setup lighting
    this.setupLighting();

    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  private setupLighting(): void {
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.9;
    light.groundColor = new Color3(0.3, 0.3, 0.4);
  }

  private buildMap(): void {
    const store = useGameStore.getState();
    const mapId = store.currentMapId || 'warehouse';

    // Create ground
    const ground = MeshBuilder.CreateGround('ground', {
      width: 50,
      height: 50,
    }, this.scene);
    const groundMat = new StandardMaterial('groundMat', this.scene);
    groundMat.diffuseColor = new Color3(0.3, 0.3, 0.35);
    groundMat.specularColor = new Color3(0.1, 0.1, 0.1);
    ground.material = groundMat;
    ground.checkCollisions = true;

    // Create walls/boundaries
    this.createWall(-25, 2.5, 0, 1, 5, 50); // Left wall
    this.createWall(25, 2.5, 0, 1, 5, 50);  // Right wall
    this.createWall(0, 2.5, -25, 50, 5, 1); // Back wall
    this.createWall(0, 2.5, 25, 50, 5, 1);  // Front wall

    // Create some obstacles based on map
    this.createMapObstacles(mapId);

    // Create skybox effect (simple)
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.005;
    this.scene.fogColor = new Color3(0.5, 0.7, 0.9);
  }

  private createWall(x: number, y: number, z: number, w: number, h: number, d: number): Mesh {
    const wall = MeshBuilder.CreateBox('wall', {
      width: w,
      height: h,
      depth: d,
    }, this.scene);
    wall.position = new Vector3(x, y, z);

    const wallMat = new StandardMaterial('wallMat', this.scene);
    wallMat.diffuseColor = new Color3(0.4, 0.4, 0.45);
    wall.material = wallMat;
    wall.checkCollisions = true;

    return wall;
  }

  private createMapObstacles(mapId: MapId): void {
    // Create obstacles based on map type
    switch (mapId) {
      case 'warehouse':
        this.createWarehouseObstacles();
        break;
      case 'arena':
        this.createArenaObstacles();
        break;
      default:
        this.createDefaultObstacles();
    }
  }

  private createWarehouseObstacles(): void {
    // Central crates
    this.createBox(-5, 1, -5, 2, 2, 2, new Color3(0.6, 0.4, 0.2));
    this.createBox(-5, 3, -5, 2, 2, 2, new Color3(0.6, 0.4, 0.2));
    this.createBox(5, 1, -5, 2, 2, 2, new Color3(0.6, 0.4, 0.2));
    this.createBox(5, 1, 5, 2, 2, 2, new Color3(0.6, 0.4, 0.2));
    this.createBox(-5, 1, 5, 2, 2, 2, new Color3(0.6, 0.4, 0.2));

    // Shelving units
    this.createBox(-15, 2.5, 0, 1, 5, 10, new Color3(0.5, 0.5, 0.5));
    this.createBox(15, 2.5, 0, 1, 5, 10, new Color3(0.5, 0.5, 0.5));

    // Platform in center
    this.createBox(0, 0.5, 0, 6, 1, 6, new Color3(0.35, 0.35, 0.4));
    this.createBox(0, 2.5, 0, 4, 0.3, 4, new Color3(0.4, 0.4, 0.45));

    // Ramps
    this.createRamp(-8, 1.25, 0, 4, 2.5, 2);
    this.createRamp(8, 1.25, 0, 4, 2.5, 2, Math.PI);
  }

  private createArenaObstacles(): void {
    // Central pillar
    const pillar = MeshBuilder.CreateCylinder('pillar', {
      diameter: 3,
      height: 8,
    }, this.scene);
    pillar.position = new Vector3(0, 4, 0);
    const pillarMat = new StandardMaterial('pillarMat', this.scene);
    pillarMat.diffuseColor = new Color3(0.7, 0.65, 0.55);
    pillar.material = pillarMat;
    pillar.checkCollisions = true;

    // Surrounding columns
    const columnPositions = [
      { x: -10, z: -10 },
      { x: 10, z: -10 },
      { x: -10, z: 10 },
      { x: 10, z: 10 },
    ];

    columnPositions.forEach((pos, i) => {
      const col = MeshBuilder.CreateCylinder(`column${i}`, {
        diameter: 1.5,
        height: 6,
      }, this.scene);
      col.position = new Vector3(pos.x, 3, pos.z);
      col.material = pillarMat;
      col.checkCollisions = true;
    });

    // Low walls for cover
    this.createBox(-5, 1, 0, 0.5, 2, 4, new Color3(0.6, 0.55, 0.5));
    this.createBox(5, 1, 0, 0.5, 2, 4, new Color3(0.6, 0.55, 0.5));
    this.createBox(0, 1, -5, 4, 2, 0.5, new Color3(0.6, 0.55, 0.5));
    this.createBox(0, 1, 5, 4, 2, 0.5, new Color3(0.6, 0.55, 0.5));
  }

  private createDefaultObstacles(): void {
    // Simple scattered boxes
    const positions = [
      { x: -8, z: -8 },
      { x: 8, z: -8 },
      { x: -8, z: 8 },
      { x: 8, z: 8 },
      { x: 0, z: -12 },
      { x: 0, z: 12 },
    ];

    positions.forEach((pos, i) => {
      this.createBox(pos.x, 1.5, pos.z, 3, 3, 3, new Color3(0.5, 0.5, 0.55));
    });

    // Central platform
    this.createBox(0, 0.5, 0, 8, 1, 8, new Color3(0.4, 0.4, 0.45));
  }

  private createBox(x: number, y: number, z: number, w: number, h: number, d: number, color: Color3): Mesh {
    const box = MeshBuilder.CreateBox('box', {
      width: w,
      height: h,
      depth: d,
    }, this.scene);
    box.position = new Vector3(x, y, z);

    const mat = new StandardMaterial('boxMat', this.scene);
    mat.diffuseColor = color;
    box.material = mat;
    box.checkCollisions = true;

    return box;
  }

  private createRamp(x: number, y: number, z: number, w: number, h: number, d: number, rotation = 0): Mesh {
    const ramp = MeshBuilder.CreateBox('ramp', {
      width: w,
      height: h,
      depth: d,
    }, this.scene);
    ramp.position = new Vector3(x, y, z);
    ramp.rotation.x = Math.PI / 6; // 30 degree angle
    ramp.rotation.y = rotation;

    const mat = new StandardMaterial('rampMat', this.scene);
    mat.diffuseColor = new Color3(0.45, 0.45, 0.5);
    ramp.material = mat;
    ramp.checkCollisions = true;

    return ramp;
  }

  start(): void {
    // Start render loop
    this.engine.runRenderLoop(() => {
      this.update();
      this.scene.render();
    });
  }

  private update(): void {
    const now = performance.now();
    const dt = Math.min((now - this.lastUpdateTime) / 1000, 0.1); // Cap at 100ms
    this.lastUpdateTime = now;

    // Update player
    this.player.update(dt);

    // Send input to server
    if (this.network.isConnected()) {
      this.sendInputToServer();
    }

    // Update remote players
    this.updateRemotePlayers();

    // Handle shooting
    if (this.inputManager.isMouseDown() && this.player.canShoot()) {
      this.shoot();
    }
  }

  private sendInputToServer(): void {
    const input = this.inputManager.getInput();
    const cameraRotation = {
      x: this.camera.rotation.y,
      y: this.camera.rotation.x,
    };

    this.network.sendInput({
      sequenceNumber: this.inputSequence++,
      forward: input.forward,
      backward: input.backward,
      left: input.left,
      right: input.right,
      jump: input.jump,
      shoot: this.inputManager.isMouseDown(),
      rotation: cameraRotation,
      timestamp: Date.now(),
    });
  }

  private updateRemotePlayers(): void {
    const store = useGameStore.getState();
    const players = store.players;

    // Update or create remote players
    players.forEach((playerState, playerId) => {
      if (playerId === store.localPlayerId) return;

      let remotePlayer = this.remotePlayers.get(playerId);
      if (!remotePlayer) {
        const character = CHARACTERS[playerState.characterId];
        remotePlayer = new RemotePlayer(
          this.scene,
          playerId,
          character?.color || '#888888'
        );
        this.remotePlayers.set(playerId, remotePlayer);
      }

      remotePlayer.updateState(playerState);
    });

    // Remove disconnected players
    this.remotePlayers.forEach((remotePlayer, playerId) => {
      if (!players.has(playerId)) {
        remotePlayer.dispose();
        this.remotePlayers.delete(playerId);
      }
    });
  }

  private shoot(): void {
    const origin = this.camera.position.clone();
    const direction = this.camera.getDirection(Vector3.Forward());

    this.player.shoot();
    this.network.sendShoot(
      { x: origin.x, y: origin.y, z: origin.z },
      { x: direction.x, y: direction.y, z: direction.z }
    );

    // Visual effect (muzzle flash, etc.) could go here
  }

  dispose(): void {
    this.inputManager.dispose();
    this.remotePlayers.forEach(player => player.dispose());
    this.scene.dispose();
    this.engine.dispose();
  }
}
