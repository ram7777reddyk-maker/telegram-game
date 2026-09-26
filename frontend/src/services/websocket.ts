import type {
  Card,
  PublicGameState,
  PrivatePlayerState
} from "../types/game";

export interface ServerMessage {
  type: string;
  message?: string;
  roomId?: string;
  card?: Card;
  game?: PublicGameState;
  player?: PrivatePlayerState;
}

type MessageHandler =
  (message: ServerMessage) => void;

class GameWebSocket {
  private socket: WebSocket | null = null;

  connect(
    onMessage: MessageHandler,
    onOpen?: () => void,
    onClose?: () => void
  ): void {
    const wsUrl =
      import.meta.env.VITE_WS_URL ||
      "ws://192.168.0.6:3000/ws";

    console.log("Connecting WebSocket:", wsUrl);

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log("WebSocket connected");
      onOpen?.();
    };

    this.socket.onmessage = event => {
      try {
        const message =
          JSON.parse(event.data) as ServerMessage;

        console.log("SERVER:", message);

        onMessage(message);
      } catch (error) {
        console.error(
          "Invalid server message:",
          error
        );
      }
    };

    this.socket.onerror = error => {
      console.error("WebSocket error:", error);
      console.error(
        "WebSocket URL:",
        this.socket?.url
      );
      console.error(
        "WebSocket readyState:",
        this.socket?.readyState
      );
    };

    this.socket.onclose = event => {
      console.error(
        "WebSocket closed:",
        "code=",
        event.code,
        "reason=",
        event.reason,
        "wasClean=",
        event.wasClean
      );

      onClose?.();
    };
  }

  send(
    message: Record<string, unknown>
  ): void {
    if (
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {
      console.error(
        "WebSocket is not connected"
      );

      return;
    }

    console.log("CLIENT:", message);

    this.socket.send(
      JSON.stringify(message)
    );
  }

  createRoom(): void {
    this.send({
      type: "CREATE_ROOM"
    });
  }

  joinRoom(
    roomId: string,
    playerId: string,
    username: string
  ): void {
    this.send({
      type: "JOIN_ROOM",
      roomId,
      playerId,
      username
    });
  }

  startGame(): void {
    this.send({
      type: "START_GAME"
    });
  }

  drawCard(): void {
    this.send({
      type: "DRAW_CARD"
    });
  }

  drawFromDiscard(): void {
    this.send({
      type: "DRAW_FROM_DISCARD"
    });
  }

  reorderCards(
    cardOrder: string[]
  ): void {
    this.send({
      type: "REORDER_CARDS",
      cardOrder
    });
  }

  discardCard(
    cardIndex: number
  ): void {
    this.send({
      type: "DISCARD_CARD",
      cardIndex
    });
  }

  declare(): void {
    this.send({
      type: "DECLARE"
    });
  }

  leaveRoom(): void {
    this.send({
      type: "LEAVE_ROOM"
    });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }
}

export const gameWebSocket =
  new GameWebSocket();
