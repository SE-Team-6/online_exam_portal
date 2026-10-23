import { verifyToken } from "../utils/jwt.js";

function authError() {
  return Object.assign(new Error("Missing, invalid, or expired session token"), {
    statusCode: 401,
    code: "UNAUTHORIZED",
  });
}

export function requireAuth(req, _res, next) {
  const header = req.headers?.authorization;
  const token = typeof header === "string" && header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : "";

  if (!token) return next(authError());

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.id, role: payload.role };
    return next();
  } catch {
    return next(authError());
  }
}
