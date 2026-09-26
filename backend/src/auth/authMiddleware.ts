import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "./jwtService.js";

export interface AuthenticatedRequest
  extends Request {
  user?: {
    userId: number;
    mobile: string;
  };
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authorization =
    req.headers.authorization;

  if (!authorization) {
    res.status(401).json({
      success: false,
      message: "Authentication required"
    });
    return;
  }

  const [scheme, token] =
    authorization.split(" ");

  if (
    scheme !== "Bearer" ||
    !token
  ) {
    res.status(401).json({
      success: false,
      message: "Invalid authorization header"
    });
    return;
  }

  try {
    const payload =
      verifyAuthToken(token);

    req.user = payload;

    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token"
    });
  }
}
