import { pool } from "../database/postgres.js";
import crypto from "crypto";

export interface DatabaseRoom {
  id: number;
  room_id: string;
  status: string;
  max_players: number;
  created_at: Date;
  updated_at: Date;
  entry_fee: number;
}

export interface FriendGameInvite {
  id: number;
  invite_code: string;
  room_id: number;
  created_by: number;
  entry_fee: number;
  status: string;
  expires_at: Date;
  created_at: Date;
}

export async function createRoomInDatabase(
  roomId: string,
  maxPlayers = 6,
  entryFee = 500
): Promise<DatabaseRoom> {
  const result = await pool.query<DatabaseRoom>(
    `
    INSERT INTO rooms (
      room_id,
      status,
      max_players,
      entry_fee
    )
    VALUES ($1, 'waiting', $2, $3)
    RETURNING *
    `,
    [roomId, maxPlayers, entryFee]
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

function generateInviteCode(): string {
  return crypto
    .randomBytes(5)
    .toString("base64url")
    .slice(0, 8)
    .toUpperCase();
}

export async function createFriendGameInvite(
  roomId: string,
  createdBy: number,
  entryFee: number
): Promise<FriendGameInvite> {
  const roomResult = await pool.query<{
    id: number;
    entry_fee: number;
  }>(
    `
    SELECT id, entry_fee
    FROM rooms
    WHERE room_id = $1
    LIMIT 1
    `,
    [roomId]
  );

  if (roomResult.rows.length === 0) {
    throw new Error("Room not found");
  }

  const room = roomResult.rows[0];

  if (room.entry_fee !== entryFee) {
    throw new Error("Room entry fee mismatch");
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const inviteCode = generateInviteCode();

    try {
      const result = await pool.query<FriendGameInvite>(
        `
        INSERT INTO friend_game_invites (
          invite_code,
          room_id,
          created_by,
          entry_fee,
          status,
          expires_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          'active',
          NOW() + INTERVAL '24 hours'
        )
        RETURNING *
        `,
        [
          inviteCode,
          room.id,
          createdBy,
          entryFee
        ]
      );

      return result.rows[0];
    } catch (error: any) {
      if (error?.code !== "23505") {
        throw error;
      }
    }
  }

  throw new Error("Unable to generate a unique invite code");
}

export async function getFriendGameInvite(
  inviteCode: string
): Promise<FriendGameInvite | null> {
  const result = await pool.query<FriendGameInvite>(
    `
    SELECT *
    FROM friend_game_invites
    WHERE invite_code = $1
      AND status = 'active'
      AND expires_at > NOW()
    LIMIT 1
    `,
    [inviteCode.trim().toUpperCase()]
  );

  return result.rows[0] ?? null;
}

export async function markFriendGameInviteUsed(
  inviteCode: string
): Promise<void> {
  await pool.query(
    `
    UPDATE friend_game_invites
    SET status = 'used'
    WHERE invite_code = $1
      AND status = 'active'
    `,
    [inviteCode.trim().toUpperCase()]
  );
}
