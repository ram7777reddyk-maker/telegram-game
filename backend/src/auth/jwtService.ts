import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  userId: number;
  mobile: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export function createAuthToken(
  userId: number,
  mobile: string
): string {
  return jwt.sign(
    {
      userId,
      mobile
    },
    getJwtSecret(),
    {
      expiresIn: "7d"
    }
  );
}

export function verifyAuthToken(
  token: string
): AuthTokenPayload {
  const payload = jwt.verify(
    token,
    getJwtSecret()
  ) as jwt.JwtPayload & {
    userId?: number;
    mobile?: string;
  };

  if (
    typeof payload.userId !== "number" ||
    typeof payload.mobile !== "string"
  ) {
    throw new Error("Invalid authentication token");
  }

  return {
    userId: payload.userId,
    mobile: payload.mobile
  };
}
