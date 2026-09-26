import {
  createGameState,
  addPlayer,
  dealCards
} from "./src/game/gameState.js";

console.log("=== WILD JOKER TEST ===");

const game =
  createGameState("joker-test-room");

addPlayer(
  game,
  "player-001",
  "Player One"
);

addPlayer(
  game,
  "player-002",
  "Player Two"
);

console.log(
  "WILD JOKER BEFORE START:",
  game.wildJokerRank
);

if (game.wildJokerRank !== null) {
  throw new Error(
    "Wild joker should be null before game starts"
  );
}

dealCards(game, 13);

console.log(
  "WILD JOKER AFTER START:",
  game.wildJokerRank
);

console.log(
  "GAME STATUS:",
  game.status
);

if (game.wildJokerRank === null) {
  throw new Error(
    "Wild joker rank should be selected when game starts"
  );
}

const validRanks = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A"
];

if (
  !validRanks.includes(
    game.wildJokerRank
  )
) {
  throw new Error(
    "Invalid wild joker rank"
  );
}

console.log("");
console.log(
  "=== WILD JOKER TEST PASSED ==="
);
