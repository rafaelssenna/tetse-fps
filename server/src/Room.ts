import { v4 as uuidv4 } from 'uuid';
import {
  PlayerId,
  CharacterId,
  GameMode,
  MapId,
  PlayerState,
  PlayerInput,
  Vec3,
  GameSnapshot,
  GameEvent,
  MessageType,
  MATCH,
  PLAYER,
  WEAPON,
  MAPS,
  MAP_IDS,
} from 'shared';
import { GameServer } from './GameServer.js';

interface RoomPlayer {
  id: PlayerId;
  name: string;
  characterId: CharacterId;
  state: PlayerState;
  lastInput: PlayerInput | null;
  pendingInputs: PlayerInput[];
  team?: 'red' | 'blue';
}

export class Room {
  readonly id: string;
  readonly gameMode: GameMode;
  private server: GameServer;
  private players: Map<PlayerId, RoomPlayer> = new Map();
  private mapId: MapId;
  private status: 'waiting' | 'starting' | 'playing' | 'ended' = 'waiting';
  private timeRemaining: number = MATCH.DURATION;
  private countdown: number = MATCH.COUNTDOWN;
  private tick_count: number = 0;
  private events: GameEvent[] = [];
  private teamScores = { red: 0, blue: 0 };

  constructor(id: string, gameMode: GameMode, server: GameServer) {
    this.id = id;
    this.gameMode = gameMode;
    this.server = server;
    this.mapId = this.selectRandomMap();
  }

  private selectRandomMap(): MapId {
    const randomIndex = Math.floor(Math.random() * MAP_IDS.length);
    return MAP_IDS[randomIndex];
  }

  addPlayer(playerId: PlayerId, name: string, characterId: CharacterId): void {
    const spawnPoint = this.getSpawnPoint();
    const team = this.gameMode === 'tdm' ? this.assignTeam() : undefined;

    const playerState: PlayerState = {
      id: playerId,
      characterId,
      position: { ...spawnPoint.position },
      rotation: { x: spawnPoint.rotation, y: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      health: PLAYER.MAX_HEALTH,
      isAlive: true,
      kills: 0,
      deaths: 0,
      team,
    };

    const roomPlayer: RoomPlayer = {
      id: playerId,
      name,
      characterId,
      state: playerState,
      lastInput: null,
      pendingInputs: [],
      team,
    };

    this.players.set(playerId, roomPlayer);

    // Notify all players
    this.broadcast({
      type: MessageType.PLAYER_JOINED,
      playerId,
      playerName: name,
      characterId,
      team,
    });

    // Send room state to new player
    this.server.sendToPlayer(playerId, {
      type: MessageType.ROOM_STATE,
      roomId: this.id,
      mapId: this.mapId,
      gameMode: this.gameMode,
      status: this.status,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        characterId: p.characterId,
        team: p.team,
        isReady: true,
      })),
    });

    // Check if we can start
    if (this.status === 'waiting' && this.players.size >= MATCH.MIN_PLAYERS) {
      this.startCountdown();
    }
  }

  removePlayer(playerId: PlayerId): void {
    this.players.delete(playerId);

    this.broadcast({
      type: MessageType.PLAYER_LEFT,
      playerId,
    });

    // Check if game should end
    if (this.status === 'playing' && this.players.size < MATCH.MIN_PLAYERS) {
      this.endGame();
    }
  }

  private assignTeam(): 'red' | 'blue' {
    let redCount = 0;
    let blueCount = 0;

    this.players.forEach(p => {
      if (p.team === 'red') redCount++;
      else if (p.team === 'blue') blueCount++;
    });

    return redCount <= blueCount ? 'red' : 'blue';
  }

  private getSpawnPoint(team?: 'red' | 'blue'): { position: Vec3; rotation: number } {
    const mapData = MAPS[this.mapId];
    const spawnPoints = mapData.spawnPoints;

    // For TDM, filter by team if specified
    let availableSpawns = spawnPoints;
    if (this.gameMode === 'tdm' && team) {
      availableSpawns = spawnPoints.filter(sp => sp.team === team || !sp.team);
    }

    const randomIndex = Math.floor(Math.random() * availableSpawns.length);
    return availableSpawns[randomIndex];
  }

  private startCountdown(): void {
    this.status = 'starting';
    this.countdown = MATCH.COUNTDOWN;

    this.broadcast({
      type: MessageType.ROOM_STATE,
      roomId: this.id,
      mapId: this.mapId,
      gameMode: this.gameMode,
      status: this.status,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        characterId: p.characterId,
        team: p.team,
        isReady: true,
      })),
      countdown: this.countdown,
    });
  }

  private startGame(): void {
    this.status = 'playing';
    this.timeRemaining = MATCH.DURATION;

    this.players.forEach((player, playerId) => {
      const spawn = this.getSpawnPoint(player.team);
      player.state.position = { ...spawn.position };
      player.state.rotation = { x: spawn.rotation, y: 0 };
      player.state.health = PLAYER.MAX_HEALTH;
      player.state.isAlive = true;

      this.server.sendToPlayer(playerId, {
        type: MessageType.GAME_START,
        mapId: this.mapId,
        gameMode: this.gameMode,
        duration: MATCH.DURATION,
        yourSpawnPoint: spawn.position,
      });
    });
  }

  private endGame(): void {
    this.status = 'ended';

    const winner = this.calculateWinner();
    const finalScores = Array.from(this.players.values()).map(p => ({
      playerId: p.id,
      kills: p.state.kills,
      deaths: p.state.deaths,
    }));

    this.broadcast({
      type: MessageType.GAME_END,
      winner,
      finalScores,
      teamScores: this.gameMode === 'tdm' ? this.teamScores : undefined,
    });
  }

  private calculateWinner(): PlayerId | 'red' | 'blue' | null {
    if (this.gameMode === 'tdm') {
      if (this.teamScores.red > this.teamScores.blue) return 'red';
      if (this.teamScores.blue > this.teamScores.red) return 'blue';
      return null;
    }

    // FFA - player with most kills
    let maxKills = 0;
    let winner: PlayerId | null = null;

    this.players.forEach(player => {
      if (player.state.kills > maxKills) {
        maxKills = player.state.kills;
        winner = player.id;
      }
    });

    return winner;
  }

  handlePlayerInput(playerId: PlayerId, input: PlayerInput): void {
    const player = this.players.get(playerId);
    if (!player || this.status !== 'playing') return;

    player.pendingInputs.push(input);
  }

  handlePlayerShoot(playerId: PlayerId, origin: Vec3, direction: Vec3, timestamp: number): void {
    const shooter = this.players.get(playerId);
    if (!shooter || !shooter.state.isAlive || this.status !== 'playing') return;

    // Raycast hit detection
    const hit = this.raycast(origin, direction, playerId);

    if (hit) {
      const target = this.players.get(hit.playerId);
      if (target && target.state.isAlive) {
        const damage = hit.isHeadshot
          ? WEAPON.DAMAGE * WEAPON.HEADSHOT_MULTIPLIER
          : WEAPON.DAMAGE;

        target.state.health -= damage;

        // Notify hit
        this.broadcast({
          type: MessageType.PLAYER_HIT,
          targetId: hit.playerId,
          damage,
          newHealth: Math.max(0, target.state.health),
          hitPosition: hit.position,
          isHeadshot: hit.isHeadshot,
        });

        // Check for death
        if (target.state.health <= 0) {
          this.handlePlayerDeath(target, shooter);
        }
      }
    }
  }

  private raycast(
    origin: Vec3,
    direction: Vec3,
    shooterId: PlayerId
  ): { playerId: PlayerId; position: Vec3; isHeadshot: boolean } | null {
    type HitResult = { playerId: PlayerId; position: Vec3; distance: number; isHeadshot: boolean };
    let closestHit: HitResult | null = null;

    for (const [playerId, player] of this.players) {
      if (playerId === shooterId || !player.state.isAlive) continue;

      // Simple sphere collision for body
      const bodyHit = this.raySphereIntersect(
        origin,
        direction,
        player.state.position,
        PLAYER.RADIUS
      );

      // Head hitbox (smaller sphere above body)
      const headPosition: Vec3 = {
        x: player.state.position.x,
        y: player.state.position.y + PLAYER.HEIGHT - 0.2,
        z: player.state.position.z,
      };
      const headHit = this.raySphereIntersect(origin, direction, headPosition, 0.2);

      if (headHit && (!closestHit || headHit.distance < closestHit.distance)) {
        closestHit = {
          playerId,
          position: headHit.point,
          distance: headHit.distance,
          isHeadshot: true,
        };
      } else if (bodyHit && (!closestHit || bodyHit.distance < closestHit.distance)) {
        closestHit = {
          playerId,
          position: bodyHit.point,
          distance: bodyHit.distance,
          isHeadshot: false,
        };
      }
    }

    if (!closestHit) return null;
    return {
      playerId: closestHit.playerId,
      position: closestHit.position,
      isHeadshot: closestHit.isHeadshot,
    };
  }

  private raySphereIntersect(
    origin: Vec3,
    direction: Vec3,
    center: Vec3,
    radius: number
  ): { point: Vec3; distance: number } | null {
    const dx = origin.x - center.x;
    const dy = origin.y - center.y;
    const dz = origin.z - center.z;

    const a = direction.x * direction.x + direction.y * direction.y + direction.z * direction.z;
    const b = 2 * (dx * direction.x + dy * direction.y + dz * direction.z);
    const c = dx * dx + dy * dy + dz * dz - radius * radius;

    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return null;

    const t = (-b - Math.sqrt(discriminant)) / (2 * a);
    if (t < 0 || t > WEAPON.RANGE) return null;

    return {
      point: {
        x: origin.x + direction.x * t,
        y: origin.y + direction.y * t,
        z: origin.z + direction.z * t,
      },
      distance: t,
    };
  }

  private handlePlayerDeath(victim: RoomPlayer, killer: RoomPlayer): void {
    victim.state.isAlive = false;
    victim.state.deaths++;
    killer.state.kills++;

    if (this.gameMode === 'tdm' && killer.team) {
      this.teamScores[killer.team]++;
    }

    this.events.push({
      type: 'kill',
      data: {
        killerId: killer.id,
        victimId: victim.id,
        weapon: 'rifle',
      },
    });

    this.broadcast({
      type: MessageType.PLAYER_DEATH,
      victimId: victim.id,
      killerId: killer.id,
      respawnTime: PLAYER.RESPAWN_TIME,
    });

    // Schedule respawn
    setTimeout(() => this.respawnPlayer(victim.id), PLAYER.RESPAWN_TIME);

    // Check win condition
    this.checkWinCondition();
  }

  private respawnPlayer(playerId: PlayerId): void {
    const player = this.players.get(playerId);
    if (!player || this.status !== 'playing') return;

    const spawn = this.getSpawnPoint(player.team);
    player.state.position = { ...spawn.position };
    player.state.rotation = { x: spawn.rotation, y: 0 };
    player.state.velocity = { x: 0, y: 0, z: 0 };
    player.state.health = PLAYER.MAX_HEALTH;
    player.state.isAlive = true;

    this.events.push({
      type: 'spawn',
      data: {
        playerId,
        position: spawn.position,
      },
    });

    this.broadcast({
      type: MessageType.PLAYER_SPAWN,
      playerId,
      position: spawn.position,
      rotation: spawn.rotation,
    });
  }

  private checkWinCondition(): void {
    if (this.gameMode === 'ffa') {
      this.players.forEach(player => {
        if (player.state.kills >= MATCH.SCORE_TO_WIN_FFA) {
          this.endGame();
        }
      });
    } else {
      if (this.teamScores.red >= MATCH.SCORE_TO_WIN_TDM ||
          this.teamScores.blue >= MATCH.SCORE_TO_WIN_TDM) {
        this.endGame();
      }
    }
  }

  tick(): void {
    this.tick_count++;

    if (this.status === 'starting') {
      // Update countdown every second (20 ticks)
      if (this.tick_count % 20 === 0) {
        this.countdown--;
        if (this.countdown <= 0) {
          this.startGame();
        }
      }
      return;
    }

    if (this.status !== 'playing') return;

    // Update time
    if (this.tick_count % 20 === 0) {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.endGame();
        return;
      }
    }

    // Process inputs and update physics
    this.players.forEach(player => {
      if (player.pendingInputs.length > 0) {
        const input = player.pendingInputs.shift()!;
        this.processInput(player, input);
      }
    });

    // Send game state to all players
    this.broadcastGameState();
  }

  private processInput(player: RoomPlayer, input: PlayerInput): void {
    if (!player.state.isAlive) return;

    const state = player.state;
    const dt = 1 / 20; // 50ms per tick

    // Update rotation
    state.rotation = input.rotation;

    // Calculate movement direction based on rotation
    const yaw = state.rotation.x;
    let moveX = 0;
    let moveZ = 0;

    if (input.forward) {
      moveX -= Math.sin(yaw);
      moveZ -= Math.cos(yaw);
    }
    if (input.backward) {
      moveX += Math.sin(yaw);
      moveZ += Math.cos(yaw);
    }
    if (input.left) {
      moveX -= Math.cos(yaw);
      moveZ += Math.sin(yaw);
    }
    if (input.right) {
      moveX += Math.cos(yaw);
      moveZ -= Math.sin(yaw);
    }

    // Normalize
    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (length > 0) {
      moveX /= length;
      moveZ /= length;
    }

    // Apply movement
    state.velocity.x = moveX * PLAYER.MOVE_SPEED;
    state.velocity.z = moveZ * PLAYER.MOVE_SPEED;

    // Jump
    if (input.jump && state.position.y <= 1.1) { // On ground
      state.velocity.y = PLAYER.JUMP_FORCE;
    }

    // Apply gravity
    state.velocity.y += PLAYER.GRAVITY * dt;

    // Update position
    state.position.x += state.velocity.x * dt;
    state.position.y += state.velocity.y * dt;
    state.position.z += state.velocity.z * dt;

    // Ground collision
    if (state.position.y < 1) {
      state.position.y = 1;
      state.velocity.y = 0;
    }

    player.lastInput = input;
  }

  private broadcastGameState(): void {
    const snapshot: GameSnapshot = {
      tick: this.tick_count,
      timestamp: Date.now(),
      players: Array.from(this.players.values()).map(p => ({ ...p.state })),
      events: this.events,
    };

    this.events = []; // Clear events after sending

    this.broadcast({
      type: MessageType.GAME_STATE,
      snapshot,
    });
  }

  private broadcast(message: any, excludePlayerId?: PlayerId): void {
    this.players.forEach((player, playerId) => {
      if (playerId !== excludePlayerId) {
        this.server.sendToPlayer(playerId, message);
      }
    });
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  stop(): void {
    // Cleanup
  }
}
