const WebSocket = require("ws");

const ws1 = new WebSocket("ws://localhost:3000/ws");
const ws2 = new WebSocket("ws://localhost:3000/ws");

let roomId = null;
let player1Joined = false;
let player2Joined = false;
let gameStarted = false;
let player1Cards = null;
let player2Cards = null;

function send(ws, message) {
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

    console.log("PLAYER 1 <-", message);

    if (message.type === "ROOM_CREATED") {
        roomId = message.roomId;

        send(ws1, {
            type: "JOIN_ROOM",
            roomId: roomId,
            playerId: "player-001",
            username: "PlayerOne"
        });

        send(ws2, {
            type: "JOIN_ROOM",
            roomId: roomId,
            playerId: "player-002",
            username: "PlayerTwo"
        });
    }

    if (
        message.type === "PLAYER_JOINED" &&
        message.playerId === "player-001"
    ) {
        player1Joined = true;
    }

    if (
        message.type === "PLAYER_JOINED" &&
        message.playerId === "player-002"
    ) {
        player2Joined = true;
    }

    if (
        player1Joined &&
        player2Joined &&
        !gameStarted
    ) {
        gameStarted = true;

        console.log("\nSTARTING GAME...\n");

        send(ws1, {
            type: "START_GAME"
        });
    }

    if (message.type === "YOUR_CARDS") {
        player1Cards = message.player.cards;

        console.log(
            "\nPLAYER 1 PRIVATE CARDS:",
            player1Cards
        );

        checkResult();
    }
});

ws2.on("message", (data) => {
    const message = JSON.parse(data.toString());

    console.log("PLAYER 2 <-", message);

    if (
        message.type === "PLAYER_JOINED" &&
        message.playerId === "player-001"
    ) {
        player1Joined = true;
    }

    if (
        message.type === "PLAYER_JOINED" &&
        message.playerId === "player-002"
    ) {
        player2Joined = true;
    }

    if (message.type === "YOUR_CARDS") {
        player2Cards = message.player.cards;

        console.log(
            "\nPLAYER 2 PRIVATE CARDS:",
            player2Cards
        );

        checkResult();
    }
});

function checkResult() {
    if (!player1Cards || !player2Cards) {
        return;
    }

    console.log("\n==============================");
    console.log("GAME TEST RESULT");
    console.log("==============================");

    console.log(
        "Player 1 card count:",
        player1Cards.length
    );

    console.log(
        "Player 2 card count:",
        player2Cards.length
    );

    console.log(
        "Player 1 and Player 2 have different hands:",
        JSON.stringify(player1Cards) !==
        JSON.stringify(player2Cards)
    );

    console.log("==============================");
    console.log("GAME TEST COMPLETE");
    console.log("==============================");

    ws1.close();
    ws2.close();
}

ws1.on("close", () => {
    console.log("PLAYER 1 CLOSED");
});

ws2.on("close", () => {
    console.log("PLAYER 2 CLOSED");
});

ws1.on("error", (error) => {
    console.error("PLAYER 1 ERROR:", error.message);
});

ws2.on("error", (error) => {
    console.error("PLAYER 2 ERROR:", error.message);
});
