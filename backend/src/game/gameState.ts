import { GameState, PlayerState, Card, Rank } from "./types.js";
import { createShuffledDeck } from "./deck.js";
import { isValidRummyHand } from "./rummyValidator.js";

const ranks: Rank[] = [
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

function selectWildJokerRank(): Rank {
  const index = Math.floor(
    Math.random() * ranks.length
  );

  return ranks[index];
}

export function createGameState(
  roomId: string
): GameState {
  return {
    roomId,
    status: "waiting",
    players: [],
    deck: createShuffledDeck(),
    discardPile: [],
    currentPlayerId: null,
    hasDrawnThisTurn: false,
    wildJokerRank: null,
    winnerPlayerId: null,
    declarationResult: "none"
  };
}

export function addPlayer(
  game: GameState,
  playerId: string,
  username?: string
): boolean {
  if (game.status !== "waiting") {
    return false;
  }

  if (
    game.players.some(
      player => player.playerId === playerId
    )
  ) {
    return false;
  }

  game.players.push({
    playerId,
    username,
    cards: []
  });

  return true;
}

export function removePlayer(
  game: GameState,
  playerId: string
): boolean {
  const index =
    game.players.findIndex(
      player =>
        player.playerId === playerId
    );

  if (index === -1) {
    return false;
  }

  game.players.splice(index, 1);

  if (
    game.currentPlayerId === playerId
  ) {
    game.currentPlayerId =
      game.players[0]?.playerId ?? null;
  }

  return true;
}

export function dealCards(
  game: GameState,
  cardsPerPlayer = 13
): void {
  if (
    game.players.length < 2
  ) {
    throw new Error(
      "At least 2 players are required"
    );
  }

  game.deck = createShuffledDeck();
  game.discardPile = [];
  game.wildJokerRank =
    selectWildJokerRank();

  for (const player of game.players) {
    player.cards = [];

    for (
      let i = 0;
      i < cardsPerPlayer;
      i++
    ) {
      const card =
        game.deck.pop();

      if (!card) {
        throw new Error(
          "Deck is empty"
        );
      }

      player.cards.push(card);
    }
  }

  game.status = "playing";
  game.winnerPlayerId = null;
  game.declarationResult = "none";
  game.hasDrawnThisTurn = false;
  game.currentPlayerId =
    game.players[0]?.playerId ?? null;
}

function getCurrentPlayer(
  game: GameState,
  playerId: string
): PlayerState {
  if (
    game.currentPlayerId !== playerId
  ) {
    throw new Error(
      "It is not your turn"
    );
  }

  const player =
    game.players.find(
      item =>
        item.playerId === playerId
    );

  if (!player) {
    throw new Error(
      "Player not found"
    );
  }

  return player;
}

export function drawCard(
  game: GameState,
  playerId: string
): Card {
  if (
    game.status !== "playing"
  ) {
    throw new Error(
      "Game is not playing"
    );
  }

  const player =
    getCurrentPlayer(
      game,
      playerId
    );

  if (game.hasDrawnThisTurn) {
    throw new Error(
      "You have already drawn this turn"
    );
  }

  const card =
    game.deck.pop();

  if (!card) {
    throw new Error(
      "Deck is empty"
    );
  }

  player.cards.push(card);
  game.hasDrawnThisTurn = true;

  return card;
}

export function drawFromDiscardPile(
  game: GameState,
  playerId: string
): Card {
  if (
    game.status !== "playing"
  ) {
    throw new Error(
      "Game is not playing"
    );
  }

  const player =
    getCurrentPlayer(
      game,
      playerId
    );

  if (game.hasDrawnThisTurn) {
    throw new Error(
      "You have already drawn this turn"
    );
  }

  const card =
    game.discardPile.pop();

  if (!card) {
    throw new Error(
      "Discard pile is empty"
    );
  }

  player.cards.push(card);
  game.hasDrawnThisTurn = true;

  return card;
}

export function discardCard(
  game: GameState,
  playerId: string,
  cardIndex: number
): Card {
  if (
    game.status !== "playing"
  ) {
    throw new Error(
      "Game is not playing"
    );
  }

  const player =
    getCurrentPlayer(
      game,
      playerId
    );

  if (!game.hasDrawnThisTurn) {
    throw new Error(
      "You must draw a card before discarding"
    );
  }

  if (
    !Number.isInteger(cardIndex) ||
    cardIndex < 0 ||
    cardIndex >= player.cards.length
  ) {
    throw new Error(
      "Invalid card index"
    );
  }

  const discardedCard =
    player.cards.splice(
      cardIndex,
      1
    )[0];

  game.discardPile.push(
    discardedCard
  );

  const currentIndex =
    game.players.findIndex(
      item =>
        item.playerId === playerId
    );

  const nextIndex =
    (currentIndex + 1) %
    game.players.length;

  game.currentPlayerId =
    game.players[nextIndex]?.playerId ??
    null;

  game.hasDrawnThisTurn = false;

  return discardedCard;
}

export function declareGame(
  game: GameState,
  playerId: string
): boolean {
  if (
    game.status !== "playing"
  ) {
    throw new Error(
      "Game is not playing"
    );
  }

  const player =
    getCurrentPlayer(
      game,
      playerId
    );

  if (
    player.cards.length !== 13
  ) {
    throw new Error(
      "A valid declaration requires exactly 13 cards"
    );
  }

  const valid =
    isValidRummyHand(
      player.cards,
      game.wildJokerRank
    );

  if (!valid) {
    game.declarationResult =
      "invalid";

    return false;
  }

  game.declarationResult =
    "valid";

  game.winnerPlayerId =
    playerId;

  game.status = "finished";

  game.currentPlayerId =
    null;

  game.hasDrawnThisTurn =
    false;

  return true;
}

function getCardKey(card: Card): string {
  return `${card.suit}-${card.rank}-${card.isJoker ? "joker" : "normal"}`;
}

export function reorderPlayerCards(
  game: GameState,
  playerId: string,
  cardKeys: string[]
): void {
  const player = game.players.find(
    item => item.playerId === playerId
  );

  if (!player) {
    throw new Error("Player not found");
  }

  if (
    !Array.isArray(cardKeys) ||
    cardKeys.length !== player.cards.length
  ) {
    throw new Error("Invalid card order");
  }

  const currentCardsByKey = new Map<string, Card>();

  for (const card of player.cards) {
    const key = getCardKey(card);

    if (currentCardsByKey.has(key)) {
      throw new Error("Duplicate card detected");
    }

    currentCardsByKey.set(key, card);
  }

  const reorderedCards: Card[] = [];

  for (const key of cardKeys) {
    const card = currentCardsByKey.get(key);

    if (!card) {
      throw new Error("Invalid card order");
    }

    reorderedCards.push(card);
  }

  if (
    new Set(cardKeys).size !== player.cards.length
  ) {
    throw new Error("Invalid card order");
  }

  player.cards = reorderedCards;
}

