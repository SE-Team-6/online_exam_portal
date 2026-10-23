import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import { signToken, verifyToken } from "../src/utils/jwt.js";
import { requireAuth } from "../src/middleware/requireAuth.js";
import { requireRole } from "../src/middleware/requireRole.js";

process.env.JWT_SECRET ||= "test-only-secret-long-enough-for-unit-tests";

const user = { id: "user-123", role: "student" };

function invokeMiddleware(middleware, req) {
  let receivedError;
  middleware(req, {}, (error) => { receivedError = error; });
  return receivedError;
}

test("signs a token with user id, role, and expiry", () => {
  const token = signToken(user);
  const decoded = jwt.decode(token);
  assert.equal(decoded.id, user.id);
  assert.equal(decoded.sub, user.id);
  assert.equal(decoded.role, user.role);
  assert.ok(decoded.exp > decoded.iat);
  assert.equal(verifyToken(token).id, user.id);
});

test("rejects a token with a tampered signature", () => {
  const token = signToken(user);
  const [header, payload, signature] = token.split(".");
  const changed = signature[0] === "a" ? "b" : "a";
  assert.throws(() => verifyToken(`${header}.${payload}.${changed}${signature.slice(1)}`));
});

test("rejects an expired token", () => {
  const expired = signToken(user, { expiresIn: -1 });
  assert.throws(() => verifyToken(expired));
});

test("requireAuth attaches the verified user to the request", () => {
  const req = { headers: { authorization: `Bearer ${signToken(user)}` } };
  assert.equal(invokeMiddleware(requireAuth, req), undefined);
  assert.deepEqual(req.user, user);
});

test("requireAuth rejects a missing bearer token with 401", () => {
  const error = invokeMiddleware(requireAuth, { headers: {} });
  assert.equal(error.statusCode, 401);
  assert.equal(error.code, "UNAUTHORIZED");
});

test("requireRole blocks users with the wrong role", () => {
  const error = invokeMiddleware(requireRole("admin"), { user: { id: user.id, role: "student" } });
  assert.equal(error.statusCode, 403);
  assert.equal(error.code, "FORBIDDEN");
});
