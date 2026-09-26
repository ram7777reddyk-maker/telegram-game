import {
  isPureSequence,
  isSet,
  isValidRummyHand
} from "./src/game/rummyValidator.js";

const hearts = (rank: any) => ({
  suit: "hearts",
  rank
});

const diamonds = (rank: any) => ({
  suit: "diamonds",
  rank
});

const clubs = (rank: any) => ({
  suit: "clubs",
  rank
});

const spades = (rank: any) => ({
  suit: "spades",
  rank
});

console.log("=== RUMMY VALIDATOR TEST ===");

const pureSequence = [
  hearts("2"),
  hearts("3"),
  hearts("4")
];

console.log(
  "PURE SEQUENCE:",
  isPureSequence(pureSequence)
);

if (!isPureSequence(pureSequence)) {
  throw new Error("Pure sequence test failed");
}

const set = [
  hearts("K"),
  diamonds("K"),
  clubs("K")
];

console.log(
  "SET:",
  isSet(set)
);

if (!isSet(set)) {
  throw new Error("Set test failed");
}

const validHand = [
  hearts("2"),
  hearts("3"),
  hearts("4"),

  diamonds("5"),
  diamonds("6"),
  diamonds("7"),

  clubs("9"),
  diamonds("9"),
  spades("9"),

  hearts("J"),
  diamonds("J"),
  clubs("J"),
  spades("J")
];

console.log(
  "VALID 13-CARD HAND:",
  isValidRummyHand(validHand)
);

if (!isValidRummyHand(validHand)) {
  throw new Error("Valid hand test failed");
}

const invalidHand = [
  hearts("2"),
  hearts("3"),
  hearts("4"),

  diamonds("5"),
  diamonds("6"),
  diamonds("7"),

  clubs("9"),
  diamonds("9"),
  spades("9"),

  hearts("2"),
  diamonds("J"),
  clubs("Q"),
  spades("K")
];

console.log(
  "INVALID 13-CARD HAND:",
  isValidRummyHand(invalidHand)
);

if (isValidRummyHand(invalidHand)) {
  throw new Error("Invalid hand test failed");
}

const invalidAceSequence = [
  hearts("K"),
  hearts("A"),
  hearts("2")
];

console.log(
  "K-A-2 SEQUENCE:",
  isPureSequence(invalidAceSequence)
);

if (isPureSequence(invalidAceSequence)) {
  throw new Error("K-A-2 should be invalid");
}

const aceLowSequence = [
  hearts("A"),
  hearts("2"),
  hearts("3")
];

console.log(
  "A-2-3 SEQUENCE:",
  isPureSequence(aceLowSequence)
);

if (!isPureSequence(aceLowSequence)) {
  throw new Error("A-2-3 should be valid");
}

console.log("");
console.log("=== ALL RUMMY VALIDATOR TESTS PASSED ===");
