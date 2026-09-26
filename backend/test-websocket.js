const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:3000/ws");

ws.on("open", () => {
    console.log("CONNECTED");

    ws.send(JSON.stringify({
        type: "CREATE_ROOM"
    }));
});

ws.on("message", (data) => {
    const message = JSON.parse(data.toString());

    console.log("SERVER:", message);

    if (message.type === "ROOM_CREATED") {
        console.log("ROOM ID:", message.roomId);

        ws.send(JSON.stringify({
            type: "JOIN_ROOM",
            roomId: message.roomId,
            playerId: "player-001",
            username: "TestPlayer"
        }));
    }

    if (message.type === "PLAYER_JOINED") {
        console.log("PLAYER JOINED:", message.playerId);
        console.log("PLAYER COUNT:", message.playerCount);

        ws.send(JSON.stringify({
            type: "LEAVE_ROOM"
        }));
    }

    if (message.type === "ROOM_LEFT") {
        console.log("ROOM LEFT:", message.roomId);
        ws.close();
    }
});

ws.on("close", () => {
    console.log("CONNECTION CLOSED");
});

ws.on("error", (error) => {
    console.error("WEBSOCKET ERROR:", error.message);
});
