// ===== Identificadores =====
export type PlayerId = string;
export type RoomId = string;

// ===== Vetores =====
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

// ===== Personagens =====
export type CharacterId =
  | 'matheus'
  | 'rafael'
  | 'jonas'
  | 'valdinei'
  | 'evaldo'
  | 'leon'
  | 'jaja'
  | 'davidson'
  | 'josiane'
  | 'matias'
  | 'brisa';

export interface Character {
  id: CharacterId;
  name: string;
  color: string; // Cor para diferenciar visualmente
}

// ===== Jogador =====
export interface PlayerState {
  id: PlayerId;
  characterId: CharacterId;
  position: Vec3;
  rotation: Vec2; // yaw (horizontal), pitch (vertical)
  velocity: Vec3;
  health: number;
  isAlive: boolean;
  kills: number;
  deaths: number;
  team?: 'red' | 'blue'; // Para TDM
}

export interface PlayerInput {
  sequenceNumber: number;
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  shoot: boolean;
  rotation: Vec2;
  timestamp: number;
}

// ===== Arma =====
export interface WeaponState {
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  lastShotTime: number;
}

// ===== Mapa =====
export type MapId =
  | 'warehouse'
  | 'rooftops'
  | 'bunker'
  | 'arena'
  | 'station'
  | 'cargo'
  | 'office'
  | 'temple'
  | 'factory'
  | 'school'
  | 'hospital'
  | 'prison'
  | 'castle'
  | 'spaceship'
  | 'laboratory';

export interface SpawnPoint {
  position: Vec3;
  rotation: number; // yaw
  team?: 'red' | 'blue';
}

export interface MapData {
  id: MapId;
  name: string;
  spawnPoints: SpawnPoint[];
}

// ===== Modo de Jogo =====
export type GameMode = 'ffa' | 'tdm';

// ===== Sala/Partida =====
export interface RoomState {
  id: RoomId;
  mapId: MapId;
  gameMode: GameMode;
  players: Map<PlayerId, PlayerState>;
  maxPlayers: number;
  timeRemaining: number; // segundos
  status: 'waiting' | 'starting' | 'playing' | 'ended';
  scores: {
    red?: number;
    blue?: number;
  };
}

// ===== Matchmaking =====
export interface MatchmakingEntry {
  playerId: PlayerId;
  preferredMode: GameMode;
  joinedAt: number;
  ping: number;
}

// ===== Eventos de Jogo =====
export interface HitEvent {
  shooterId: PlayerId;
  targetId: PlayerId;
  damage: number;
  hitPosition: Vec3;
  isHeadshot: boolean;
}

export interface KillEvent {
  killerId: PlayerId;
  victimId: PlayerId;
  weapon: string;
}

// ===== Estado do Jogo (enviado do servidor) =====
export interface GameSnapshot {
  tick: number;
  timestamp: number;
  players: PlayerState[];
  events: GameEvent[];
}

export type GameEvent =
  | { type: 'hit'; data: HitEvent }
  | { type: 'kill'; data: KillEvent }
  | { type: 'spawn'; data: { playerId: PlayerId; position: Vec3 } };
