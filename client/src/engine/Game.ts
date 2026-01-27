import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  Mesh,
  PointerEventTypes,
  DynamicTexture,
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
    // Ambient light
    const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 0.6;
    ambient.groundColor = new Color3(0.2, 0.2, 0.3);

    // Directional light (sun)
    const sun = new DirectionalLight('sun', new Vector3(-0.5, -1, -0.5), this.scene);
    sun.intensity = 0.8;
    sun.diffuse = new Color3(1, 0.95, 0.8);
  }

  private buildMap(): void {
    const store = useGameStore.getState();
    const mapId = store.currentMapId || 'warehouse';

    // Create ground with texture
    const ground = MeshBuilder.CreateGround('ground', {
      width: 60,
      height: 60,
    }, this.scene);
    const groundMat = new StandardMaterial('groundMat', this.scene);

    // Create procedural concrete texture
    const groundTexture = this.createConcreteTexture('groundTex', 512);
    groundMat.diffuseTexture = groundTexture;
    groundMat.specularColor = new Color3(0.15, 0.15, 0.15);
    ground.material = groundMat;
    ground.checkCollisions = true;

    // Create walls/boundaries with brick texture
    this.createWall(-30, 3, 0, 1, 6, 60); // Left wall
    this.createWall(30, 3, 0, 1, 6, 60);  // Right wall
    this.createWall(0, 3, -30, 60, 6, 1); // Back wall
    this.createWall(0, 3, 30, 60, 6, 1);  // Front wall

    // Create some obstacles based on map
    this.createMapObstacles(mapId);

    // Skybox effect
    this.scene.clearColor = new Color4(0.4, 0.6, 0.9, 1);
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.008;
    this.scene.fogColor = new Color3(0.4, 0.6, 0.9);

    // Ambient occlusion simulation
    this.scene.ambientColor = new Color3(0.3, 0.3, 0.35);
  }

  private createConcreteTexture(name: string, size: number): DynamicTexture {
    const texture = new DynamicTexture(name, size, this.scene, true);
    const ctx = texture.getContext();

    // Base color
    ctx.fillStyle = '#4a4a50';
    ctx.fillRect(0, 0, size, size);

    // Add noise/grain
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const gray = Math.floor(60 + Math.random() * 40);
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray + 5})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Add cracks/lines
    ctx.strokeStyle = '#3a3a40';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * size, Math.random() * size);
      ctx.lineTo(Math.random() * size, Math.random() * size);
      ctx.stroke();
    }

    texture.update();
    texture.uScale = 8;
    texture.vScale = 8;
    return texture;
  }

  private createBrickTexture(name: string, size: number): DynamicTexture {
    const texture = new DynamicTexture(name, size, this.scene, true);
    const ctx = texture.getContext();

    const brickWidth = size / 4;
    const brickHeight = size / 8;
    const mortarSize = 4;

    // Mortar color
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(0, 0, size, size);

    // Draw bricks
    for (let row = 0; row < 8; row++) {
      const offset = (row % 2) * (brickWidth / 2);
      for (let col = -1; col < 5; col++) {
        const x = col * brickWidth + offset;
        const y = row * brickHeight;

        // Brick color variation
        const r = 100 + Math.floor(Math.random() * 30);
        const g = 70 + Math.floor(Math.random() * 20);
        const b = 60 + Math.floor(Math.random() * 15);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x + mortarSize/2, y + mortarSize/2, brickWidth - mortarSize, brickHeight - mortarSize);
      }
    }

    texture.update();
    texture.uScale = 4;
    texture.vScale = 2;
    return texture;
  }

  private wallCounter = 0;

  private createWall(x: number, y: number, z: number, w: number, h: number, d: number): Mesh {
    const wall = MeshBuilder.CreateBox(`wall${this.wallCounter++}`, {
      width: w,
      height: h,
      depth: d,
    }, this.scene);
    wall.position = new Vector3(x, y, z);

    const wallMat = new StandardMaterial(`wallMat${this.wallCounter}`, this.scene);
    wallMat.diffuseTexture = this.createBrickTexture(`wallTex${this.wallCounter}`, 256);
    wallMat.specularColor = new Color3(0.1, 0.1, 0.1);
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
    // Wooden crate color
    const crateColor = new Color3(0.55, 0.35, 0.15);
    const metalColor = new Color3(0.4, 0.4, 0.45);
    const platformColor = new Color3(0.3, 0.3, 0.35);

    // Central crates - stacked
    this.createCrate(-6, 1, -6, 2);
    this.createCrate(-6, 3, -6, 2);
    this.createCrate(-4, 1, -6, 2);
    this.createCrate(6, 1, -6, 2);
    this.createCrate(6, 1, -4, 2);
    this.createCrate(6, 1, 6, 2);
    this.createCrate(-6, 1, 6, 2);
    this.createCrate(-6, 1, 4, 2);

    // Shelving units with multiple levels
    this.createBox(-18, 2.5, 0, 1.5, 5, 12, metalColor);
    this.createBox(-18, 1, 0, 2, 0.2, 12, metalColor);
    this.createBox(-18, 3, 0, 2, 0.2, 12, metalColor);

    this.createBox(18, 2.5, 0, 1.5, 5, 12, metalColor);
    this.createBox(18, 1, 0, 2, 0.2, 12, metalColor);
    this.createBox(18, 3, 0, 2, 0.2, 12, metalColor);

    // Central elevated platform
    this.createBox(0, 0.5, 0, 8, 1, 8, platformColor);
    this.createBox(0, 3, 0, 5, 0.3, 5, platformColor);

    // Support pillars for elevated platform
    this.createBox(-2.2, 1.65, -2.2, 0.4, 2.3, 0.4, metalColor);
    this.createBox(2.2, 1.65, -2.2, 0.4, 2.3, 0.4, metalColor);
    this.createBox(-2.2, 1.65, 2.2, 0.4, 2.3, 0.4, metalColor);
    this.createBox(2.2, 1.65, 2.2, 0.4, 2.3, 0.4, metalColor);

    // Ramps to platform
    this.createRamp(-6, 1.65, 0, 5, 0.3, 3);
    this.createRamp(6, 1.65, 0, 5, 0.3, 3, Math.PI);

    // Cover walls
    this.createBox(-10, 1, -10, 0.3, 2, 4, metalColor);
    this.createBox(10, 1, -10, 0.3, 2, 4, metalColor);
    this.createBox(-10, 1, 10, 0.3, 2, 4, metalColor);
    this.createBox(10, 1, 10, 0.3, 2, 4, metalColor);

    // Corner crates for spawn protection
    this.createCrate(-22, 1, -22, 2.5);
    this.createCrate(22, 1, -22, 2.5);
    this.createCrate(-22, 1, 22, 2.5);
    this.createCrate(22, 1, 22, 2.5);

    // Barrels
    this.createBarrel(-12, 0.75, -12);
    this.createBarrel(-12.8, 0.75, -11.5);
    this.createBarrel(12, 0.75, 12);
    this.createBarrel(11.2, 0.75, 11.5);
  }

  private createCrate(x: number, y: number, z: number, size: number): Mesh {
    const crate = MeshBuilder.CreateBox(`crate${x}${z}`, {
      width: size,
      height: size,
      depth: size,
    }, this.scene);
    crate.position = new Vector3(x, y, z);

    const crateMat = new StandardMaterial(`crateMat${x}${z}`, this.scene);
    crateMat.diffuseTexture = this.createCrateTexture(`crateTex${x}${z}`, 128);
    crateMat.specularColor = new Color3(0.1, 0.1, 0.1);
    crate.material = crateMat;
    crate.checkCollisions = true;

    return crate;
  }

  private createCrateTexture(name: string, size: number): DynamicTexture {
    const texture = new DynamicTexture(name, size, this.scene, true);
    const ctx = texture.getContext();

    // Wood base color
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(0, 0, size, size);

    // Wood grain
    ctx.strokeStyle = '#6B4914';
    ctx.lineWidth = 2;
    for (let i = 0; i < 15; i++) {
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + (Math.random() - 0.5) * 20);
      ctx.stroke();
    }

    // Crate frame/edges
    ctx.strokeStyle = '#4a3010';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, size - 8, size - 8);

    // Cross pattern
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(size * 0.1, size * 0.1);
    ctx.lineTo(size * 0.9, size * 0.9);
    ctx.moveTo(size * 0.9, size * 0.1);
    ctx.lineTo(size * 0.1, size * 0.9);
    ctx.stroke();

    texture.update();
    return texture;
  }

  private createBarrel(x: number, y: number, z: number): Mesh {
    const barrel = MeshBuilder.CreateCylinder(`barrel${x}${z}`, {
      diameter: 1,
      height: 1.5,
    }, this.scene);
    barrel.position = new Vector3(x, y, z);

    const barrelMat = new StandardMaterial(`barrelMat${x}${z}`, this.scene);
    barrelMat.diffuseColor = new Color3(0.3, 0.5, 0.3);
    barrelMat.specularColor = new Color3(0.2, 0.2, 0.2);
    barrel.material = barrelMat;
    barrel.checkCollisions = true;

    return barrel;
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

  getInputManager(): InputManager {
    return this.inputManager;
  }

  dispose(): void {
    this.inputManager.dispose();
    this.remotePlayers.forEach(player => player.dispose());
    this.scene.dispose();
    this.engine.dispose();
  }
}
