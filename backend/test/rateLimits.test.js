import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { requestIdMiddleware } from "../src/middleware/requestId.js";
import {
  createApiRateLimiter,
  createLoginRateLimiter,
} from "../src/middleware/rateLimits.js";

async function withServer(app, run) {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test("API rate limiter returns a structured 429 after its configured request cap", async () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.use("/api", createApiRateLimiter({ limit: 2, windowMs: 60_000 }));
  app.get("/api/resource", (_req, res) => res.status(200).json({ ok: true }));

  await withServer(app, async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/api/resource`)).status, 200);
    assert.equal((await fetch(`${baseUrl}/api/resource`)).status, 200);

    const limitedResponse = await fetch(`${baseUrl}/api/resource`);
    const body = await limitedResponse.json();
    assert.equal(limitedResponse.status, 429);
    assert.equal(body.error.code, "RATE_LIMITED");
    assert.equal(body.error.requestId, limitedResponse.headers.get("x-request-id"));
    assert.ok(limitedResponse.headers.has("ratelimit"));
  });
});

test("API rate limiter allows 300 requests per IP in a minute by default", async () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.use("/api", createApiRateLimiter());
  app.get("/api/resource", (_req, res) => res.status(200).end());

  await withServer(app, async (baseUrl) => {
    let allowed = 0;
    let limited = 0;
    for (let attempt = 0; attempt < 301; attempt += 1) {
      const response = await fetch(`${baseUrl}/api/resource`);
      if (response.status === 200) allowed += 1;
      if (response.status === 429) limited += 1;
    }
    assert.equal(allowed, 300);
    assert.equal(limited, 1);
  });
});

test("login rate limiter normalizes identifiers and keeps distinct accounts separate", async () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(express.json());
  app.post(
    "/login",
    createLoginRateLimiter(),
    (_req, res) => res.status(401).end(),
  );

  await withServer(app, async (baseUrl) => {
    const login = (identifier) => fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const identifier = attempt % 2 === 0
        ? " Student@Example.com "
        : "student@example.com";
      assert.equal((await login(identifier)).status, 401);
    }

    const blockedResponse = await login("STUDENT@example.com");
    assert.equal(blockedResponse.status, 429);
    assert.equal((await blockedResponse.json()).error.code, "RATE_LIMITED");

    assert.equal((await login("another@example.com")).status, 401);
  });
});
