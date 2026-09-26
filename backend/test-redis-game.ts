import {
  saveGameState,
  getGameState,
  deleteGameState,
  gameStateExists
} from "./src/services/redisGameService.js";

import { redisClient } from "./src/database/redis.js";

async function runTest() {
  try {
    console.log("Connecting to Redis...");

    await redisClient.connect();

    console.log("Redis connected successfully");

    const testGame = {
      roomId: "redis-test-room",
      status: "playing" as const,
      players: [
        {
          playerId: "player-001",
          username: "TestPlayer",
          cards: [
            {
              suit: "hearts" as const,
              rank: "A" as const
            }
          ]
        }
      ],
      deck: [],
      currentPlayerId: "player-001"
    };

    console.log("=== REDIS GAME STATE TEST ===");

    await saveGameState(testGame);

    console.log(
      "Game exists:",
      await gameStateExists("redis-test-room")
    );

    const loadedGame =
      await getGameState("redis-test-room");

    console.log(
      "Loaded game:",
      loadedGame
    );

    await deleteGameState("redis-test-room");

    console.log(
      "Game exists after delete:",
      await gameStateExists("redis-test-room")
    );

    console.log("=== TEST COMPLETE ===");

    await redisClient.quit();
  } catch (error) {
    console.error("REDIS TEST FAILED:", error);

    if (redisClient.isOpen) {
      await redisClient.quit();
    }

    process.exit(1);
  }
}

runTest();
