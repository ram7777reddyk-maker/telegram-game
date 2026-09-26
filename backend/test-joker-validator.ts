import {
  isPureSequence,
  isImpureSequence,
  isSet,
  isValidRummyHand
} from "./src/game/rummyValidator.js";

console.log("=== JOKER VALIDATOR TEST ===");

const card = (
  suit: "hearts" | "diamonds" | "clubs" | "spades",
  rank: "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A",
  isJoker = false
) => ({
  suit,
  rank,
  isJoker
});

console.log("");
console.log("--- PURE SEQUENCE ---");

const pureSequence = [
  card("hearts", "4"),
  card("hearts", "5"),
  card("hearts", "6")
];

console.log(
  "RESULT:",
  isPureSequence(pureSequence)
);

if (!isPureSequence(pureSequence)) {
  throw new Error("Pure sequence should be valid");
}

console.log("TEST PASSED");

console.log("");
console.log("--- IMPURE SEQUENCE WITH PRINTED JOKER ---");

const impurePrinted = [
  card("hearts", "4"),
  card("hearts", "5"),
  card("hearts", "A", true)
];

console.log(
  "RESULT:",
  isImpureSequence(impurePrinted, null)
);

if (!isImpureSequence(impurePrinted, null)) {
  throw new Error(
    "Printed joker should complete impure sequence"
  );
}

console.log("TEST PASSED");

console.log("");
console.log("--- IMPURE SEQUENCE WITH WILD JOKER ---");

const impureWild = [
  card("diamonds", "4"),
  card("diamonds", "5"),
  card("diamonds", "6"),
  card("diamonds", "7")
];

console.log("WILD JOKER RANK: 6");

console.log(
  "RESULT:",
  isImpureSequence(impureWild, "6")
);

if (!isImpureSequence(impureWild, "6")) {
  throw new Error(
    "Wild joker should participate in impure sequence"
  );
}

console.log("TEST PASSED");

console.log("");
console.log("--- NORMAL SET ---");

const normalSet = [
  card("hearts", "9"),
  card("diamonds", "9"),
  card("clubs", "9")
];

console.log(
  "RESULT:",
  isSet(normalSet, null)
);

if (!isSet(normalSet, null)) {
  throw new Error("Normal set should be valid");
}

console.log("TEST PASSED");

console.log("");
console.log("--- SET WITH PRINTED JOKER ---");

const jokerSet = [
  card("hearts", "9"),
  card("diamonds", "9"),
  card("spades", "A", true)
];

console.log(
  "RESULT:",
  isSet(jokerSet, null)
);

if (!isSet(jokerSet, null)) {
  throw new Error(
    "Set with printed joker should be valid"
  );
}

console.log("TEST PASSED");

console.log("");
console.log("--- VALID 13-CARD HAND ---");

const validHand = [
  card("hearts", "2"),
  card("hearts", "3"),
  card("hearts", "4"),

  card("diamonds", "5"),
  card("diamonds", "6"),
  card("diamonds", "8"),

  card("clubs", "9"),
  card("diamonds", "9"),
  card("spades", "9"),

  card("hearts", "J"),
  card("diamonds", "J"),
  card("clubs", "J"),
  card("spades", "A", true)
];

console.log(
  "RESULT:",
  isValidRummyHand(validHand, "7")
);

if (!isValidRummyHand(validHand, "7")) {
  throw new Error(
    "Valid 13-card hand should be accepted"
  );
}

console.log("TEST PASSED");

console.log("");
console.log("--- INVALID 13-CARD HAND ---");

const invalidHand = [
  card("hearts", "2"),
  card("hearts", "3"),
  card("hearts", "4"),

  card("diamonds", "5"),
  card("diamonds", "6"),
  card("diamonds", "8"),

  card("clubs", "2"),
  card("diamonds", "5"),
  card("spades", "10"),

  card("hearts", "J"),
  card("diamonds", "Q"),
  card("clubs", "K"),
  card("spades", "A")
];

console.log(
  "RESULT:",
  isValidRummyHand(invalidHand, "7")
);

if (isValidRummyHand(invalidHand, "7")) {
  throw new Error(
    "Invalid hand should be rejected"
  );
}

console.log("TEST PASSED");

console.log("");
console.log("=== ALL JOKER VALIDATOR TESTS PASSED ===");
