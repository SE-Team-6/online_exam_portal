import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import mongoose from "mongoose";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { hashPassword } from "../src/utils/password.js";

process.env.JWT_SECRET ||= "test-only-secret-long-enough-for-integration-tests";

const mongoUri =
  process.env.MONGODB_URI ??
  "mongodb://127.0.0.1:27017/online_exam_portal_test";

let server;
let baseUrl;
let testEmail;

before(async () => {
  await mongoose.connect(mongoUri);

  server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;

  testEmail = `lockout-${Date.now()}@example.com`;

  await User.create({
    name: "Lockout Test User",
    email: testEmail,
    role: "student",
    passwordHash: await hashPassword("CorrectPassword123!"),
  });
});

after(async () => {
  await User.deleteOne({ email: testEmail });

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  await mongoose.disconnect();
});

async function login(password) {
  return fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier: testEmail,
      password,
    }),
  });
}

test("locks an account after five failed logins", async () => {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await login("WrongPassword123!");
    assert.equal(response.status, 401, `Attempt ${attempt} should return 401`);
  }

  const userAfterFailures = await User.findOne({ email: testEmail })
    .select("+passwordHash");

  assert.equal(userAfterFailures.failedLoginCount, 5);
  assert.ok(userAfterFailures.lockedAt);

  const lockedResponse = await login("WrongPassword123!");
  const lockedBody = await lockedResponse.json();

  assert.equal(lockedResponse.status, 423);
  assert.equal(lockedBody.error.code, "ACCOUNT_LOCKED");
});

test("successful login resets failed login state", async () => {
  await User.updateOne(
    { email: testEmail },
    {
      $set: {
        failedLoginCount: 0,
        lockedAt: null,
      },
    }
  );

  const response = await login("CorrectPassword123!");
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(body.token);
  assert.equal(body.user.role, "student");

  const userAfterLogin = await User.findOne({ email: testEmail });

  assert.equal(userAfterLogin.failedLoginCount, 0);
  assert.equal(userAfterLogin.lockedAt, null);
});