import {
  createGameState,
  addPlayer,
  declareGame
} from "./src/game/gameState.js";

const card = (suit, rank) => ({
  suit,
  rank
});

console.log("=== RUMMY DECLARATION TEST ===");

//
// TEST 1: VALID DECLARATION
//

const validGame =
  createGameState("valid-room");

addPlayer(
  validGame,
  "player-001",
  "Player One"
);

addPlayer(
  validGame,
  "player-002",
  "Player Two"
);

validGame.status = "playing";
validGame.currentPlayerId = "player-001";

validGame.players[0].cards = [
  card("hearts", "2"),
  card("hearts", "3"),
  card("hearts", "4"),

  card("diamonds", "5"),
  card("diamonds", "6"),
  card("diamonds", "7"),

  card("clubs", "9"),
  card("diamonds", "9"),
  card("spades", "9"),

  card("hearts", "J"),
  card("diamonds", "J"),
  card("clubs", "J"),
  card("spades", "J")
];

console.log("");
console.log("--- VALID DECLARATION ---");

const validResult =
  declareGame(
    validGame,
    "player-001"
  );

console.log(
  "DECLARATION RESULT:",
  validResult
);

console.log(
  "GAME STATUS:",
  validGame.status
);

console.log(
  "WINNER:",
  validGame.winnerPlayerId
);

console.log(
  "DECLARATION STATE:",
  validGame.declarationResult
);

if (validResult !== true) {
  throw new Error(
    "Valid declaration should return true"
  );
}

if (validGame.status !== "finished") {
  throw new Error(
    "Game should be finished after valid declaration"
  );
}

if (
  validGame.winnerPlayerId !==
  "player-001"
) {
  throw new Error(
    "Player 1 should be the winner"
  );
}

if (
  validGame.declarationResult !== "valid"
) {
  throw new Error(
    "Declaration result should be valid"
  );
}

//
// TEST 2: INVALID DECLARATION
//

const invalidGame =
  createGameState("invalid-room");

addPlayer(
  invalidGame,
  "player-001",
  "Player One"
);

addPlayer(
  invalidGame,
  "player-002",
  "Player Two"
);

invalidGame.status = "playing";
invalidGame.currentPlayerId =
  "player-001";

invalidGame.players[0].cards = [
  card("hearts", "2"),
  card("hearts", "3"),
  card("hearts", "4"),

  card("diamonds", "5"),
  card("diamonds", "6"),
  card("diamonds", "7"),

  card("clubs", "9"),
  card("diamonds", "9"),
  card("spades", "9"),

  card("hearts", "2"),
  card("diamonds", "J"),
  card("clubs", "Q"),
  card("spades", "K")
];

console.log("");
console.log("--- INVALID DECLARATION ---");

const invalidResult =
  declareGame(
    invalidGame,
    "player-001"
  );

console.log(
  "DECLARATION RESULT:",
  invalidResult
);

console.log(
  "GAME STATUS:",
  invalidGame.status
);

console.log(
  "WINNER:",
  invalidGame.winnerPlayerId
);

console.log(
  "DECLARATION STATE:",
  invalidGame.declarationResult
);

if (invalidResult !== false) {
  throw new Error(
    "Invalid declaration should return false"
  );
}

if (invalidGame.status !== "playing") {
  throw new Error(
    "Game should continue after invalid declaration"
  );
}

if (
  invalidGame.winnerPlayerId !== null
) {
  throw new Error(
    "There should be no winner after invalid declaration"
  );
}

if (
  invalidGame.declarationResult !== "invalid"
) {
  throw new Error(
    "Declaration result should be invalid"
  );
}

console.log("");
console.log(
  "=== DECLARATION TEST PASSED ==="
);
