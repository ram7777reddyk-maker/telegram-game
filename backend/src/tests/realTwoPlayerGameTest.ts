import assert from "node:assert/strict";

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
  Card
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


function pass(
  message: string
): void {
  console.log(`PASS: ${message}`);
}


function section(
  message: string
): void {
  console.log("");
  console.log("----------------------------------------");
  console.log(message);
  console.log("----------------------------------------");
}


function valid13CardHand(): Card[] {
  return [
    // Pure sequence
    { suit: "hearts", rank: "2", isJoker: false },
    { suit: "hearts", rank: "3", isJoker: false },
    { suit: "hearts", rank: "4", isJoker: false },
    { suit: "hearts", rank: "5", isJoker: false },

    // Pure sequence
    { suit: "clubs", rank: "7", isJoker: false },
    { suit: "clubs", rank: "8", isJoker: false },
    { suit: "clubs", rank: "9", isJoker: false },

    // Pure sequence
    { suit: "diamonds", rank: "10", isJoker: false },
    { suit: "diamonds", rank: "J", isJoker: false },
    { suit: "diamonds", rank: "Q", isJoker: false },

    // Three Aces = SET
    { suit: "hearts", rank: "A", isJoker: false },
    { suit: "diamonds", rank: "A", isJoker: false },
    { suit: "clubs", rank: "A", isJoker: false }
  ];
}


async function main(): Promise<void> {
  console.log("");
  console.log("========================================");
  console.log("     REAL TWO-PLAYER RUMMY TEST");
  console.log("========================================");

  const roomId =
    `real-game-${Date.now()}`;

  /*
   * ========================================
   * SCENARIO 1
   * TWO PLAYERS JOIN
   * ========================================
   */

  section("SCENARIO 1 - TWO PLAYERS JOIN");

  const game =
    createGameState(roomId);

  assert.equal(
    game.status,
    "waiting"
  );

  assert.equal(
    addPlayer(
      game,
      "player-001",
      "Santosh"
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

  pass("Player 1 joined");
  pass("Player 2 joined");


  /*
   * ========================================
   * SCENARIO 2
   * GAME STARTS
   * ========================================
   */

  section("SCENARIO 2 - GAME START");

  dealCards(
    game,
    13
  );

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

  assert.ok(
    game.currentPlayerId
  );

  pass("Game started");
  pass("Both players received 13 cards");
  pass(`First turn: ${game.currentPlayerId}`);


  /*
   * ========================================
   * SCENARIO 3
   * PLAYER 2 TRIES TO PLAY OUT OF TURN
   * ========================================
   */

  section("SCENARIO 3 - WRONG TURN");

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

  pass(
    "Wrong player cannot draw"
  );


  /*
   * ========================================
   * SCENARIO 4
   * PLAYER 1 DRAWS
   * ========================================
   */

  section("SCENARIO 4 - PLAYER 1 DRAWS");

  const player1 =
    game.players.find(
      player =>
        player.playerId === firstPlayerId
    )!;

  assert.equal(
    player1.cards.length,
    13
  );

  const player1Draw =
    drawCard(
      game,
      firstPlayerId
    );

  assert.ok(
    player1Draw
  );

  assert.equal(
    player1.cards.length,
    14
  );

  assert.equal(
    game.hasDrawnThisTurn,
    true
  );

  pass("Player 1 drew a card");
  pass("Player 1 now has 14 cards");


  /*
   * ========================================
   * SCENARIO 5
   * SECOND DRAW
   * ========================================
   */

  section("SCENARIO 5 - SECOND DRAW BLOCKED");

  assert.throws(
    () => {
      drawCard(
        game,
        firstPlayerId
      );
    },
    /draw/i
  );

  pass(
    "Player 1 cannot draw twice"
  );


  /*
   * ========================================
   * SCENARIO 6
   * PLAYER 1 ORGANIZES CARDS
   * ========================================
   */

  section("SCENARIO 6 - PLAYER 1 ORGANIZES HAND");

  const beforeReorder =
    [...player1.cards];

  const reordered =
    [...beforeReorder].reverse();

  const reorderedKeys =
    reordered.map(cardKey);

  reorderPlayerCards(
    game,
    firstPlayerId,
    reorderedKeys
  );

  assert.deepEqual(
    player1.cards.map(cardKey),
    reorderedKeys
  );

  pass(
    "Player 1 reordered cards"
  );


  /*
   * ========================================
   * SCENARIO 7
   * PLAYER 1 DISCARDS
   * ========================================
   */

  section("SCENARIO 7 - PLAYER 1 DISCARDS");

  discardCard(
    game,
    firstPlayerId,
    0
  );

  assert.equal(
    player1.cards.length,
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

  pass(
    "Player 1 discarded successfully"
  );

  pass(
    "Player 1 returned to 13 cards"
  );

  pass(
    "Turn moved to Player 2"
  );


  /*
   * ========================================
   * SCENARIO 8
   * PLAYER 2 DRAWS
   * ========================================
   */

  section("SCENARIO 8 - PLAYER 2 DRAWS");

  const player2 =
    game.players.find(
      player =>
        player.playerId === secondPlayerId
    )!;

  assert.equal(
    player2.cards.length,
    13
  );

  drawCard(
    game,
    secondPlayerId
  );

  assert.equal(
    player2.cards.length,
    14
  );

  pass(
    "Player 2 drew successfully"
  );


  /*
   * ========================================
   * SCENARIO 9
   * PLAYER 2 TRIES SECOND DRAW
   * ========================================
   */

  section("SCENARIO 9 - PLAYER 2 SECOND DRAW");

  assert.throws(
    () => {
      drawCard(
        game,
        secondPlayerId
      );
    },
    /draw/i
  );

  pass(
    "Player 2 cannot draw twice"
  );


  /*
   * ========================================
   * SCENARIO 10
   * PLAYER 2 DISCARDS
   * ========================================
   */

  section("SCENARIO 10 - PLAYER 2 DISCARDS");

  discardCard(
    game,
    secondPlayerId,
    player2.cards.length - 1
  );

  assert.equal(
    player2.cards.length,
    13
  );

  assert.equal(
    game.currentPlayerId,
    firstPlayerId
  );

  pass(
    "Player 2 discarded successfully"
  );

  pass(
    "Turn returned to Player 1"
  );


  /*
   * ========================================
   * SCENARIO 11
   * PLAYER 1 DRAWS FROM DISCARD
   * ========================================
   */

  section("SCENARIO 11 - DRAW FROM DISCARD");

  const discardTop =
    game.discardPile[
      game.discardPile.length - 1
    ];

  const player1Before =
    player1.cards.length;

  const drawnFromDiscard =
    drawFromDiscardPile(
      game,
      firstPlayerId
    );

  assert.deepEqual(
    drawnFromDiscard,
    discardTop
  );

  assert.equal(
    player1.cards.length,
    player1Before + 1
  );

  assert.equal(
    player1.cards.length,
    14
  );

  pass(
    "Player 1 drew the top discard"
  );

  pass(
    "Player 1 now has 14 cards"
  );


  /*
   * ========================================
   * SCENARIO 12
   * REORDER AFTER DRAW
   * ========================================
   */

  section("SCENARIO 12 - REORDER AFTER DRAW");

  const currentOrder =
    [...player1.cards];

  const customOrder =
    [
      ...currentOrder.slice(5),
      ...currentOrder.slice(0, 5)
    ];

  const customKeys =
    customOrder.map(cardKey);

  reorderPlayerCards(
    game,
    firstPlayerId,
    customKeys
  );

  assert.deepEqual(
    player1.cards.map(cardKey),
    customKeys
  );

  pass(
    "Player 1 reordered cards after drawing"
  );


  /*
   * ========================================
   * SCENARIO 13
   * INVALID DECLARATION
   * ========================================
   */

  section("SCENARIO 13 - INVALID DECLARATION");

  /*
   * Player 1 currently has 14 cards because
   * they drew from the discard pile.
   */

  assert.equal(
    player1.cards.length,
    14
  );

  pass(
    "Player 1 has 14 cards after drawing"
  );

  discardCard(
    game,
    firstPlayerId,
    player1.cards.length - 1
  );

  assert.equal(
    player1.cards.length,
    13
  );

  assert.equal(
    game.currentPlayerId,
    secondPlayerId
  );

  pass(
    "Player 1 discarded and returned to 13 cards"
  );

  /*
   * Give the turn back to Player 1.
   */

  game.currentPlayerId =
    firstPlayerId;

  /*
   * Make the invalid declaration deterministic.
   */

  const invalidHand =
    valid13CardHand();

  invalidHand[0] = {
    suit: "spades",
    rank: "K",
    isJoker: false
  };

  player1.cards = invalidHand;

  const invalidResult =
    declareGame(
      game,
      firstPlayerId
    );

  assert.equal(
    invalidResult,
    false
  );

  assert.equal(
    game.status,
    "playing"
  );

  assert.equal(
    game.declarationResult,
    "invalid"
  );

  assert.equal(
    game.winnerPlayerId,
    null
  );

  pass(
    "Invalid 13-card declaration rejected"
  );

  pass(
    "Game continues after invalid declaration"
  );

/*
   * ========================================
   * SCENARIO 14
   * THREE ACES AS A SET
   * ========================================
   */

  section("SCENARIO 14 - THREE ACES SET");

  const threeAces: Card[] = [
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

  assert.equal(
    isValidRummyHand(
      threeAces,
      null
    ),
    false
  );

  pass(
    "Three Aces are not enough to declare by themselves"
  );

  const completeHand =
    valid13CardHand();

  assert.equal(
    completeHand.length,
    13
  );

  assert.equal(
    isValidRummyHand(
      completeHand,
      null
    ),
    true
  );

  pass(
    "Three Aces work as a SET inside a complete valid hand"
  );


  /*
   * ========================================
   * SCENARIO 15
   * REAL VALID DECLARATION
   * ========================================
   */

  section("SCENARIO 15 - PLAYER 2 VALID DECLARATION");

  /*
   * We now simulate the moment where
   * Player 2 has completed a valid hand.
   */

  const finalGame =
    createGameState(
      `final-${Date.now()}`
    );

  addPlayer(
    finalGame,
    "player-001",
    "Santosh"
  );

  addPlayer(
    finalGame,
    "player-002",
    "Player Two"
  );

  dealCards(
    finalGame,
    13
  );

  finalGame.currentPlayerId =
    "player-002";

  finalGame.wildJokerRank =
    null;

  finalGame.players[1].cards =
    valid13CardHand();

  assert.equal(
    finalGame.players[1].cards.length,
    13
  );

  const validResult =
    declareGame(
      finalGame,
      "player-002"
    );

  assert.equal(
    validResult,
    true
  );

  assert.equal(
    finalGame.status,
    "finished"
  );

  assert.equal(
    finalGame.winnerPlayerId,
    "player-002"
  );

  assert.equal(
    finalGame.declarationResult,
    "valid"
  );

  pass(
    "Player 2 successfully declared"
  );

  pass(
    "Player 2 is recorded as winner"
  );

  pass(
    "Game moved to finished state"
  );


  /*
   * ========================================
   * SCENARIO 16
   * PLAY AFTER GAME FINISHED
   * ========================================
   */

  section("SCENARIO 16 - GAME FINISHED PROTECTION");

  assert.throws(
    () => {
      drawCard(
        finalGame,
        "player-001"
      );
    },
    /playing/i
  );

  assert.throws(
    () => {
      discardCard(
        finalGame,
        "player-002",
        0
      );
    },
    /playing/i
  );

  pass(
    "Cannot draw after game finishes"
  );

  pass(
    "Cannot discard after game finishes"
  );


  /*
   * ========================================
   * SCENARIO 17
   * REDIS PERSISTENCE
   * ========================================
   */

  section("SCENARIO 17 - REDIS PERSISTENCE");

  await redisClient.connect();

  await saveGameState(
    finalGame
  );

  const redisState =
    await getGameState(
      finalGame.roomId
    );

  assert.ok(
    redisState
  );

  assert.equal(
    redisState!.status,
    "finished"
  );

  assert.equal(
    redisState!.winnerPlayerId,
    "player-002"
  );

  assert.equal(
    redisState!.declarationResult,
    "valid"
  );

  assert.equal(
    redisState!.players.length,
    2
  );

  assert.equal(
    redisState!.players[1].cards.length,
    13
  );

  pass(
    "Finished two-player game saved to Redis"
  );

  pass(
    "Winner persisted to Redis"
  );

  pass(
    "Declaration result persisted to Redis"
  );

  pass(
    "Both players persisted to Redis"
  );


  /*
   * ========================================
   * CLEANUP
   * ========================================
   */

  await deleteGameState(
    finalGame.roomId
  );

  const deleted =
    await getGameState(
      finalGame.roomId
    );

  assert.equal(
    deleted,
    null
  );

  await redisClient.quit();

  pass("Redis cleanup successful");


  /*
   * ========================================
   * FINAL RESULT
   * ========================================
   */

  console.log("");
  console.log("========================================");
  console.log("   REAL TWO-PLAYER RUMMY TEST PASSED");
  console.log("========================================");
  console.log("");
  console.log("The simulated game successfully tested:");
  console.log("");
  console.log("Player 1 -> Draw -> Reorder -> Discard");
  console.log("Player 2 -> Draw -> Discard");
  console.log("Player 1 -> Draw from Discard -> Reorder");
  console.log("Turn restrictions");
  console.log("Draw restrictions");
  console.log("Discard restrictions");
  console.log("Three-Ace SET");
  console.log("Invalid declaration handling");
  console.log("Valid declaration");
  console.log("Winner assignment");
  console.log("Finished-game protection");
  console.log("Redis persistence");
  console.log("");
}


main().catch(async error => {
  console.error("");
  console.error("========================================");
  console.error("     REAL TWO-PLAYER RUMMY TEST FAILED");
  console.error("========================================");
  console.error("");
  console.error(error);

  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  } catch {
    // Ignore cleanup errors.
  }

  process.exit(1);
});

