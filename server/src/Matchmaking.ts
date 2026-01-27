import {
  PlayerId,
  GameMode,
  MatchmakingEntry,
  MessageType,
  MATCH,
} from 'shared';
import { GameServer } from './GameServer';

export class Matchmaking {
  private server: GameServer;
  private ffaQueue: Map<PlayerId, MatchmakingEntry> = new Map();
  private tdmQueue: Map<PlayerId, MatchmakingEntry> = new Map();
  private lastMatchAttempt: number = 0;
  private readonly MATCH_INTERVAL = 2000; // Try to match every 2 seconds

  constructor(server: GameServer) {
    this.server = server;
  }

  addPlayer(playerId: PlayerId, preferredMode: GameMode, ping: number): void {
    const entry: MatchmakingEntry = {
      playerId,
      preferredMode,
      joinedAt: Date.now(),
      ping,
    };

    if (preferredMode === 'ffa') {
      this.ffaQueue.set(playerId, entry);
    } else {
      this.tdmQueue.set(playerId, entry);
    }

    this.sendQueueStatus(playerId, preferredMode);
  }

  removePlayer(playerId: PlayerId): void {
    this.ffaQueue.delete(playerId);
    this.tdmQueue.delete(playerId);
  }

  tick(): void {
    const now = Date.now();

    if (now - this.lastMatchAttempt < this.MATCH_INTERVAL) {
      return;
    }

    this.lastMatchAttempt = now;

    // Try to form matches
    this.tryFormMatch('ffa');
    this.tryFormMatch('tdm');

    // Update queue status for all players
    this.ffaQueue.forEach((_, playerId) => this.sendQueueStatus(playerId, 'ffa'));
    this.tdmQueue.forEach((_, playerId) => this.sendQueueStatus(playerId, 'tdm'));
  }

  private tryFormMatch(mode: GameMode): void {
    const queue = mode === 'ffa' ? this.ffaQueue : this.tdmQueue;

    if (queue.size < MATCH.MIN_PLAYERS) {
      return;
    }

    // Sort by join time (FIFO)
    const sortedPlayers = Array.from(queue.values())
      .sort((a, b) => a.joinedAt - b.joinedAt);

    // Try to group by similar ping
    const groups = this.groupByPing(sortedPlayers);

    for (const group of groups) {
      if (group.length >= MATCH.MIN_PLAYERS) {
        // Take up to MAX_PLAYERS
        const matchPlayers = group.slice(0, MATCH.MAX_PLAYERS);
        this.createMatch(matchPlayers, mode);
        return;
      }
    }

    // If no groups have enough players but total queue does, just take first players
    if (sortedPlayers.length >= MATCH.MIN_PLAYERS) {
      const matchPlayers = sortedPlayers.slice(0, MATCH.MAX_PLAYERS);
      this.createMatch(matchPlayers, mode);
    }
  }

  private groupByPing(players: MatchmakingEntry[]): MatchmakingEntry[][] {
    const groups: MatchmakingEntry[][] = [];
    const used = new Set<PlayerId>();
    const PING_THRESHOLD = 50; // ms

    for (const player of players) {
      if (used.has(player.playerId)) continue;

      const group: MatchmakingEntry[] = [player];
      used.add(player.playerId);

      for (const other of players) {
        if (used.has(other.playerId)) continue;

        if (Math.abs(player.ping - other.ping) <= PING_THRESHOLD) {
          group.push(other);
          used.add(other.playerId);
        }
      }

      groups.push(group);
    }

    // Sort groups by size (largest first)
    return groups.sort((a, b) => b.length - a.length);
  }

  private createMatch(entries: MatchmakingEntry[], mode: GameMode): void {
    const playerIds = entries.map(e => e.playerId);

    // Remove from queue
    const queue = mode === 'ffa' ? this.ffaQueue : this.tdmQueue;
    playerIds.forEach(id => queue.delete(id));

    // Create room
    const room = this.server.createRoom(playerIds, mode);

    // Notify players
    const players = playerIds.map(id => {
      const player = this.server.getPlayer(id);
      return {
        id,
        name: player?.name || 'Unknown',
        characterId: player?.characterId || 'matheus',
        team: mode === 'tdm' ? (playerIds.indexOf(id) < playerIds.length / 2 ? 'red' : 'blue') as 'red' | 'blue' : undefined,
      };
    });

    playerIds.forEach(playerId => {
      this.server.sendToPlayer(playerId, {
        type: MessageType.MATCH_FOUND,
        roomId: room.id,
        mapId: 'warehouse', // Will be set by room
        gameMode: mode,
        players,
      });
    });

    console.log(`Match created: ${playerIds.length} players in ${mode} mode`);
  }

  private sendQueueStatus(playerId: PlayerId, mode: GameMode): void {
    const queue = mode === 'ffa' ? this.ffaQueue : this.tdmQueue;
    const entry = queue.get(playerId);

    if (!entry) return;

    const position = Array.from(queue.values())
      .filter(e => e.joinedAt <= entry.joinedAt)
      .length;

    const estimatedWait = Math.max(0,
      (MATCH.MIN_PLAYERS - queue.size) * 5 // Rough estimate: 5s per player needed
    );

    this.server.sendToPlayer(playerId, {
      type: MessageType.QUEUE_STATUS,
      position,
      playersInQueue: queue.size,
      estimatedWait,
    });
  }
}
