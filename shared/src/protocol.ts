import {
  CharacterId,
  GameMode,
  GameSnapshot,
  MapId,
  PlayerInput,
  PlayerId,
  RoomId,
  Vec3
} from './types';

// ===== Tipos de Mensagem =====
export enum MessageType {
  // Conexão
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  PING = 'ping',
  PONG = 'pong',

  // Matchmaking
  JOIN_QUEUE = 'join_queue',
  LEAVE_QUEUE = 'leave_queue',
  QUEUE_STATUS = 'queue_status',
  MATCH_FOUND = 'match_found',

  // Sala
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  ROOM_STATE = 'room_state',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',

  // Jogo
  GAME_START = 'game_start',
  GAME_END = 'game_end',
  GAME_STATE = 'game_state',
  PLAYER_INPUT = 'player_input',
  PLAYER_SHOOT = 'player_shoot',
  PLAYER_HIT = 'player_hit',
  PLAYER_DEATH = 'player_death',
  PLAYER_SPAWN = 'player_spawn',

  // Chat (opcional)
  CHAT_MESSAGE = 'chat_message',

  // Erros
  ERROR = 'error',
}

// ===== Mensagens do Cliente para Servidor =====

export interface ConnectMessage {
  type: MessageType.CONNECT;
  playerName: string;
  characterId: CharacterId;
}

export interface PingMessage {
  type: MessageType.PING;
  timestamp: number;
}

export interface JoinQueueMessage {
  type: MessageType.JOIN_QUEUE;
  preferredMode: GameMode;
}

export interface LeaveQueueMessage {
  type: MessageType.LEAVE_QUEUE;
}

export interface PlayerInputMessage {
  type: MessageType.PLAYER_INPUT;
  input: PlayerInput;
}

export interface PlayerShootMessage {
  type: MessageType.PLAYER_SHOOT;
  origin: Vec3;
  direction: Vec3;
  timestamp: number;
}

// ===== Mensagens do Servidor para Cliente =====

export interface PongMessage {
  type: MessageType.PONG;
  timestamp: number;
  serverTime: number;
}

export interface QueueStatusMessage {
  type: MessageType.QUEUE_STATUS;
  position: number;
  playersInQueue: number;
  estimatedWait: number; // segundos
}

export interface MatchFoundMessage {
  type: MessageType.MATCH_FOUND;
  roomId: RoomId;
  mapId: MapId;
  gameMode: GameMode;
  players: Array<{
    id: PlayerId;
    name: string;
    characterId: CharacterId;
    team?: 'red' | 'blue';
  }>;
}

export interface RoomStateMessage {
  type: MessageType.ROOM_STATE;
  roomId: RoomId;
  mapId: MapId;
  gameMode: GameMode;
  status: 'waiting' | 'starting' | 'playing' | 'ended';
  players: Array<{
    id: PlayerId;
    name: string;
    characterId: CharacterId;
    team?: 'red' | 'blue';
    isReady: boolean;
  }>;
  countdown?: number;
}

export interface PlayerJoinedMessage {
  type: MessageType.PLAYER_JOINED;
  playerId: PlayerId;
  playerName: string;
  characterId: CharacterId;
  team?: 'red' | 'blue';
}

export interface PlayerLeftMessage {
  type: MessageType.PLAYER_LEFT;
  playerId: PlayerId;
}

export interface GameStartMessage {
  type: MessageType.GAME_START;
  mapId: MapId;
  gameMode: GameMode;
  duration: number;
  yourSpawnPoint: Vec3;
}

export interface GameEndMessage {
  type: MessageType.GAME_END;
  winner: PlayerId | 'red' | 'blue' | null; // null = empate
  finalScores: Array<{
    playerId: PlayerId;
    kills: number;
    deaths: number;
  }>;
  teamScores?: {
    red: number;
    blue: number;
  };
}

export interface GameStateMessage {
  type: MessageType.GAME_STATE;
  snapshot: GameSnapshot;
}

export interface PlayerHitMessage {
  type: MessageType.PLAYER_HIT;
  targetId: PlayerId;
  damage: number;
  newHealth: number;
  hitPosition: Vec3;
  isHeadshot: boolean;
}

export interface PlayerDeathMessage {
  type: MessageType.PLAYER_DEATH;
  victimId: PlayerId;
  killerId: PlayerId;
  respawnTime: number;
}

export interface PlayerSpawnMessage {
  type: MessageType.PLAYER_SPAWN;
  playerId: PlayerId;
  position: Vec3;
  rotation: number;
}

export interface ErrorMessage {
  type: MessageType.ERROR;
  code: string;
  message: string;
}

// ===== União de todas as mensagens =====
export type ClientMessage =
  | ConnectMessage
  | PingMessage
  | JoinQueueMessage
  | LeaveQueueMessage
  | PlayerInputMessage
  | PlayerShootMessage;

export type ServerMessage =
  | PongMessage
  | QueueStatusMessage
  | MatchFoundMessage
  | RoomStateMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | GameStartMessage
  | GameEndMessage
  | GameStateMessage
  | PlayerHitMessage
  | PlayerDeathMessage
  | PlayerSpawnMessage
  | ErrorMessage;

// ===== Helpers =====
export function createMessage<T extends ClientMessage | ServerMessage>(message: T): string {
  return JSON.stringify(message);
}

export function parseMessage(data: string): ClientMessage | ServerMessage | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
