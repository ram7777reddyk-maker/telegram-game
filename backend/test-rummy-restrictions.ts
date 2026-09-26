import {
  createGameState,
  addPlayer,
  dealCards,
  drawCard,
  discardCard
} from "./src/game/gameState.js";

console.log("=== RUMMY TURN RESTRICTION TEST ===");

const game = createGameState("restriction-room");

addPlayer(game, "player-001", "Player One");
addPlayer(game, "player-002", "Player Two");

dealCards(game, 13);

//
// TEST 1: DISCARD BEFORE DRAW
//

console.log("");
console.log("--- TEST 1: DISCARD BEFORE DRAW ---");

try {
  discardCard(game, "player-001", 0);

  throw new Error(
    "Discard before draw was incorrectly allowed"
  );
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  console.log("EXPECTED ERROR:", message);

  if (
    message !==
    "You must draw a card before discarding"
  ) {
    throw error;
  }
}

console.log("TEST 1 PASSED");

//
// TEST 2: DRAW TWICE
//

console.log("");
console.log("--- TEST 2: DRAW TWICE ---");

drawCard(game, "player-001");

try {
  drawCard(game, "player-001");

  throw new Error(
    "Second draw was incorrectly allowed"
  );
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  console.log("EXPECTED ERROR:", message);

  if (
    message !==
    "You have already drawn this turn"
  ) {
    throw error;
  }
}

console.log("TEST 2 PASSED");

//
// TEST 3: WRONG PLAYER DRAW
//

console.log("");
console.log("--- TEST 3: WRONG PLAYER DRAW ---");

try {
  drawCard(game, "player-002");

  throw new Error(
    "Wrong player was incorrectly allowed to draw"
  );
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  console.log("EXPECTED ERROR:", message);

  if (
    message !== "It is not your turn"
  ) {
    throw error;
  }
}

console.log("TEST 3 PASSED");

//
// COMPLETE PLAYER 1 TURN
//

discardCard(game, "player-001", 0);

//
// TEST 4: PLAYER 1 CANNOT DRAW AGAIN
//

console.log("");
console.log("--- TEST 4: OLD PLAYER CANNOT DRAW ---");

try {
  drawCard(game, "player-001");

  throw new Error(
    "Previous player was incorrectly allowed to draw"
  );
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  console.log("EXPECTED ERROR:", message);

  if (
    message !== "It is not your turn"
  ) {
    throw error;
  }
}

console.log("TEST 4 PASSED");

console.log("");
console.log(
  "=== ALL TURN RESTRICTION TESTS PASSED ==="
);
