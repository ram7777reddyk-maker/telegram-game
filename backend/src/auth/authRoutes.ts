import { Router } from "express";
import {
  createPendingUser,
  findUserByMobile,
  verifyPassword
} from "./authService.js";
import {
  createOtp,
  verifyOtp
} from "./otpService.js";
import {
  createWalletWithSignupBonus,
  getWalletBalance
} from "./walletService.js";
import { createAuthToken } from "./jwtService.js";
import { requireAuth, type AuthenticatedRequest } from "./authMiddleware.js";
import { resetUserPassword } from "./passwordService.js";
import { pool } from "../database/postgres.js";

const router = Router();

function normalizeMobile(mobile: string): string {
  return mobile.replace(/[\s-]/g, "");
}

router.post("/signup", async (req, res) => {
  try {
    const { name, mobile, password } = req.body ?? {};

    if (
      typeof name !== "string" ||
      typeof mobile !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, mobile and password are required"
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid name"
      });
    }

    const normalizedMobile = normalizeMobile(mobile);

    if (!/^\+?[1-9]\d{9,14}$/.test(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid mobile number"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters"
      });
    }

    const existingUser = await findUserByMobile(normalizedMobile);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account already exists with this mobile number"
      });
    }

    const user = await createPendingUser({
      name: name.trim(),
      mobile: normalizedMobile,
      password
    });

    await createOtp(normalizedMobile, "signup");

    return res.status(201).json({
      success: true,
      message: "OTP sent successfully",
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile
      }
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create account"
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { mobile, otp } = req.body ?? {};

    if (
      typeof mobile !== "string" ||
      typeof otp !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Mobile and OTP are required"
      });
    }

    const normalizedMobile = normalizeMobile(mobile);

    const valid = await verifyOtp(
      normalizedMobile,
      "signup",
      otp
    );

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    const user = await findUserByMobile(normalizedMobile);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found"
      });
    }

    await pool.query(
      `
      UPDATE users
      SET
        is_verified = TRUE,
        updated_at = NOW()
      WHERE id = $1
      `,
      [user.id]
    );

    await createWalletWithSignupBonus(user.id);

    const balance = await getWalletBalance(user.id);

    const token = createAuthToken(
      user.id,
      user.mobile
    );

    return res.json({
      success: true,
      message: "Account verified successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        isVerified: true
      },
      wallet: {
        balance
      }
    });
  } catch (error) {
    console.error("OTP verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP"
    });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { mobile } = req.body ?? {};

    if (typeof mobile !== "string") {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required"
      });
    }

    const normalizedMobile = normalizeMobile(mobile);

    const user = await findUserByMobile(normalizedMobile);

    if (!user) {
      return res.json({
        success: true,
        message: "If an account exists, an OTP has been sent"
      });
    }

    await createOtp(
      normalizedMobile,
      "forgot_password"
    );

    return res.json({
      success: true,
      message: "OTP sent successfully"
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process password reset"
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const {
      mobile,
      otp,
      newPassword
    } = req.body ?? {};

    if (
      typeof mobile !== "string" ||
      typeof otp !== "string" ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Mobile, OTP and new password are required"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters"
      });
    }

    const normalizedMobile = normalizeMobile(mobile);

    const valid = await verifyOtp(
      normalizedMobile,
      "forgot_password",
      otp
    );

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    const updated = await resetUserPassword(
      normalizedMobile,
      newPassword
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "User account not found"
      });
    }

    return res.json({
      success: true,
      message: "Password reset successfully"
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password"
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { mobile, password } = req.body ?? {};

    if (
      typeof mobile !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Mobile and password are required"
      });
    }

    const user = await verifyPassword(
      mobile,
      password
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile number or password"
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your mobile number first"
      });
    }

    const balance = await getWalletBalance(user.id);

    const token = createAuthToken(
      user.id,
      user.mobile
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user,
      wallet: {
        balance
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login"
    });
  }
});

router.get(
  "/me",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const result = await pool.query(
        `
        SELECT
          id,
          CONCAT_WS(
            ' ',
            first_name,
            last_name
          ) AS name,
          mobile,
          is_verified
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      const user = result.rows[0];

      const balance = await getWalletBalance(
        Number(user.id)
      );

      return res.json({
        success: true,
        user: {
          id: Number(user.id),
          name: user.name ?? "",
          mobile: user.mobile,
          isVerified: user.is_verified
        },
        wallet: {
          balance
        }
      });
    } catch (error) {
      console.error(
        "Get current user error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to load account"
      });
    }
  }
);

export default router;
