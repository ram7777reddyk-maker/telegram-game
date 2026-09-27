import { gameManager } from "../game/gameManager.js";

export const BOT_PLAYER_ID = "BOT_PLAYER";

export interface BotTurnCallbacks {
  onStateChanged?: (roomId: string) => Promise<void> | void;
  onGameFinished?: (roomId: string) => Promise<void> | void;
}

class RummyBotService {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  addBot(roomId: string): boolean {
    const game = gameManager.getGame(roomId);

    if (!game) {
      return false;
    }

    if (
      game.players.some(
        player => player.playerId === BOT_PLAYER_ID
      )
    ) {
      return true;
    }

    if (game.status !== "waiting") {
      return false;
    }

    return gameManager.addPlayer(
      roomId,
      BOT_PLAYER_ID,
      "Rummy Bot"
    );
  }

  startBotTurns(
    roomId: string,
    callbacks: BotTurnCallbacks = {}
  ): void {
    this.stopBotTurns(roomId);
    this.scheduleNextTurn(roomId, callbacks);
  }

  stopBotTurns(roomId: string): void {
    const timer = this.timers.get(roomId);

    if (timer) {
      clearTimeout(timer);
      this.timers.delete(roomId);
    }
  }

  private scheduleNextTurn(
    roomId: string,
    callbacks: BotTurnCallbacks
  ): void {
    this.stopBotTurns(roomId);

    const timer = setTimeout(
      async () => {
        this.timers.delete(roomId);

        try {
          const game = gameManager.getGame(roomId);

          if (
            !game ||
            game.status !== "playing"
          ) {
            return;
          }

          if (
            game.currentPlayerId !== BOT_PLAYER_ID
          ) {
            this.scheduleNextTurn(
              roomId,
              callbacks
            );
            return;
          }

          await this.playTurn(
            roomId,
            callbacks
          );

          const updatedGame =
            gameManager.getGame(roomId);

          if (!updatedGame) {
            return;
          }

          if (
            updatedGame.status === "finished"
          ) {
            await callbacks.onGameFinished?.(
              roomId
            );
            return;
          }

          await callbacks.onStateChanged?.(
            roomId
          );

          this.scheduleNextTurn(
            roomId,
            callbacks
          );
        } catch (error) {
          console.error(
            "Bot turn error:",
            error
          );

          this.scheduleNextTurn(
            roomId,
            callbacks
          );
        }
      },
      1200 + Math.floor(Math.random() * 1800)
    );

    this.timers.set(roomId, timer);
  }

  private async playTurn(
    roomId: string,
    callbacks: BotTurnCallbacks
  ): Promise<void> {
    const game = gameManager.getGame(roomId);

    if (
      !game ||
      game.status !== "playing" ||
      game.currentPlayerId !== BOT_PLAYER_ID
    ) {
      return;
    }

    const bot = game.players.find(
      player =>
        player.playerId === BOT_PLAYER_ID
    );

    if (!bot) {
      return;
    }

    /*
     * A bot can occasionally try to declare
     * at the beginning of its turn.
     *
     * The real validator decides whether
     * the declaration is valid.
     */
    if (
      bot.cards.length === 13 &&
      Math.random() < 0.05
    ) {
      const declared =
        gameManager.declareGame(
          roomId,
          BOT_PLAYER_ID
        );

      if (declared) {
        await callbacks.onStateChanged?.(
          roomId
        );
        return;
      }
    }

    /*
     * Draw exactly once.
     */
    const canDrawFromDiscard =
      game.discardPile.length > 0;

    const useDiscard =
      canDrawFromDiscard &&
      Math.random() < 0.35;

    if (useDiscard) {
      gameManager.drawFromDiscardPile(
        roomId,
        BOT_PLAYER_ID
      );
    } else {
      gameManager.drawCard(
        roomId,
        BOT_PLAYER_ID
      );
    }

    await callbacks.onStateChanged?.(
      roomId
    );

    /*
     * Bot now has 14 cards.
     * It must discard exactly one.
     */
    const cardIndex =
      Math.floor(
        Math.random() * bot.cards.length
      );

    gameManager.discardCard(
      roomId,
      BOT_PLAYER_ID,
      cardIndex
    );

    /*
     * After discarding, the bot has 13 cards.
     * Occasionally try a declaration on a future
     * turn only; this turn has already passed.
     */
  }
}

export const rummyBotService =
  new RummyBotService();
