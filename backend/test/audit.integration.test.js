import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import mongoose from "mongoose";
import app from "../src/app.js";
import AuditLog from "../src/models/AuditLog.js";
import User from "../src/models/User.js";
import { signToken } from "../src/utils/jwt.js";

process.env.JWT_SECRET ||= "test-only-secret-long-enough-for-audit-tests";

const mongoUri =
  process.env.MONGODB_URI ??
  "mongodb://127.0.0.1:27017/online_exam_portal_test";

let server;
let baseUrl;
let admin;
let instructor;
let student;
let adminToken;
let instructorToken;
let studentToken;
let requestIds = [];

before(async () => {
  await mongoose.connect(mongoUri);
  await Promise.all([User.init(), AuditLog.init()]);

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  [admin, instructor, student] = await User.create([
    {
      name: "Audit Test Admin",
      email: `audit-admin-${suffix}@example.com`,
      role: "admin",
      passwordHash: "test-only-not-used",
    },
    {
      name: "Audit Test Instructor",
      email: `audit-instructor-${suffix}@example.com`,
      role: "instructor",
      passwordHash: "test-only-not-used",
    },
    {
      name: "Audit Test Student",
      email: `audit-student-${suffix}@example.com`,
      role: "student",
      passwordHash: "test-only-not-used",
    },
  ]);

  adminToken = signToken({ id: admin._id.toString(), role: "admin" });
  instructorToken = signToken({
    id: instructor._id.toString(),
    role: "instructor",
  });
  studentToken = signToken({ id: student._id.toString(), role: "student" });

  requestIds = [
    `audit-test-question-${suffix}`,
    `audit-test-exam-${suffix}`,
  ];

  await AuditLog.create([
    {
      actorId: admin._id,
      action: "question.created",
      targetType: "Question",
      requestId: requestIds[0],
      metadata: { privateTestValue: "must-not-be-returned" },
    },
    {
      actorId: admin._id,
      action: "exam.scheduled",
      targetType: "Exam",
      requestId: requestIds[1],
    },
  ]);

  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  if (requestIds.length) {
    await AuditLog.deleteMany({ requestId: { $in: requestIds } });
  }

  const userIds = [admin?._id, instructor?._id, student?._id].filter(Boolean);
  if (userIds.length) {
    await User.deleteMany({ _id: { $in: userIds } });
  }

  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
  }
});

test("audit log endpoint requires an admin", async () => {
  const anonymous = await fetch(`${baseUrl}/api/admin/audit-logs`);
  assert.equal(anonymous.status, 401);

  for (const token of [studentToken, instructorToken]) {
    const response = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 403);
  }
});

test("admin can filter audit logs and does not receive metadata", async () => {
  const response = await fetch(
    `${baseUrl}/api/admin/audit-logs?action=question.created&limit=10`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.entries.length, 1);
  assert.equal(body.entries[0].action, "question.created");
  assert.equal(body.entries[0].requestId, requestIds[0]);
  assert.equal("metadata" in body.entries[0], false);
});

test("audit log limit is clamped to 100", async () => {
  const response = await fetch(
    `${baseUrl}/api/admin/audit-logs?limit=500`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(body.entries.length <= 100);
});