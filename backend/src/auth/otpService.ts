import crypto from "crypto";
import { pool } from "../database/postgres.js";

export type OtpPurpose =
  | "signup"
  | "forgot_password"
  | "login";

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

function generateOtp(): string {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
}

function hashOtp(otp: string): string {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
}

export async function createOtp(
  mobile: string,
  purpose: OtpPurpose
): Promise<string> {
  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  await pool.query(
    `
    UPDATE otp_verifications
    SET verified_at = NOW()
    WHERE mobile = $1
      AND purpose = $2
      AND verified_at IS NULL
    `,
    [mobile, purpose]
  );

  await pool.query(
    `
    INSERT INTO otp_verifications (
      mobile,
      otp_hash,
      purpose,
      expires_at
    )
    VALUES (
      $1,
      $2,
      $3,
      NOW() + INTERVAL '5 minutes'
    )
    `,
    [mobile, otpHash, purpose]
  );

  console.log(
    `[DEV OTP] ${purpose} OTP for ${mobile}: ${otp}`
  );

  return otp;
}

export async function verifyOtp(
  mobile: string,
  purpose: OtpPurpose,
  otp: string
): Promise<boolean> {
  const result = await pool.query(
    `
    SELECT
      id,
      otp_hash,
      expires_at,
      attempts
    FROM otp_verifications
    WHERE mobile = $1
      AND purpose = $2
      AND verified_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [mobile, purpose]
  );

  if (result.rows.length === 0) {
    return false;
  }

  const record = result.rows[0];

  if (record.attempts >= MAX_ATTEMPTS) {
    return false;
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    return false;
  }

  await pool.query(
    `
    UPDATE otp_verifications
    SET attempts = attempts + 1
    WHERE id = $1
    `,
    [record.id]
  );

  const suppliedHash = hashOtp(otp);

  if (
    !crypto.timingSafeEqual(
      Buffer.from(suppliedHash),
      Buffer.from(record.otp_hash)
    )
  ) {
    return false;
  }

  await pool.query(
    `
    UPDATE otp_verifications
    SET verified_at = NOW()
    WHERE id = $1
    `,
    [record.id]
  );

  return true;
}
