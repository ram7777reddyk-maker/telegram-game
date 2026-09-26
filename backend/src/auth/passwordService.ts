import bcrypt from "bcrypt";
import { pool } from "../database/postgres.js";

export async function resetUserPassword(
  mobile: string,
  newPassword: string
): Promise<boolean> {
  const passwordHash =
    await bcrypt.hash(newPassword, 12);

  const result = await pool.query(
    `
    UPDATE users
    SET
      password_hash = $1,
      updated_at = NOW()
    WHERE mobile = $2
      AND auth_type = 'mobile'
    `,
    [passwordHash, mobile]
  );

  return result.rowCount === 1;
}
