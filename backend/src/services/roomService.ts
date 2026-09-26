import { pool } from "../database/postgres.js";

export interface DatabaseRoom {
  id: number;
  room_id: string;
  status: string;
  max_players: number;
  created_at: Date;
  updated_at: Date;
}

export async function createRoomInDatabase(
  roomId: string,
  maxPlayers = 6
): Promise<DatabaseRoom> {
  const result = await pool.query<DatabaseRoom>(
    `
    INSERT INTO rooms (room_id, status, max_players)
    VALUES ($1, 'waiting', $2)
    RETURNING *
    `,
    [roomId, maxPlayers]
  );

  return result.rows[0];
}

export async function getRoomFromDatabase(
  roomId: string
): Promise<DatabaseRoom | null> {
  const result = await pool.query<DatabaseRoom>(
    `
    SELECT *
    FROM rooms
    WHERE room_id = $1
    `,
    [roomId]
  );

  return result.rows[0] ?? null;
}

export async function addPlayerToDatabase(
  roomId: string,
  playerId: string,
  username?: string
): Promise<void> {
  await pool.query(
    `
    INSERT INTO room_players (room_id, player_id, username)
    SELECT id, $2, $3
    FROM rooms
    WHERE room_id = $1
    ON CONFLICT (room_id, player_id)
    DO UPDATE SET
      username = EXCLUDED.username,
      left_at = NULL
    `,
    [roomId, playerId, username ?? null]
  );
}

export async function removePlayerFromDatabase(
  roomId: string,
  playerId: string
): Promise<void> {
  await pool.query(
    `
    UPDATE room_players rp
    SET left_at = NOW()
    FROM rooms r
    WHERE rp.room_id = r.id
      AND r.room_id = $1
      AND rp.player_id = $2
      AND rp.left_at IS NULL
    `,
    [roomId, playerId]
  );
}
