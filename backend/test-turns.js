const WebSocket = require("ws");

const ws1 = new WebSocket("ws://localhost:3000/ws");
const ws2 = new WebSocket("ws://localhost:3000/ws");

let roomId = null;
let player1Joined = false;
let player2Joined = false;
let gameStarted = false;
let player1Drew = false;
let player2Drew = false;

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
            roomId,
            playerId: "player-001",
            username: "PlayerOne"
        });

        send(ws2, {
            type: "JOIN_ROOM",
            roomId,
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

    if (
        message.type === "GAME_STARTED" &&
        !player1Drew
    ) {
        player1Drew = true;

        console.log("\nPLAYER 1 DRAWING...\n");

        send(ws1, {
            type: "DRAW_CARD"
        });
    }

    if (message.type === "CARD_DRAWN") {
        console.log(
            "\nPLAYER 1 DRAW RESULT:"
        );

        console.log(
            "Player 1 cards:",
            message.player.cards.length
        );

        if (message.player.cards.length !== 6) {
            console.log(
                "DRAW TEST: FAILED"
            );

            ws1.close();
            ws2.close();

            return;
        }
    }

    if (message.type === "GAME_STATE_UPDATED") {
        console.log(
            "\nCURRENT PLAYER AFTER PLAYER 1 DRAW:",
            message.game.currentPlayerId
        );

        if (
            message.game.currentPlayerId ===
            "player-002"
        ) {
            console.log(
                "TURN SWITCH TEST: PASSED"
            );

            console.log(
                "\nPLAYER 2 DRAWING...\n"
            );

            send(ws2, {
                type: "DRAW_CARD"
            });
        } else {
            console.log(
                "TURN SWITCH TEST: FAILED"
            );

            ws1.close();
            ws2.close();
        }
    }

    if (message.type === "ERROR") {
        console.log(
            "\nPLAYER 1 ERROR:",
            message.message
        );
    }
});

ws2.on("message", (data) => {
    const message = JSON.parse(data.toString());

    console.log("PLAYER 2 <-", message);

    if (message.type === "CARD_DRAWN") {
        player2Drew = true;

        console.log(
            "\nPLAYER 2 DRAW RESULT:"
        );

        console.log(
            "Player 2 cards:",
            message.player.cards.length
        );

        if (message.player.cards.length === 6) {
            console.log(
                "\nPLAYER 2 DRAW TEST: PASSED"
            );
        } else {
            console.log(
                "\nPLAYER 2 DRAW TEST: FAILED"
            );
        }

        console.log("\nTEST COMPLETE");

        ws1.close();
        ws2.close();
    }

    if (message.type === "ERROR") {
        console.log(
            "\nPLAYER 2 ERROR:",
            message.message
        );
    }
});

ws1.on("close", () => {
    console.log("PLAYER 1 CLOSED");
});

ws2.on("close", () => {
    console.log("PLAYER 2 CLOSED");
});

ws1.on("error", (error) => {
    console.error(
        "PLAYER 1 ERROR:",
        error.message
    );
});

ws2.on("error", (error) => {
    console.error(
        "PLAYER 2 ERROR:",
        error.message
    );
});
