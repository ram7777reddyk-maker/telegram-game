import { GameState } from "./types.js";

export function getPublicGameState(
  game: GameState
) {
  return {
    roomId: game.roomId,
    status: game.status,
    playerCount: game.players.length,

    players: game.players.map(player => ({
      playerId: player.playerId,
      username: player.username,
      cardCount: player.cards.length
    })),

    deckCount: game.deck.length,

    discardPile: game.discardPile,

    currentPlayerId:
      game.currentPlayerId,

    wildJokerRank:
      game.wildJokerRank,

    winnerPlayerId:
      game.winnerPlayerId,

    declarationResult:
      game.declarationResult
  };
}

export function getPrivatePlayerState(
  game: GameState,
  playerId: string
) {
  const player =
    game.players.find(
      item =>
        item.playerId === playerId
    );

  if (!player) {
    return null;
  }

  return {
    playerId: player.playerId,
    username: player.username,
    cards: player.cards
  };
}
