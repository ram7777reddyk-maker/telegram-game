import bcrypt from "bcrypt";
import { pool } from "../database/postgres.js";

export interface SignupInput {
  name: string;
  mobile: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  mobile: string;
  isVerified: boolean;
}

function normalizeMobile(mobile: string): string {
  return mobile.replace(/[\s-]/g, "");
}

export async function findUserByMobile(
  mobile: string
): Promise<AuthUser | null> {
  const normalizedMobile = normalizeMobile(mobile);

  const result = await pool.query(
    `
    SELECT
      id,
      CONCAT_WS(' ', first_name, last_name) AS name,
      mobile,
      is_verified
    FROM users
    WHERE mobile = $1
    LIMIT 1
    `,
    [normalizedMobile]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  return {
    id: Number(user.id),
    name: user.name ?? "",
    mobile: user.mobile,
    isVerified: user.is_verified
  };
}

export async function createPendingUser(
  input: SignupInput
): Promise<AuthUser> {
  const normalizedMobile = normalizeMobile(input.mobile);

  const existingUser = await findUserByMobile(normalizedMobile);

  if (existingUser) {
    throw new Error("An account already exists with this mobile number");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const nameParts = input.name.trim().split(/\s+/);
  const firstName = nameParts.shift() ?? "";
  const lastName = nameParts.join(" ") || null;

  const result = await pool.query(
    `
    INSERT INTO users (
      mobile,
      first_name,
      last_name,
      password_hash,
      auth_type,
      is_verified
    )
    VALUES ($1, $2, $3, $4, 'mobile', FALSE)
    RETURNING
      id,
      mobile,
      first_name,
      last_name,
      is_verified
    `,
    [
      normalizedMobile,
      firstName,
      lastName,
      passwordHash
    ]
  );

  const user = result.rows[0];

  return {
    id: Number(user.id),
    name: [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" "),
    mobile: user.mobile,
    isVerified: user.is_verified
  };
}

export async function verifyPassword(
  mobile: string,
  password: string
): Promise<AuthUser | null> {
  const normalizedMobile = normalizeMobile(mobile);

  const result = await pool.query(
    `
    SELECT
      id,
      mobile,
      first_name,
      last_name,
      password_hash,
      is_verified
    FROM users
    WHERE mobile = $1
      AND auth_type = 'mobile'
    LIMIT 1
    `,
    [normalizedMobile]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  if (!user.password_hash) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatches) {
    return null;
  }

  return {
    id: Number(user.id),
    name: [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" "),
    mobile: user.mobile,
    isVerified: user.is_verified
  };
}
