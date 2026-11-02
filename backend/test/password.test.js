import assert from "node:assert/strict";
import test from "node:test";
import {
  hashPassword,
  verifyPassword,
} from "../src/utils/password.js";

test("hashPassword creates a salted password hash", async () => {
  const firstHash = await hashPassword("Password123!");
  const secondHash = await hashPassword("Password123!");

  assert.notEqual(firstHash, secondHash);
  assert.match(firstHash, /^[a-f0-9]+:[a-f0-9]+$/);
});

test("verifyPassword accepts the original password", async () => {
  const hash = await hashPassword("Password123!");

  assert.equal(await verifyPassword("Password123!", hash), true);
});

test("verifyPassword rejects the wrong password", async () => {
  const hash = await hashPassword("Password123!");

  assert.equal(await verifyPassword("WrongPassword123!", hash), false);
});

test("verifyPassword rejects malformed hashes", async () => {
  assert.equal(await verifyPassword("Password123!", "invalid"), false);
});

test("hashPassword rejects short passwords", async () => {
  await assert.rejects(
    () => hashPassword("short"),
    /at least 8 characters/
  );
});