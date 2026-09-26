import { WebSocket } from "ws";

export interface GamePlayer {
  playerId: string;
  socket: WebSocket;
  username?: string;
}

export interface GameRoom {
  roomId: string;
  players: Map<string, GamePlayer>;
  createdAt: Date;
}

class GameRoomManager {
  private rooms = new Map<string, GameRoom>();

  createRoom(): GameRoom {
    const roomId = crypto.randomUUID();

    const room: GameRoom = {
      roomId,
      players: new Map(),
      createdAt: new Date()
    };

    this.rooms.set(roomId, room);

    return room;
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  joinRoom(
    roomId: string,
    playerId: string,
    socket: WebSocket,
    username?: string
  ): boolean {
    const room = this.rooms.get(roomId);

    if (!room) {
      return false;
    }

    room.players.set(playerId, {
      playerId,
      socket,
      username
    });

    return true;
  }

  leaveRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);

    if (!room) {
      return;
    }

    room.players.delete(playerId);

    if (room.players.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  broadcast(roomId: string, message: unknown): void {
    const room = this.rooms.get(roomId);

    if (!room) {
      return;
    }

    const payload = JSON.stringify(message);

    for (const player of room.players.values()) {
      if (player.socket.readyState === WebSocket.OPEN) {
        player.socket.send(payload);
      }
    }
  }

  getRoomPlayerCount(roomId: string): number {
    return this.rooms.get(roomId)?.players.size ?? 0;
  }
}

export const gameRoomManager = new GameRoomManager();
