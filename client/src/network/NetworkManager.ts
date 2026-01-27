import {
  MessageType,
  ClientMessage,
  ServerMessage,
  CharacterId,
  GameMode,
  Vec3,
  PlayerInput,
  parseMessage,
  createMessage,
} from 'shared';
import { useGameStore } from '../store/gameStore';

type MessageHandler = (message: ServerMessage) => void;

export class NetworkManager {
  private static instance: NetworkManager | null = null;
  private ws: WebSocket | null = null;
  private handlers: Map<MessageType, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private pingInterval: number | null = null;
  private lastPingTime = 0;
  private latency = 0;

  private constructor() {}

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('Connected to server');
          this.reconnectAttempts = 0;
          this.startPing();
          resolve();
        };

        this.ws.onmessage = (event) => {
          const message = parseMessage(event.data);
          if (message) {
            this.handleMessage(message as ServerMessage);
          }
        };

        this.ws.onclose = () => {
          console.log('Disconnected from server');
          this.stopPing();
          this.handleDisconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      // Could implement auto-reconnect here
    }
  }

  private startPing(): void {
    this.pingInterval = window.setInterval(() => {
      this.lastPingTime = Date.now();
      this.send({
        type: MessageType.PING,
        timestamp: this.lastPingTime,
      });
    }, 1000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(message: ServerMessage): void {
    // Handle built-in messages
    switch (message.type) {
      case MessageType.CONNECTED:
        console.log('Connected with player ID:', message.playerId);
        useGameStore.getState().setLocalPlayerId(message.playerId);
        break;

      case MessageType.PONG:
        this.latency = Date.now() - message.timestamp;
        break;

      case MessageType.QUEUE_STATUS:
        useGameStore.getState().setQueueStatus(
          message.position,
          message.playersInQueue,
          message.estimatedWait
        );
        break;

      case MessageType.MATCH_FOUND:
        console.log('Match found!', message);
        useGameStore.getState().setCurrentMapId(message.mapId);
        useGameStore.getState().setScreen('game');
        break;

      case MessageType.GAME_STATE:
        this.handleGameState(message);
        break;

      case MessageType.PLAYER_HIT:
        this.handlePlayerHit(message);
        break;

      case MessageType.PLAYER_DEATH:
        this.handlePlayerDeath(message);
        break;

      case MessageType.PLAYER_SPAWN:
        this.handlePlayerSpawn(message);
        break;

      case MessageType.GAME_START:
        useGameStore.getState().setIsPlaying(true);
        break;

      case MessageType.GAME_END:
        useGameStore.getState().setIsPlaying(false);
        useGameStore.getState().setScreen('menu');
        break;
    }

    // Call registered handlers
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  private handleGameState(message: any): void {
    const store = useGameStore.getState();
    const snapshot = message.snapshot;

    // Update players
    const playersMap = new Map();
    snapshot.players.forEach((player: any) => {
      playersMap.set(player.id, player);

      // Update local player stats
      if (player.id === store.localPlayerId) {
        store.setHealth(player.health);
        store.setScore(player.kills, player.deaths);
      }
    });
    store.setPlayers(playersMap);
  }

  private handlePlayerHit(message: any): void {
    const store = useGameStore.getState();
    if (message.targetId === store.localPlayerId) {
      store.setHealth(message.newHealth);
    }
  }

  private handlePlayerDeath(message: any): void {
    // Could show death screen or effect
    console.log(`Player ${message.victimId} killed by ${message.killerId}`);
  }

  private handlePlayerSpawn(message: any): void {
    const store = useGameStore.getState();
    if (message.playerId === store.localPlayerId) {
      store.setHealth(100);
    }
  }

  on(type: MessageType, handler: MessageHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  off(type: MessageType, handler: MessageHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private send(message: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(createMessage(message));
    }
  }

  // Public API
  sendConnect(playerName: string, characterId: CharacterId): void {
    this.send({
      type: MessageType.CONNECT,
      playerName,
      characterId,
    });
  }

  joinQueue(preferredMode: GameMode): void {
    this.send({
      type: MessageType.JOIN_QUEUE,
      preferredMode,
    });
  }

  leaveQueue(): void {
    this.send({
      type: MessageType.LEAVE_QUEUE,
    });
  }

  sendInput(input: PlayerInput): void {
    this.send({
      type: MessageType.PLAYER_INPUT,
      input,
    });
  }

  sendShoot(origin: Vec3, direction: Vec3): void {
    this.send({
      type: MessageType.PLAYER_SHOOT,
      origin,
      direction,
      timestamp: Date.now(),
    });
  }

  getLatency(): number {
    return this.latency;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
