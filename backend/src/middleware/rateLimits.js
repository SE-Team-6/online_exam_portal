import { ipKeyGenerator, rateLimit } from "express-rate-limit";

const WINDOW_MS = 60 * 1000;

function rateLimitHandler(req, res) {
  res.status(429).json({
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again later.",
      requestId: res.locals.requestId,
    },
  });
}

export function createApiRateLimiter({ windowMs = WINDOW_MS, limit = 300 } = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
}

export function createLoginRateLimiter({ windowMs = WINDOW_MS, limit = 10 } = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) => {
      const address = ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? "unknown");
      const identifier = typeof req.body?.identifier === "string"
        ? req.body.identifier.trim().toLowerCase().slice(0, 254)
        : "<missing-identifier>";
      return `${address}:${identifier}`;
    },
    handler: rateLimitHandler,
  });
}

export const apiRateLimiter = createApiRateLimiter();
export const loginRateLimiter = createLoginRateLimiter();
