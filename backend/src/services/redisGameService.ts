import { redisClient } from "../database/redis.js";
import { GameState } from "../game/types.js";

function gameKey(roomId: string): string {
  return `game:${roomId}`;
}

export async function saveGameState(
  game: GameState
): Promise<void> {
  await redisClient.set(
    gameKey(game.roomId),
    JSON.stringify(game)
  );
}

export async function getGameState(
  roomId: string
): Promise<GameState | null> {
  const data = await redisClient.get(
    gameKey(roomId)
  );

  if (!data) {
    return null;
  }

  return JSON.parse(data) as GameState;
}

export async function deleteGameState(
  roomId: string
): Promise<void> {
  await redisClient.del(
    gameKey(roomId)
  );
}

export async function gameStateExists(
  roomId: string
): Promise<boolean> {
  const exists = await redisClient.exists(
    gameKey(roomId)
  );

  return exists === 1;
}
