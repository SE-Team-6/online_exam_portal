
test("TC-08: Health endpoint returns JSON content type", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /application\/json/i
  );

  const body = await response.json();
  assert.equal(body.status, "ok");
});

test("TC-07: Malformed JSON returns HTTP 400", async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: '{"name": ',
  });

  assert.equal(response.status, 400);

  const body = await response.json();

    assert.ok(body.error.code);
  assert.ok(body.error.requestId);
});

test("TC-03: Unsupported HTTP method returns 404", async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    method: "POST",
  });

  assert.equal(response.status, 404);
});

test("TC-05: Each request receives a unique request ID", async () => {
  const firstResponse = await fetch(`${baseUrl}/api/health`);
  const secondResponse = await fetch(`${baseUrl}/api/health`);

  assert.equal(firstResponse.status, 200);
  assert.equal(secondResponse.status, 200);

  const firstId = firstResponse.headers.get("x-request-id");
  const secondId = secondResponse.headers.get("x-request-id");

  assert.ok(firstId, "First response should have a request ID");
  assert.ok(secondId, "Second response should have a request ID");
  assert.notEqual(firstId, secondId);
});

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});

test("TC-01: Health endpoint returns HTTP 200", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
});

test("TC-06: Unknown route returns a structured 404 error", async () => {
  const response = await fetch(`${baseUrl}/api/unknown`);
  const body = await response.json();
  const requestId = response.headers.get("x-request-id");

  assert.equal(response.status, 404);
  assert.equal(body.error.code, "NOT_FOUND");
  assert.equal(body.error.message, "Route not found");
  assert.ok(requestId, "Response should contain X-Request-Id");
  assert.equal(body.error.requestId, requestId);
});
