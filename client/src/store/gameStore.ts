import { create } from 'zustand';
import { CharacterId, GameMode, MapId, PlayerState } from 'shared';

type Screen = 'menu' | 'character-select' | 'matchmaking' | 'game';

interface GameState {
  // Navigation
  screen: Screen;
  setScreen: (screen: Screen) => void;

  // Player info
  playerName: string;
  setPlayerName: (name: string) => void;
  selectedCharacter: CharacterId;
  setSelectedCharacter: (character: CharacterId) => void;

  // Game mode
  selectedMode: GameMode;
  setSelectedMode: (mode: GameMode) => void;

  // Matchmaking
  queuePosition: number;
  playersInQueue: number;
  estimatedWait: number;
  setQueueStatus: (position: number, playersInQueue: number, estimatedWait: number) => void;

  // Match info
  currentMapId: MapId | null;
  setCurrentMapId: (mapId: MapId | null) => void;

  // Game state
  localPlayerId: string | null;
  setLocalPlayerId: (id: string | null) => void;
  players: Map<string, PlayerState>;
  setPlayers: (players: Map<string, PlayerState>) => void;
  updatePlayer: (playerId: string, state: Partial<PlayerState>) => void;

  // Local player state
  health: number;
  setHealth: (health: number) => void;
  ammo: number;
  setAmmo: (ammo: number) => void;
  kills: number;
  deaths: number;
  setScore: (kills: number, deaths: number) => void;

  // Game status
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  timeRemaining: number;
  setTimeRemaining: (time: number) => void;

  // Scoreboard
  showScoreboard: boolean;
  setShowScoreboard: (show: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  screen: 'menu' as Screen,
  playerName: '',
  selectedCharacter: 'matheus' as CharacterId,
  selectedMode: 'ffa' as GameMode,
  queuePosition: 0,
  playersInQueue: 0,
  estimatedWait: 0,
  currentMapId: null as MapId | null,
  localPlayerId: null as string | null,
  players: new Map<string, PlayerState>(),
  health: 100,
  ammo: 30,
  kills: 0,
  deaths: 0,
  isPlaying: false,
  timeRemaining: 300,
  showScoreboard: false,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setScreen: (screen) => set({ screen }),
  setPlayerName: (playerName) => set({ playerName }),
  setSelectedCharacter: (selectedCharacter) => set({ selectedCharacter }),
  setSelectedMode: (selectedMode) => set({ selectedMode }),

  setQueueStatus: (queuePosition, playersInQueue, estimatedWait) =>
    set({ queuePosition, playersInQueue, estimatedWait }),

  setCurrentMapId: (currentMapId) => set({ currentMapId }),
  setLocalPlayerId: (localPlayerId) => set({ localPlayerId }),

  setPlayers: (players) => set({ players }),

  updatePlayer: (playerId, state) => {
    const players = new Map(get().players);
    const current = players.get(playerId);
    if (current) {
      players.set(playerId, { ...current, ...state });
      set({ players });
    }
  },

  setHealth: (health) => set({ health }),
  setAmmo: (ammo) => set({ ammo }),
  setScore: (kills, deaths) => set({ kills, deaths }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setTimeRemaining: (timeRemaining) => set({ timeRemaining }),
  setShowScoreboard: (showScoreboard) => set({ showScoreboard }),

  reset: () => set(initialState),
}));
