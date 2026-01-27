import { Character, CharacterId, MapData, MapId } from './types';

// ===== Configurações de Rede =====
export const NETWORK = {
  TICK_RATE: 20, // Atualizações por segundo do servidor
  CLIENT_UPDATE_RATE: 60, // FPS alvo do cliente
  INTERPOLATION_DELAY: 100, // ms de delay para interpolação
  MAX_PREDICTION_FRAMES: 10, // Máximo de frames para client-side prediction
} as const;

// ===== Configurações do Jogador =====
export const PLAYER = {
  MAX_HEALTH: 100,
  MOVE_SPEED: 8, // unidades por segundo
  JUMP_FORCE: 5,
  GRAVITY: -20,
  HEIGHT: 1.8, // metros
  RADIUS: 0.4, // metros (para colisão)
  RESPAWN_TIME: 3000, // ms
  MOUSE_SENSITIVITY: 0.002,
} as const;

// ===== Configurações da Arma =====
export const WEAPON = {
  DAMAGE: 15,
  HEADSHOT_MULTIPLIER: 2.5,
  FIRE_RATE: 600, // RPM (rounds per minute)
  MAX_AMMO: 30,
  RELOAD_TIME: 2000, // ms
  RANGE: 100, // metros
  SPREAD: 0.02, // radianos
} as const;

// ===== Configurações da Partida =====
export const MATCH = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  DURATION: 300, // segundos (5 minutos)
  COUNTDOWN: 5, // segundos antes de começar
  SCORE_TO_WIN_FFA: 20, // kills para vencer no FFA
  SCORE_TO_WIN_TDM: 30, // kills do time para vencer no TDM
} as const;

// ===== Personagens =====
export const CHARACTERS: Record<CharacterId, Character> = {
  matheus: { id: 'matheus', name: 'Matheus', color: '#e74c3c' },
  rafael: { id: 'rafael', name: 'Rafael', color: '#3498db' },
  jonas: { id: 'jonas', name: 'Jonas', color: '#2ecc71' },
  valdinei: { id: 'valdinei', name: 'Valdinei', color: '#9b59b6' },
  evaldo: { id: 'evaldo', name: 'Evaldo', color: '#f39c12' },
  leon: { id: 'leon', name: 'Leon', color: '#1abc9c' },
  jaja: { id: 'jaja', name: 'Jajá', color: '#e91e63' },
  davidson: { id: 'davidson', name: 'Davidson', color: '#00bcd4' },
  josiane: { id: 'josiane', name: 'Josiane', color: '#ff5722' },
  matias: { id: 'matias', name: 'Matias', color: '#795548' },
  brisa: { id: 'brisa', name: 'Brisa', color: '#607d8b' },
};

// ===== Mapas =====
export const MAPS: Record<MapId, MapData> = {
  warehouse: {
    id: 'warehouse',
    name: 'Warehouse',
    spawnPoints: [
      { position: { x: -10, y: 1, z: -10 }, rotation: 0.785 },
      { position: { x: 10, y: 1, z: -10 }, rotation: 2.356 },
      { position: { x: 10, y: 1, z: 10 }, rotation: 3.927 },
      { position: { x: -10, y: 1, z: 10 }, rotation: 5.498 },
      { position: { x: 0, y: 1, z: 0 }, rotation: 0 },
      { position: { x: 0, y: 5, z: 0 }, rotation: 3.14 },
    ],
  },
  rooftops: {
    id: 'rooftops',
    name: 'Rooftops',
    spawnPoints: [
      { position: { x: -15, y: 10, z: -15 }, rotation: 0.785 },
      { position: { x: 15, y: 10, z: -15 }, rotation: 2.356 },
      { position: { x: 15, y: 15, z: 15 }, rotation: 3.927 },
      { position: { x: -15, y: 15, z: 15 }, rotation: 5.498 },
      { position: { x: 0, y: 12, z: 0 }, rotation: 0 },
      { position: { x: 5, y: 8, z: -5 }, rotation: 1.57 },
    ],
  },
  bunker: {
    id: 'bunker',
    name: 'Bunker',
    spawnPoints: [
      { position: { x: -8, y: 1, z: -8 }, rotation: 0.785 },
      { position: { x: 8, y: 1, z: -8 }, rotation: 2.356 },
      { position: { x: 8, y: 1, z: 8 }, rotation: 3.927 },
      { position: { x: -8, y: 1, z: 8 }, rotation: 5.498 },
      { position: { x: 0, y: -3, z: 0 }, rotation: 0 },
      { position: { x: 0, y: 1, z: 0 }, rotation: 3.14 },
    ],
  },
  arena: {
    id: 'arena',
    name: 'Arena',
    spawnPoints: [
      { position: { x: -12, y: 1, z: 0 }, rotation: 0 },
      { position: { x: 12, y: 1, z: 0 }, rotation: 3.14 },
      { position: { x: 0, y: 1, z: -12 }, rotation: 1.57 },
      { position: { x: 0, y: 1, z: 12 }, rotation: 4.71 },
      { position: { x: -8, y: 5, z: -8 }, rotation: 0.785 },
      { position: { x: 8, y: 5, z: 8 }, rotation: 3.927 },
    ],
  },
  station: {
    id: 'station',
    name: 'Station',
    spawnPoints: [
      { position: { x: -20, y: 1, z: 0 }, rotation: 0 },
      { position: { x: 20, y: 1, z: 0 }, rotation: 3.14 },
      { position: { x: 0, y: 1, z: -5 }, rotation: 1.57 },
      { position: { x: 0, y: 1, z: 5 }, rotation: 4.71 },
      { position: { x: -10, y: 4, z: 3 }, rotation: 0 },
      { position: { x: 10, y: 4, z: -3 }, rotation: 3.14 },
    ],
  },
  cargo: {
    id: 'cargo',
    name: 'Cargo',
    spawnPoints: [
      { position: { x: -15, y: 1, z: -10 }, rotation: 0.5 },
      { position: { x: 15, y: 1, z: -10 }, rotation: 2.6 },
      { position: { x: 15, y: 1, z: 10 }, rotation: 3.6 },
      { position: { x: -15, y: 1, z: 10 }, rotation: 5.7 },
      { position: { x: 0, y: 6, z: 0 }, rotation: 0 },
      { position: { x: -5, y: 3, z: 5 }, rotation: 1.57 },
    ],
  },
  office: {
    id: 'office',
    name: 'Office',
    spawnPoints: [
      { position: { x: -10, y: 1, z: -10 }, rotation: 0.785 },
      { position: { x: 10, y: 1, z: -10 }, rotation: 2.356 },
      { position: { x: 10, y: 4, z: 10 }, rotation: 3.927 },
      { position: { x: -10, y: 4, z: 10 }, rotation: 5.498 },
      { position: { x: 0, y: 1, z: 0 }, rotation: 0 },
      { position: { x: 0, y: 4, z: 0 }, rotation: 3.14 },
    ],
  },
  temple: {
    id: 'temple',
    name: 'Temple',
    spawnPoints: [
      { position: { x: -12, y: 1, z: -12 }, rotation: 0.785 },
      { position: { x: 12, y: 1, z: -12 }, rotation: 2.356 },
      { position: { x: 12, y: 1, z: 12 }, rotation: 3.927 },
      { position: { x: -12, y: 1, z: 12 }, rotation: 5.498 },
      { position: { x: 0, y: 8, z: 0 }, rotation: 0 },
      { position: { x: 0, y: 1, z: 0 }, rotation: 3.14 },
    ],
  },
  factory: {
    id: 'factory',
    name: 'Factory',
    spawnPoints: [
      { position: { x: -18, y: 1, z: -8 }, rotation: 0 },
      { position: { x: 18, y: 1, z: -8 }, rotation: 3.14 },
      { position: { x: 18, y: 1, z: 8 }, rotation: 3.14 },
      { position: { x: -18, y: 1, z: 8 }, rotation: 0 },
      { position: { x: 0, y: 6, z: 0 }, rotation: 1.57 },
      { position: { x: -8, y: 3, z: 0 }, rotation: 0 },
    ],
  },
  school: {
    id: 'school',
    name: 'School',
    spawnPoints: [
      { position: { x: -12, y: 1, z: -12 }, rotation: 0.785 },
      { position: { x: 12, y: 1, z: -12 }, rotation: 2.356 },
      { position: { x: 12, y: 4, z: 12 }, rotation: 3.927 },
      { position: { x: -12, y: 4, z: 12 }, rotation: 5.498 },
      { position: { x: 0, y: 1, z: 0 }, rotation: 0 },
      { position: { x: 5, y: 4, z: -5 }, rotation: 2.356 },
    ],
  },
  hospital: {
    id: 'hospital',
    name: 'Hospital',
    spawnPoints: [
      { position: { x: -10, y: 1, z: -10 }, rotation: 0.785 },
      { position: { x: 10, y: 1, z: -10 }, rotation: 2.356 },
      { position: { x: 10, y: 4, z: 10 }, rotation: 3.927 },
      { position: { x: -10, y: 4, z: 10 }, rotation: 5.498 },
      { position: { x: 0, y: 7, z: 0 }, rotation: 0 },
      { position: { x: -5, y: 1, z: 5 }, rotation: 5.498 },
    ],
  },
  prison: {
    id: 'prison',
    name: 'Prison',
    spawnPoints: [
      { position: { x: -15, y: 1, z: -8 }, rotation: 0 },
      { position: { x: 15, y: 1, z: -8 }, rotation: 3.14 },
      { position: { x: 15, y: 4, z: 8 }, rotation: 3.14 },
      { position: { x: -15, y: 4, z: 8 }, rotation: 0 },
      { position: { x: 0, y: 1, z: 0 }, rotation: 1.57 },
      { position: { x: 0, y: 7, z: 0 }, rotation: 4.71 },
    ],
  },
  castle: {
    id: 'castle',
    name: 'Castle',
    spawnPoints: [
      { position: { x: -15, y: 1, z: -15 }, rotation: 0.785 },
      { position: { x: 15, y: 1, z: -15 }, rotation: 2.356 },
      { position: { x: 15, y: 8, z: 15 }, rotation: 3.927 },
      { position: { x: -15, y: 8, z: 15 }, rotation: 5.498 },
      { position: { x: 0, y: 12, z: 0 }, rotation: 0 },
      { position: { x: 0, y: 1, z: 0 }, rotation: 3.14 },
    ],
  },
  spaceship: {
    id: 'spaceship',
    name: 'Spaceship',
    spawnPoints: [
      { position: { x: -8, y: 1, z: -15 }, rotation: 1.57 },
      { position: { x: 8, y: 1, z: -15 }, rotation: 1.57 },
      { position: { x: 8, y: 1, z: 15 }, rotation: 4.71 },
      { position: { x: -8, y: 1, z: 15 }, rotation: 4.71 },
      { position: { x: 0, y: 4, z: 0 }, rotation: 0 },
      { position: { x: 0, y: 1, z: 0 }, rotation: 3.14 },
    ],
  },
  laboratory: {
    id: 'laboratory',
    name: 'Laboratory',
    spawnPoints: [
      { position: { x: -10, y: 1, z: -10 }, rotation: 0.785 },
      { position: { x: 10, y: 1, z: -10 }, rotation: 2.356 },
      { position: { x: 10, y: 1, z: 10 }, rotation: 3.927 },
      { position: { x: -10, y: 1, z: 10 }, rotation: 5.498 },
      { position: { x: 0, y: -2, z: 0 }, rotation: 0 },
      { position: { x: 5, y: 4, z: 5 }, rotation: 3.927 },
    ],
  },
};

// ===== Lista de IDs =====
export const CHARACTER_IDS: CharacterId[] = Object.keys(CHARACTERS) as CharacterId[];
export const MAP_IDS: MapId[] = Object.keys(MAPS) as MapId[];
