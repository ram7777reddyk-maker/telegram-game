import { GameState, Card } from "./types.js";

import {
  createGameState,
  addPlayer,
  removePlayer,
  dealCards,
  drawCard,
  drawFromDiscardPile,
  discardCard,
  declareGame,
  reorderPlayerCards
} from "./gameState.js";

class GameManager {
  private games = new Map<string, GameState>();

  createGame(roomId: string): GameState {
    const existingGame =
      this.games.get(roomId);

    if (existingGame) {
      return existingGame;
    }

    const game =
      createGameState(roomId);

    this.games.set(roomId, game);

    return game;
  }

  getGame(
    roomId: string
  ): GameState | undefined {
    return this.games.get(roomId);
  }

  deleteGame(roomId: string): void {
    this.games.delete(roomId);
  }

  addPlayer(
    roomId: string,
    playerId: string,
    username?: string
  ): boolean {
    let game =
      this.games.get(roomId);

    if (!game) {
      game =
        this.createGame(roomId);
    }

    return addPlayer(
      game,
      playerId,
      username
    );
  }

  removePlayer(
    roomId: string,
    playerId: string
  ): boolean {
    const game =
      this.games.get(roomId);

    if (!game) {
      return false;
    }

    return removePlayer(
      game,
      playerId
    );
  }

  startGame(
    roomId: string,
    cardsPerPlayer = 13
  ): GameState {
    const game =
      this.games.get(roomId);

    if (!game) {
      throw new Error(
        "Game not found"
      );
    }

    if (game.players.length < 2) {
      throw new Error(
        "At least 2 players are required to start the game"
      );
    }

    if (game.status === "playing") {
      throw new Error(
        "Game has already started"
      );
    }

    dealCards(
      game,
      cardsPerPlayer
    );

    return game;
  }

  drawCard(
    roomId: string,
    playerId: string
  ): Card {
    const game =
      this.games.get(roomId);

    if (!game) {
      throw new Error(
        "Game not found"
      );
    }

    return drawCard(
      game,
      playerId
    );
  }

  drawFromDiscardPile(
    roomId: string,
    playerId: string
  ): Card {
    const game =
      this.games.get(roomId);

    if (!game) {
      throw new Error(
        "Game not found"
      );
    }

    return drawFromDiscardPile(
      game,
      playerId
    );
  }

  discardCard(
    roomId: string,
    playerId: string,
    cardIndex: number
  ): Card {
    const game =
      this.games.get(roomId);

    if (!game) {
      throw new Error(
        "Game not found"
      );
    }

    return discardCard(
      game,
      playerId,
      cardIndex
    );
  }

  reorderPlayerCards(
    roomId: string,
    playerId: string,
    cardOrder: string[]
  ): void {
    const game = this.games.get(roomId);

    if (!game) {
      throw new Error("Game not found");
    }

    reorderPlayerCards(
      game,
      playerId,
      cardOrder
    );
  }

  declareGame(
    roomId: string,
    playerId: string
  ): boolean {
    const game =
      this.games.get(roomId);

    if (!game) {
      throw new Error(
        "Game not found"
      );
    }

    return declareGame(
      game,
      playerId
    );
  }
}

export const gameManager =
  new GameManager();






