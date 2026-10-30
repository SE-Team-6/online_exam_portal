import express from "express";
import User from "../models/User.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";

const router = express.Router();

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

function apiError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function invalidCredentials() {
  return apiError(
    401,
    "INVALID_CREDENTIALS",
    "Invalid email or password"
  );
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return next(
        apiError(
          400,
          "INVALID_REGISTRATION",
          "Name, email, and an 8-character password are required"
        )
      );
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: await hashPassword(password),
      role: "student",
    });

    return res.status(201).json({
      user: {
        id: user._id.toString(),
        role: user.role,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return next(
        apiError(
          409,
          "EMAIL_IN_USE",
          "An account with that email already exists"
        )
      );
    }

    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { identifier, password } = req.body ?? {};

    if (
      typeof identifier !== "string" ||
      typeof password !== "string"
    ) {
      return next(invalidCredentials());
    }

    const user = await User.findOne({
      email: identifier.trim().toLowerCase(),
    }).select("+passwordHash");

    if (!user) {
      return next(invalidCredentials());
    }

    const isLocked =
      user.lockedAt &&
      Date.now() - user.lockedAt.getTime() <
        LOCKOUT_MINUTES * 60 * 1000;

    if (isLocked) {
      return next(
        apiError(
          423,
          "ACCOUNT_LOCKED",
          "Account is temporarily locked"
        )
      );
    }

    if (user.lockedAt) {
      user.lockedAt = null;
      user.failedLoginCount = 0;
    }

    const passwordMatches = await verifyPassword(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      user.failedLoginCount += 1;

      if (user.failedLoginCount >= MAX_FAILED_LOGINS) {
        user.lockedAt = new Date();
      }

      await user.save();
      return next(invalidCredentials());
    }

    user.failedLoginCount = 0;
    user.lockedAt = null;
    await user.save();

    return res.status(200).json({
      token: signToken(user),
      expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
      user: {
        id: user._id.toString(),
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;