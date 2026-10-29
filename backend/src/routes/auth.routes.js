import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import express from "express";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

const scrypt = promisify(scryptCallback);
const router = express.Router();
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const derivedKey = await scrypt(password, salt, 64);
  const expectedKey = Buffer.from(key, "hex");
  return expectedKey.length === derivedKey.length &&
    timingSafeEqual(expectedKey, derivedKey);
}

function authError() {
  return Object.assign(new Error("Invalid email or password"), {
    statusCode: 401,
    code: "INVALID_CREDENTIALS",
  });
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
      return next(Object.assign(new Error("Name, email, and an 8-character password are required"), {
        statusCode: 400,
        code: "INVALID_REGISTRATION",
      }));
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: await hashPassword(password),
      role: "student",
    });

    return res.status(201).json({
      user: { id: user._id.toString(), role: user.role },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return next(Object.assign(new Error("An account with that email already exists"), {
        statusCode: 409,
        code: "EMAIL_IN_USE",
      }));
    }
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { identifier, password } = req.body ?? {};
    if (typeof identifier !== "string" || typeof password !== "string") {
      return next(authError());
    }

    const user = await User.findOne({ email: identifier.trim().toLowerCase() })
      .select("+passwordHash");
    if (!user) return next(authError());

    if (
      user.lockedAt &&
      Date.now() - user.lockedAt.getTime() < LOCKOUT_MINUTES * 60 * 1000
    ) {
      return next(Object.assign(new Error("Account is temporarily locked"), {
        statusCode: 423,
        code: "ACCOUNT_LOCKED",
      }));
    }

    if (user.lockedAt) {
      user.lockedAt = null;
      user.failedLoginCount = 0;
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      user.failedLoginCount += 1;
      if (user.failedLoginCount >= MAX_FAILED_LOGINS) {
        user.lockedAt = new Date();
      }
      await user.save();
      return next(authError());
    }

    user.failedLoginCount = 0;
    user.lockedAt = null;
    await user.save();

    return res.status(200).json({
      token: signToken(user),
      expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
      user: { id: user._id.toString(), role: user.role },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
