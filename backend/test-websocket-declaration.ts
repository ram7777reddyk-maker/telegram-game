import WebSocket from "ws";

const ws1 = new WebSocket("ws://localhost:3000/ws");
const ws2 = new WebSocket("ws://localhost:3000/ws");

let roomId: string | null = null;
let gameStarted = false;

function send(ws: WebSocket, message: unknown) {
  ws.send(JSON.stringify(message));
}

ws1.on("open", () => {
  console.log("PLAYER 1 CONNECTED");

  send(ws1, {
    type: "CREATE_ROOM"
  });
});

ws2.on("open", () => {
  console.log("PLAYER 2 CONNECTED");
});

ws1.on("message", (data) => {
  const message = JSON.parse(data.toString());

  console.log(
    "PLAYER 1:",
    JSON.stringify(message, null, 2)
  );

  if (message.type === "ROOM_CREATED") {
    roomId = message.roomId;

    send(ws2, {
      type: "JOIN_ROOM",
      roomId,
      playerId: "player-002",
      username: "Player2"
    });

    return;
  }

  if (
    message.type === "PLAYER_JOINED" &&
    message.playerId === "player-001"
  ) {
    console.log("PLAYER 1 JOIN SUCCESS");

    send(ws1, {
      type: "START_GAME"
    });

    return;
  }

  if (message.type === "GAME_STARTED") {
    if (gameStarted) {
      return;
    }

    gameStarted = true;

    console.log("");
    console.log("GAME STARTED");
    console.log("");
    console.log("TEST 1: INVALID DECLARATION");

    setTimeout(() => {
      send(ws2, {
        type: "DECLARE"
      });
    }, 500);

    return;
  }
});

ws2.on("message", (data) => {
  const message = JSON.parse(data.toString());

  console.log(
    "PLAYER 2:",
    JSON.stringify(message, null, 2)
  );

  if (
    message.type === "PLAYER_JOINED" &&
    message.playerId === "player-002"
  ) {
    console.log("PLAYER 2 JOIN SUCCESS");

    send(ws1, {
      type: "JOIN_ROOM",
      roomId,
      playerId: "player-001",
      username: "Player1"
    });

    return;
  }

  if (message.type === "INVALID_DECLARATION") {
    console.log("");
    console.log("INVALID DECLARATION RECEIVED");
    console.log("TEST 1 PASSED");

    console.log("");
    console.log(
      "TEST 2: DRAW AFTER INVALID DECLARATION"
    );

    setTimeout(() => {
      send(ws2, {
        type: "DRAW_CARD"
      });
    }, 500);

    return;
  }

  if (message.type === "CARD_DRAWN") {
    console.log(
      "PLAYER 2 DRAW AFTER INVALID DECLARATION: PASSED"
    );

    console.log("");
    console.log(
      "TEST 3: DISCARD AFTER INVALID DECLARATION"
    );

    setTimeout(() => {
      send(ws2, {
        type: "DISCARD_CARD",
        cardIndex: 0
      });
    }, 300);

    return;
  }

  if (message.type === "CARD_DISCARDED") {
    console.log(
      "PLAYER 2 DISCARD AFTER INVALID DECLARATION: PASSED"
    );

    console.log("");
    console.log(
      "=== INVALID DECLARATION TEST PASSED ==="
    );

    ws1.close();
    ws2.close();

    setTimeout(() => {
      process.exit(0);
    }, 300);

    return;
  }

  if (message.type === "ERROR") {
    console.error("");
    console.error(
      "TEST FAILED:",
      message.message
    );

    ws1.close();
    ws2.close();

    setTimeout(() => {
      process.exit(1);
    }, 300);
  }
});
