import {
  createGameState,
  addPlayer,
  dealCards,
  drawCard,
  drawFromDiscardPile,
  discardCard
} from "./src/game/gameState.js";

console.log("=== 2 PLAYER RUMMY TURN TEST ===");

const game = createGameState("test-room");

if (!addPlayer(game, "player-001", "Player One")) {
  throw new Error("Player 1 could not be added");
}

if (!addPlayer(game, "player-002", "Player Two")) {
  throw new Error("Player 2 could not be added");
}

console.log(
  "PLAYERS:",
  game.players.length
);

dealCards(game, 13);

console.log(
  "PLAYER 1 CARDS:",
  game.players[0].cards.length
);

console.log(
  "PLAYER 2 CARDS:",
  game.players[1].cards.length
);

if (
  game.players[0].cards.length !== 13 ||
  game.players[1].cards.length !== 13
) {
  throw new Error(
    "Players did not receive 13 cards"
  );
}

console.log(
  "CURRENT PLAYER:",
  game.currentPlayerId
);

if (game.currentPlayerId !== "player-001") {
  throw new Error(
    "Player 1 should start"
  );
}

const drawnCard1 =
  drawCard(game, "player-001");

console.log(
  "PLAYER 1 DRAW:",
  drawnCard1
);

if (game.players[0].cards.length !== 14) {
  throw new Error(
    "Player 1 should have 14 cards after draw"
  );
}

console.log(
  "PLAYER 1 CARDS AFTER DRAW:",
  game.players[0].cards.length
);

const discardedCard1 =
  discardCard(
    game,
    "player-001",
    0
  );

console.log(
  "PLAYER 1 DISCARD:",
  discardedCard1
);

if (game.players[0].cards.length !== 13) {
  throw new Error(
    "Player 1 should have 13 cards after discard"
  );
}

if (game.discardPile.length !== 1) {
  throw new Error(
    "Discard pile should contain 1 card"
  );
}

console.log(
  "PLAYER 1 CARDS AFTER DISCARD:",
  game.players[0].cards.length
);

console.log(
  "CURRENT PLAYER AFTER P1:",
  game.currentPlayerId
);

if (game.currentPlayerId !== "player-002") {
  throw new Error(
    "Turn should move to Player 2"
  );
}

const drawnFromDiscard =
  drawFromDiscardPile(
    game,
    "player-002"
  );

console.log(
  "PLAYER 2 DRAW FROM DISCARD:",
  drawnFromDiscard
);

if (game.players[1].cards.length !== 14) {
  throw new Error(
    "Player 2 should have 14 cards after discard-pile draw"
  );
}

if (game.discardPile.length !== 0) {
  throw new Error(
    "Discard pile should be empty after drawing its only card"
  );
}

const discardedCard2 =
  discardCard(
    game,
    "player-002",
    0
  );

console.log(
  "PLAYER 2 DISCARD:",
  discardedCard2
);

if (game.players[1].cards.length !== 13) {
  throw new Error(
    "Player 2 should have 13 cards after discard"
  );
}

if (game.currentPlayerId !== "player-001") {
  throw new Error(
    "Turn should return to Player 1"
  );
}

console.log(
  "PLAYER 2 CARDS AFTER DISCARD:",
  game.players[1].cards.length
);

console.log(
  "CURRENT PLAYER:",
  game.currentPlayerId
);

console.log("");
console.log(
  "=== 2 PLAYER RUMMY TURN TEST PASSED ==="
);
