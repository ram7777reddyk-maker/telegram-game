import { GameState, Card } from "./src/game/types.js";

export function setTestValidHand(
  game: GameState,
  playerId: string
): void {
  const player = game.players.find(
    item => item.playerId === playerId
  );

  if (!player) {
    throw new Error("Test player not found");
  }

  const validHand: Card[] = [
    { suit: "hearts", rank: "2", isJoker: false },
    { suit: "hearts", rank: "3", isJoker: false },
    { suit: "hearts", rank: "4", isJoker: false },

    { suit: "diamonds", rank: "5", isJoker: false },
    { suit: "diamonds", rank: "6", isJoker: false },
    { suit: "diamonds", rank: "7", isJoker: false },

    { suit: "clubs", rank: "8", isJoker: false },
    { suit: "clubs", rank: "9", isJoker: false },
    { suit: "clubs", rank: "10", isJoker: false },

    { suit: "spades", rank: "Q", isJoker: false },
    { suit: "hearts", rank: "Q", isJoker: false },
    { suit: "diamonds", rank: "Q", isJoker: false },
    { suit: "clubs", rank: "Q", isJoker: false }
  ];

  player.cards = validHand;
}
