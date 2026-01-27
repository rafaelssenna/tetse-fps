import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import {
  MessageType,
  ClientMessage,
  ServerMessage,
  parseMessage,
  createMessage,
  PlayerId,
  CharacterId,
  GameMode,
  NETWORK,
} from 'shared';
import { Room } from './Room.js';
import { Matchmaking } from './Matchmaking.js';

interface ConnectedPlayer {
  id: PlayerId;
  ws: WebSocket;
  name: string;
  characterId: CharacterId;
  currentRoomId: string | null;
  lastPing: number;
  ping: number;
}

export class GameServer {
  private wss: WebSocketServer | null = null;
  private players: Map<PlayerId, ConnectedPlayer> = new Map();
  private playersBySocket: Map<WebSocket, PlayerId> = new Map();
  private rooms: Map<string, Room> = new Map();
  private matchmaking: Matchmaking;
  private tickInterval: NodeJS.Timeout | null = null;
  private port: number;

  constructor(port: number) {
    this.port = port;
    this.matchmaking = new Matchmaking(this);
  }

  start(): void {
    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on('connection', (ws) => this.handleConnection(ws));
    this.wss.on('error', (error) => console.error('WebSocket Server Error:', error));

    // Game loop
    this.tickInterval = setInterval(() => this.tick(), 1000 / NETWORK.TICK_RATE);

    console.log(`🎮 Game Server started on port ${this.port}`);
    console.log(`📡 Tick rate: ${NETWORK.TICK_RATE}Hz`);
  }

  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }

    this.rooms.forEach(room => room.stop());
    this.rooms.clear();

    this.wss?.close();
    console.log('Server stopped');
  }

  private handleConnection(ws: WebSocket): void {
    const tempId = uuidv4();
    console.log(`New connection: ${tempId}`);

    ws.on('message', (data) => {
      try {
        const message = parseMessage(data.toString());
        if (message) {
          this.handleMessage(ws, message as ClientMessage, tempId);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      const playerId = this.playersBySocket.get(ws);
      if (playerId) {
        this.handleDisconnect(playerId);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  private handleMessage(ws: WebSocket, message: ClientMessage, tempId: string): void {
    switch (message.type) {
      case MessageType.CONNECT:
        this.handleConnect(ws, message.playerName, message.characterId, tempId);
        break;

      case MessageType.PING:
        this.handlePing(ws, message.timestamp);
        break;

      case MessageType.JOIN_QUEUE:
        this.handleJoinQueue(ws, message.preferredMode);
        break;

      case MessageType.LEAVE_QUEUE:
        this.handleLeaveQueue(ws);
        break;

      case MessageType.PLAYER_INPUT:
        this.handlePlayerInput(ws, message.input);
        break;

      case MessageType.PLAYER_SHOOT:
        this.handlePlayerShoot(ws, message.origin, message.direction, message.timestamp);
        break;
    }
  }

  private handleConnect(ws: WebSocket, name: string, characterId: CharacterId, tempId: string): void {
    const playerId = tempId;

    const player: ConnectedPlayer = {
      id: playerId,
      ws,
      name: name || `Player_${playerId.substring(0, 4)}`,
      characterId,
      currentRoomId: null,
      lastPing: Date.now(),
      ping: 0,
    };

    this.players.set(playerId, player);
    this.playersBySocket.set(ws, playerId);

    console.log(`Player connected: ${player.name} (${playerId}) as ${characterId}`);

    // Send confirmation
    this.sendToPlayer(playerId, {
      type: MessageType.PONG,
      timestamp: Date.now(),
      serverTime: Date.now(),
    });
  }

  private handleDisconnect(playerId: PlayerId): void {
    const player = this.players.get(playerId);
    if (!player) return;

    console.log(`Player disconnected: ${player.name} (${playerId})`);

    // Remove from matchmaking
    this.matchmaking.removePlayer(playerId);

    // Remove from room
    if (player.currentRoomId) {
      const room = this.rooms.get(player.currentRoomId);
      if (room) {
        room.removePlayer(playerId);
        if (room.isEmpty()) {
          this.rooms.delete(player.currentRoomId);
          console.log(`Room ${player.currentRoomId} closed (empty)`);
        }
      }
    }

    this.playersBySocket.delete(player.ws);
    this.players.delete(playerId);
  }

  private handlePing(ws: WebSocket, timestamp: number): void {
    const playerId = this.playersBySocket.get(ws);
    if (playerId) {
      const player = this.players.get(playerId);
      if (player) {
        player.ping = Date.now() - timestamp;
        player.lastPing = Date.now();
      }
    }

    this.send(ws, {
      type: MessageType.PONG,
      timestamp,
      serverTime: Date.now(),
    });
  }

  private handleJoinQueue(ws: WebSocket, preferredMode: GameMode): void {
    const playerId = this.playersBySocket.get(ws);
    if (!playerId) return;

    const player = this.players.get(playerId);
    if (!player) return;

    this.matchmaking.addPlayer(playerId, preferredMode, player.ping);
    console.log(`${player.name} joined ${preferredMode} queue`);
  }

  private handleLeaveQueue(ws: WebSocket): void {
    const playerId = this.playersBySocket.get(ws);
    if (!playerId) return;

    this.matchmaking.removePlayer(playerId);
  }

  private handlePlayerInput(ws: WebSocket, input: any): void {
    const playerId = this.playersBySocket.get(ws);
    if (!playerId) return;

    const player = this.players.get(playerId);
    if (!player || !player.currentRoomId) return;

    const room = this.rooms.get(player.currentRoomId);
    if (room) {
      room.handlePlayerInput(playerId, input);
    }
  }

  private handlePlayerShoot(ws: WebSocket, origin: any, direction: any, timestamp: number): void {
    const playerId = this.playersBySocket.get(ws);
    if (!playerId) return;

    const player = this.players.get(playerId);
    if (!player || !player.currentRoomId) return;

    const room = this.rooms.get(player.currentRoomId);
    if (room) {
      room.handlePlayerShoot(playerId, origin, direction, timestamp);
    }
  }

  private tick(): void {
    // Update all rooms
    this.rooms.forEach(room => room.tick());

    // Process matchmaking
    this.matchmaking.tick();
  }

  // Public methods for Matchmaking
  createRoom(playerIds: PlayerId[], gameMode: GameMode): Room {
    const roomId = uuidv4();
    const room = new Room(roomId, gameMode, this);
    this.rooms.set(roomId, room);

    playerIds.forEach(playerId => {
      const player = this.players.get(playerId);
      if (player) {
        player.currentRoomId = roomId;
        room.addPlayer(playerId, player.name, player.characterId);
      }
    });

    console.log(`Room ${roomId} created with ${playerIds.length} players (${gameMode})`);
    return room;
  }

  getPlayer(playerId: PlayerId): ConnectedPlayer | undefined {
    return this.players.get(playerId);
  }

  sendToPlayer(playerId: PlayerId, message: ServerMessage): void {
    const player = this.players.get(playerId);
    if (player && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(createMessage(message));
    }
  }

  private send(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(createMessage(message));
    }
  }

  broadcast(message: ServerMessage, excludePlayerId?: PlayerId): void {
    const data = createMessage(message);
    this.players.forEach((player, playerId) => {
      if (playerId !== excludePlayerId && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(data);
      }
    });
  }
}
