import { createDeck } from "./src/game/deck.js";

console.log("=== JOKER DECK TEST ===");

const deck = createDeck();

console.log("TOTAL CARDS:", deck.length);

const jokers = deck.filter(
  card => card.isJoker === true
);

const normalCards = deck.filter(
  card => card.isJoker !== true
);

console.log(
  "NORMAL CARDS:",
  normalCards.length
);

console.log(
  "JOKERS:",
  jokers.length
);

console.log(
  "JOKER CARDS:",
  jokers
);

if (deck.length !== 54) {
  throw new Error(
    "Deck should contain exactly 54 cards"
  );
}

if (normalCards.length !== 52) {
  throw new Error(
    "Deck should contain 52 normal cards"
  );
}

if (jokers.length !== 2) {
  throw new Error(
    "Deck should contain exactly 2 printed jokers"
  );
}

console.log("");
console.log(
  "=== JOKER DECK TEST PASSED ==="
);
