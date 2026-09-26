import WebSocket from "ws";

const ws1 = new WebSocket("ws://localhost:3000/ws");
const ws2 = new WebSocket("ws://localhost:3000/ws");

let roomId = "";
let player1Joined = false;
let gameStarted = false;

function send(ws: WebSocket, message: unknown) {
  ws.send(JSON.stringify(message));
}

function handleMessage(
  playerName: string,
  ws: WebSocket,
  message: any
) {
  console.log(
    `${playerName}:`,
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
    message.playerId === "player-002" &&
    !player1Joined
  ) {
    player1Joined = true;

    send(ws1, {
      type: "JOIN_ROOM",
      roomId,
      playerId: "player-001",
      username: "Player1"
    });

    return;
  }

  if (
    message.type === "PLAYER_JOINED" &&
    message.playerCount === 2 &&
    !gameStarted
  ) {
    gameStarted = true;

    send(ws1, {
      type: "START_GAME"
    });

    return;
  }

  if (
    message.type === "GAME_STARTED"
  ) {
    console.log("");
    console.log(
      "WILD JOKER:",
      message.game.wildJokerRank
    );

    console.log(
      "CURRENT PLAYER:",
      message.game.currentPlayerId
    );

    console.log(
      "PLAYER COUNT:",
      message.game.playerCount
    );

    console.log("");
    console.log(
      "=== COMPLETE START GAME TEST PASSED ==="
    );

    ws1.close();
    ws2.close();

    setTimeout(() => {
      process.exit(0);
    }, 200);

    return;
  }

  if (
    message.type === "ERROR"
  ) {
    console.error(
      `${playerName} ERROR:`,
      message.message
    );
  }
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

ws1.on("message", data => {
  const message = JSON.parse(
    data.toString()
  );

  handleMessage(
    "PLAYER 1",
    ws1,
    message
  );
});

ws2.on("message", data => {
  const message = JSON.parse(
    data.toString()
  );

  handleMessage(
    "PLAYER 2",
    ws2,
    message
  );
});

ws1.on("error", error => {
  console.error(
    "PLAYER 1 SOCKET ERROR:",
    error.message
  );
});

ws2.on("error", error => {
  console.error(
    "PLAYER 2 SOCKET ERROR:",
    error.message
  );
});
