import assert from "node:assert/strict";

import {
  createDeck
} from "../game/deck.js";

import {
  createGameState,
  addPlayer,
  dealCards,
  drawCard,
  drawFromDiscardPile,
  discardCard,
  declareGame,
  reorderPlayerCards
} from "../game/gameState.js";

import {
  isValidRummyHand
} from "../game/rummyValidator.js";

import type {
  Card,
  GameState
} from "../game/types.js";

import {
  saveGameState,
  getGameState,
  deleteGameState
} from "../services/redisGameService.js";

import {
  redisClient
} from "../database/redis.js";


function cardKey(card: Card): string {
  return `${card.suit}-${card.rank}-${card.isJoker ? "joker" : "normal"}`;
}


function logTest(
  name: string
): void {
  console.log(`PASS: ${name}`);
}


function createKnownValidHand(): Card[] {
  return [
    // Pure sequence 1
    {
      suit: "hearts",
      rank: "2",
      isJoker: false
    },
    {
      suit: "hearts",
      rank: "3",
      isJoker: false
    },
    {
      suit: "hearts",
      rank: "4",
      isJoker: false
    },
    {
      suit: "hearts",
      rank: "5",
      isJoker: false
    },

    // Pure sequence 2
    {
      suit: "clubs",
      rank: "7",
      isJoker: false
    },
    {
      suit: "clubs",
      rank: "8",
      isJoker: false
    },
    {
      suit: "clubs",
      rank: "9",
      isJoker: false
    },

    // Pure sequence 3
    {
      suit: "diamonds",
      rank: "10",
      isJoker: false
    },
    {
      suit: "diamonds",
      rank: "J",
      isJoker: false
    },
    {
      suit: "diamonds",
      rank: "Q",
      isJoker: false
    },

    // Set of three Aces
    {
      suit: "hearts",
      rank: "A",
      isJoker: false
    },
    {
      suit: "diamonds",
      rank: "A",
      isJoker: false
    },
    {
      suit: "clubs",
      rank: "A",
      isJoker: false
    }
  ];
}


async function main(): Promise<void> {
  console.log("");
  console.log("========================================");
  console.log("      MASTER RUMMY REGRESSION TEST");
  console.log("========================================");
  console.log("");

  /*
   * ========================================
   * 1. DECK TESTS
   * ========================================
   */

  const deck = createDeck();

  assert.equal(
    deck.length,
    54,
    "Deck must contain 54 cards"
  );

  logTest("Deck contains exactly 54 cards");

  const normalCards =
    deck.filter(card => !card.isJoker);

  const printedJokers =
    deck.filter(card => card.isJoker);

  assert.equal(
    normalCards.length,
    52,
    "Deck must contain 52 normal cards"
  );

  assert.equal(
    printedJokers.length,
    2,
    "Deck must contain 2 printed jokers"
  );

  logTest("Deck contains 52 normal cards + 2 printed jokers");


  /*
   * ========================================
   * 2. GAME CREATION
   * ========================================
   */

  const roomId =
    `master-test-${Date.now()}`;

  const game =
    createGameState(roomId);

  assert.equal(
    game.status,
    "waiting"
  );

  assert.equal(
    game.players.length,
    0
  );

  logTest("Game starts in waiting state");


  /*
   * ========================================
   * 3. PLAYER TESTS
   * ========================================
   */

  assert.equal(
    addPlayer(
      game,
      "player-001",
      "Player One"
    ),
    true
  );

  assert.equal(
    addPlayer(
      game,
      "player-002",
      "Player Two"
    ),
    true
  );

  assert.equal(
    game.players.length,
    2
  );

  logTest("Two players can join");


  /*
   * ========================================
   * 4. DEAL TEST
   * ========================================
   */

  dealCards(game, 13);

  assert.equal(
    game.status,
    "playing"
  );

  assert.equal(
    game.players[0].cards.length,
    13
  );

  assert.equal(
    game.players[1].cards.length,
    13
  );

  logTest("Each player receives exactly 13 cards");


  const allPlayerCards = [
    ...game.players[0].cards,
    ...game.players[1].cards
  ];

  const uniquePlayerCards =
    new Set(
      allPlayerCards.map(cardKey)
    );

  assert.equal(
    uniquePlayerCards.size,
    allPlayerCards.length,
    "Players must not receive duplicate cards"
  );

  logTest("Players do not receive duplicate physical cards");


  assert.ok(
    game.wildJokerRank !== null,
    "Wild joker rank must be selected"
  );

  logTest(
    `Wild joker selected: ${game.wildJokerRank}`
  );


  assert.ok(
    game.currentPlayerId !== null,
    "Current player must be selected"
  );

  logTest(
    `First turn assigned to ${game.currentPlayerId}`
  );


  /*
   * ========================================
   * 5. TURN RESTRICTIONS
   * ========================================
   */

  const firstPlayerId =
    game.currentPlayerId!;

  const secondPlayerId =
    game.players.find(
      player =>
        player.playerId !== firstPlayerId
    )!.playerId;


  assert.throws(
    () => {
      drawCard(
        game,
        secondPlayerId
      );
    },
    /turn/i
  );

  logTest("Wrong player cannot draw");


  /*
   * ========================================
   * 6. DRAW TEST
   * ========================================
   */

  const firstPlayer =
    game.players.find(
      player =>
        player.playerId === firstPlayerId
    )!;

  const cardsBeforeDraw =
    firstPlayer.cards.length;

  const drawnCard =
    drawCard(
      game,
      firstPlayerId
    );

  assert.ok(
    drawnCard,
    "Draw must return a card"
  );

  assert.equal(
    firstPlayer.cards.length,
    cardsBeforeDraw + 1
  );

  assert.equal(
    firstPlayer.cards.length,
    14
  );

  assert.equal(
    game.hasDrawnThisTurn,
    true
  );

  logTest("Drawing increases hand from 13 to 14");


  /*
   * ========================================
   * 7. DOUBLE DRAW RESTRICTION
   * ========================================
   */

  assert.throws(
    () => {
      drawCard(
        game,
        firstPlayerId
      );
    },
    /draw/i
  );

  logTest("Player cannot draw twice in one turn");


  /*
   * ========================================
   * 8. REORDER TEST
   * ========================================
   */

  const originalCards =
    [...firstPlayer.cards];

  const reversedCards =
    [...originalCards].reverse();

  const reversedKeys =
    reversedCards.map(cardKey);

  reorderPlayerCards(
    game,
    firstPlayerId,
    reversedKeys
  );

  assert.deepEqual(
    firstPlayer.cards.map(cardKey),
    reversedKeys,
    "Cards must be reordered exactly"
  );

  logTest("Cards can be reordered");


  /*
   * ========================================
   * 9. REORDER VALIDATION
   * ========================================
   */

  assert.throws(
    () => {
      reorderPlayerCards(
        game,
        firstPlayerId,
        reversedKeys.slice(1)
      );
    },
    /Invalid card order/
  );

  logTest("Invalid card order is rejected");


  /*
   * ========================================
   * 10. DRAW PRESERVES ORDER
   * ========================================
   *
   * We already drew once, so we cannot
   * draw again until discard.
   *
   * Verify the backend order is still
   * exactly the reordered order.
   */

  assert.deepEqual(
    firstPlayer.cards.map(cardKey),
    reversedKeys
  );

  logTest(
    "Backend preserves reordered card order"
  );


  /*
   * ========================================
   * 11. DISCARD TEST
   * ========================================
   */

  const discardIndex =
    firstPlayer.cards.length - 1;

  const discarded =
    discardCard(
      game,
      firstPlayerId,
      discardIndex
    );

  assert.ok(
    discarded
  );

  assert.equal(
    firstPlayer.cards.length,
    13
  );

  assert.equal(
    game.discardPile.length,
    1
  );

  assert.equal(
    game.hasDrawnThisTurn,
    false
  );

  assert.equal(
    game.currentPlayerId,
    secondPlayerId
  );

  logTest(
    "Discard returns hand to 13 and moves turn"
  );


  /*
   * ========================================
   * 12. INVALID DISCARD TEST
   * ========================================
   */

  assert.throws(
    () => {
      discardCard(
        game,
        secondPlayerId,
        999
      );
    },
    /draw/i
  );

  logTest(
    "Discard requires drawing first"
  );


  /*
   * ========================================
   * 13. DRAW FROM DISCARD
   * ========================================
   */

  const secondPlayer =
    game.players.find(
      player =>
        player.playerId === secondPlayerId
    )!;

  const secondBefore =
    secondPlayer.cards.length;

  const discardDraw =
    drawFromDiscardPile(
      game,
      secondPlayerId
    );

  assert.ok(
    discardDraw
  );

  assert.equal(
    secondPlayer.cards.length,
    secondBefore + 1
  );

  assert.equal(
    secondPlayer.cards.length,
    14
  );

  assert.equal(
    game.hasDrawnThisTurn,
    true
  );

  logTest(
    "Player can draw from discard pile"
  );


  /*
   * ========================================
   * 14. VALIDATOR - PURE SEQUENCE
   * ========================================
   */

  const pureSequence: Card[] = [
    {
      suit: "hearts",
      rank: "2"
    },
    {
      suit: "hearts",
      rank: "3"
    },
    {
      suit: "hearts",
      rank: "4"
    }
  ];

  assert.equal(
    isValidRummyHand(
      pureSequence,
      null
    ),
    false,
    "A partial hand is not a complete declaration"
  );

  logTest(
    "Validator does not incorrectly accept incomplete hand"
  );


  /*
   * ========================================
   * 15. VALIDATOR - THREE ACES SET
   * ========================================
   */

  const threeAces: Card[] = [
    {
      suit: "hearts",
      rank: "A"
    },
    {
      suit: "diamonds",
      rank: "A"
    },
    {
      suit: "clubs",
      rank: "A"
    }
  ];

  assert.equal(
    isValidRummyHand(
      threeAces,
      null
    ),
    false,
    "Three Aces alone are not a complete declaration"
  );

  logTest(
    "Three Aces alone are correctly not a declaration"
  );


  /*
   * ========================================
   * 16. VALIDATOR - COMPLETE VALID HAND
   * ========================================
   */

  const validHand =
    createKnownValidHand();

  assert.equal(
    validHand.length,
    13
  );

  assert.equal(
    isValidRummyHand(
      validHand,
      null
    ),
    true,
    "Complete valid Rummy hand must be accepted"
  );

  logTest(
    "Complete valid 13-card hand is accepted"
  );


  /*
   * ========================================
   * 17. INVALID HAND
   * ========================================
   */

  const invalidHand =
    [...validHand];

  invalidHand[0] = {
    suit: "spades",
    rank: "K",
    isJoker: false
  };

  assert.equal(
    isValidRummyHand(
      invalidHand,
      null
    ),
    false,
    "Invalid hand must be rejected"
  );

  logTest(
    "Invalid Rummy hand is rejected"
  );


  /*
   * ========================================
   * 18. ACTUAL DECLARATION
   * ========================================
   */

  const declarationGame =
    createGameState(
      `declaration-${Date.now()}`
    );

  addPlayer(
    declarationGame,
    "declare-player-001",
    "Declarer"
  );

  addPlayer(
    declarationGame,
    "declare-player-002",
    "Opponent"
  );

  dealCards(
    declarationGame,
    13
  );

  declarationGame.currentPlayerId =
    "declare-player-001";

  declarationGame.players[0].cards =
    createKnownValidHand();

  declarationGame.wildJokerRank =
    null;

  assert.equal(
    declarationGame.players[0].cards.length,
    13
  );

  assert.equal(
    declarationGame.status,
    "playing"
  );

  const declarationResult =
    declareGame(
      declarationGame,
      "declare-player-001"
    );

  assert.equal(
    declarationResult,
    true
  );

  assert.equal(
    declarationGame.status,
    "finished"
  );

  assert.equal(
    declarationGame.winnerPlayerId,
    "declare-player-001"
  );

  assert.equal(
    declarationGame.declarationResult,
    "valid"
  );

  logTest(
    "Valid 13-card declaration finishes game"
  );


  /*
   * ========================================
   * 19. POST-DECLARATION RESTRICTION
   * ========================================
   */

  assert.throws(
    () => {
      drawCard(
        declarationGame,
        "declare-player-001"
      );
    },
    /playing/i
  );

  logTest(
    "Cannot draw after game is finished"
  );


  /*
   * ========================================
   * 20. INVALID DECLARATION
   * ========================================
   */

  const invalidDeclarationGame =
    createGameState(
      `invalid-declaration-${Date.now()}`
    );

  addPlayer(
    invalidDeclarationGame,
    "invalid-001",
    "Invalid Player"
  );

  addPlayer(
    invalidDeclarationGame,
    "invalid-002",
    "Opponent"
  );

  dealCards(
    invalidDeclarationGame,
    13
  );

  invalidDeclarationGame.currentPlayerId =
    "invalid-001";

  invalidDeclarationGame.players[0].cards =
    invalidHand;

  invalidDeclarationGame.wildJokerRank =
    null;

  const invalidResult =
    declareGame(
      invalidDeclarationGame,
      "invalid-001"
    );

  assert.equal(
    invalidResult,
    false
  );

  assert.equal(
    invalidDeclarationGame.status,
    "playing"
  );

  assert.equal(
    invalidDeclarationGame.winnerPlayerId,
    null
  );

  assert.equal(
    invalidDeclarationGame.declarationResult,
    "invalid"
  );

  logTest(
    "Invalid declaration is rejected without ending game"
  );


  /*
   * ========================================
   * 21. REDIS PERSISTENCE
   * ========================================
   */

  await redisClient.connect();

  await saveGameState(
    declarationGame
  );

  const redisGame =
    await getGameState(
      declarationGame.roomId
    );

  assert.ok(
    redisGame,
    "Game must exist in Redis"
  );

  assert.equal(
    redisGame!.status,
    "finished"
  );

  assert.equal(
    redisGame!.winnerPlayerId,
    "declare-player-001"
  );

  assert.equal(
    redisGame!.declarationResult,
    "valid"
  );

  logTest(
    "Finished game persists correctly to Redis"
  );


  /*
   * ========================================
   * 22. REDIS CLEANUP
   * ========================================
   */

  await deleteGameState(
    declarationGame.roomId
  );

  const deletedGame =
    await getGameState(
      declarationGame.roomId
    );

  assert.equal(
    deletedGame,
    null
  );

  logTest(
    "Redis cleanup works"
  );


  await redisClient.quit();


  /*
   * ========================================
   * FINAL RESULT
   * ========================================
   */

  console.log("");
  console.log("========================================");
  console.log("       ALL MASTER TESTS PASSED");
  console.log("========================================");
  console.log("");
}


main().catch(error => {
  console.error("");
  console.error("========================================");
  console.error("          TEST FAILED");
  console.error("========================================");
  console.error("");
  console.error(error);
  process.exit(1);
});
