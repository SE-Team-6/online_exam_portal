import { randomUUID } from "node:crypto";

export function requestIdMiddleware(_req, res, next) {
  res.locals.requestId = randomUUID();
  res.setHeader("X-Request-Id", res.locals.requestId);
  next();
}