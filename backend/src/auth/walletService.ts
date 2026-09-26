import { pool } from "../database/postgres.js";

const SIGNUP_BONUS = 5000;

export async function createWalletWithSignupBonus(
  userId: number
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const walletResult = await client.query(
      `
      INSERT INTO wallets (
        user_id,
        balance
      )
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET
        updated_at = NOW()
      RETURNING id, balance
      `,
      [userId, SIGNUP_BONUS]
    );

    const wallet = walletResult.rows[0];

    const existingBonus = await client.query(
      `
      SELECT id
      FROM wallet_transactions
      WHERE wallet_id = $1
        AND transaction_type = 'signup_bonus'
      LIMIT 1
      `,
      [wallet.id]
    );

    if (existingBonus.rows.length === 0) {
      await client.query(
        `
        INSERT INTO wallet_transactions (
          wallet_id,
          amount,
          balance_before,
          balance_after,
          transaction_type,
          reference_id,
          description
        )
        VALUES (
          $1,
          $2,
          0,
          $3,
          'signup_bonus',
          $4,
          $5
        )
        `,
        [
          wallet.id,
          SIGNUP_BONUS,
          SIGNUP_BONUS,
          `signup:${userId}`,
          "Welcome bonus"
        ]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getWalletBalance(
  userId: number
): Promise<number> {
  const result = await pool.query(
    `
    SELECT balance
    FROM wallets
    WHERE user_id = $1
    `,
    [userId]
  );

  if (result.rows.length === 0) {
    return 0;
  }

  return Number(result.rows[0].balance);
}
