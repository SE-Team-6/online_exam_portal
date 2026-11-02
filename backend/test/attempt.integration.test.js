import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import mongoose from "mongoose";
import app from "../src/app.js";
import Attempt from "../src/models/Attempt.js";
import AuditLog from "../src/models/AuditLog.js";
import Exam from "../src/models/Exam.js";
import Question from "../src/models/Questions.js";
import Result from "../src/models/Result.js";
import User from "../src/models/User.js";
import { autoSubmitExpiredAttempts } from "../src/services/attempt.service.js";
import { signToken } from "../src/utils/jwt.js";

process.env.JWT_SECRET ||= "test-only-secret-long-enough-for-attempt-tests";

const mongoUri =
  process.env.MONGODB_URI ??
  "mongodb://127.0.0.1:27017/online_exam_portal_test";

let server;
let baseUrl;
let instructor;
let student;
let otherStudent;
let studentToken;
let otherStudentToken;
let instructorToken;
const createdQuestionIds = [];

before(async () => {
  await mongoose.connect(mongoUri);
  await Promise.all([
    User.init(),
    Exam.init(),
    Question.init(),
    Attempt.init(),
    Result.init(),
    AuditLog.init(),
  ]);

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  [instructor, student, otherStudent] = await User.create([
    {
      name: "Attempt Test Instructor",
      email: `attempt-instructor-${suffix}@example.com`,
      role: "instructor",
      passwordHash: "test-only-not-used",
    },
    {
      name: "Attempt Test Student",
      email: `attempt-student-${suffix}@example.com`,
      role: "student",
      passwordHash: "test-only-not-used",
    },
    {
      name: "Attempt Test Other Student",
      email: `attempt-other-${suffix}@example.com`,
      role: "student",
      passwordHash: "test-only-not-used",
    },
  ]);

  instructorToken = signToken({ id: instructor._id.toString(), role: "instructor" });
  studentToken = signToken({ id: student._id.toString(), role: "student" });
  otherStudentToken = signToken({ id: otherStudent._id.toString(), role: "student" });

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
      server.close((error) => error ? reject(error) : resolve());
    });
  }

  if (mongoose.connection.readyState) {
    const userIds = [instructor?._id, student?._id, otherStudent?._id].filter(Boolean);
    await Promise.all([
      Result.deleteMany({ studentId: { $in: userIds } }),
      Attempt.deleteMany({ studentId: { $in: userIds } }),
      AuditLog.deleteMany({ actorId: { $in: userIds } }),
      Exam.deleteMany({ createdBy: instructor?._id }),
      Question.deleteMany({ _id: { $in: createdQuestionIds } }),
      User.deleteMany({ _id: { $in: userIds } }),
    ]);
    await mongoose.disconnect();
  }
});

async function request(path, { token, method = "GET", body } = {}) {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body !== undefined) headers.set("Content-Type", "application/json");

  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function createExamFixture({ durationSeconds = 3600, endsAt } = {}) {
  const questions = await Question.create([
    {
      stem: "Which option is correct for question one?",
      options: [
        { optionId: "A", text: "One A" },
        { optionId: "B", text: "One B" },
        { optionId: "C", text: "One C" },
        { optionId: "D", text: "One D" },
      ],
      correctOptionId: "A",
      difficulty: "easy",
    },
    {
      stem: "Which option is correct for question two?",
      options: [
        { optionId: "A", text: "Two A" },
        { optionId: "B", text: "Two B" },
        { optionId: "C", text: "Two C" },
        { optionId: "D", text: "Two D" },
      ],
      correctOptionId: "B",
      difficulty: "medium",
    },
  ]);
  createdQuestionIds.push(...questions.map((question) => question._id));

  const startsAt = new Date(Date.now() - 60_000);
  const examEndsAt = endsAt ?? new Date(Date.now() + 2 * 60 * 60 * 1000);
  const exam = await Exam.create({
    title: "Attempt API integration exam",
    description: "Disposable integration-test data",
    questionIds: questions.map((question) => question._id),
    durationSeconds,
    startsAt,
    endsAt: examEndsAt,
    createdBy: instructor._id,
  });

  return { exam, questions };
}

async function startCanonicalAttempt(examId, token = studentToken) {
  const response = await request(`/api/exams/${examId}/attempts`, {
    token,
    method: "POST",
  });
  return { response, body: await response.json() };
}

test("attempt start requires a student and never returns the answer key", async () => {
  const { exam } = await createExamFixture({
    endsAt: new Date(Date.now() + 5 * 60 * 1000),
  });
  const path = `/api/exams/${exam._id}/attempts`;

  const unauthenticated = await request(path, { method: "POST" });
  assert.equal(unauthenticated.status, 401);

  const instructorResponse = await request(path, {
    token: instructorToken,
    method: "POST",
  });
  assert.equal(instructorResponse.status, 403);

  const { response, body } = await startCanonicalAttempt(exam._id.toString());
  assert.equal(response.status, 201);
  assert.ok(body.attemptId);
  assert.equal(body.status, "in_progress");
  assert.equal(body.questions.length, 2);
  assert.equal(JSON.stringify(body).includes("correctOptionId"), false);
  assert.ok(body.questions.every((question) => !("correctOptionId" in question)));

  const startTime = new Date(body.startedAt).getTime();
  const deadline = new Date(body.expiresAt).getTime();
  assert.ok(deadline > startTime);
  assert.ok(deadline <= exam.endsAt.getTime());

  const storedAttempt = await Attempt.findById(body.attemptId).lean();
  assert.deepEqual(
    body.questions.map((question) => question.questionId),
    storedAttempt.questionSnapshots.map((snapshot) => snapshot.questionId.toString())
  );
  assert.ok(storedAttempt.questionSnapshots.every((snapshot) => snapshot.correctOptionId));
});

test("bulk and compatibility answer saves enforce ownership and are idempotent", async () => {
  const { exam, questions } = await createExamFixture();
  const { response: startResponse, body: attempt } = await startCanonicalAttempt(exam._id.toString());
  assert.equal(startResponse.status, 201);

  const bulkResponse = await request(`/api/attempts/${attempt.attemptId}/answers`, {
    token: studentToken,
    method: "PUT",
    body: {
      answers: [
        { questionId: questions[0]._id.toString(), selectedOptionId: "A" },
        { questionId: questions[1]._id.toString(), selectedOptionId: "D" },
      ],
    },
  });
  const bulkBody = await bulkResponse.json();
  assert.equal(bulkResponse.status, 200);
  assert.equal(bulkBody.savedCount, 2);
  assert.ok(bulkBody.savedAt);

  const compatibilityResponse = await request(
    `/api/attempts/${attempt.attemptId}/answers/${questions[0]._id}`,
    {
      token: studentToken,
      method: "PUT",
      body: { selectedOptionId: "B" },
    }
  );
  const compatibilityBody = await compatibilityResponse.json();
  assert.equal(compatibilityResponse.status, 200);
  assert.equal(compatibilityBody.answer.selectedOptionId, "B");

  const wrongOwner = await request(
    `/api/attempts/${attempt.attemptId}/answers/${questions[0]._id}`,
    {
      token: otherStudentToken,
      method: "PUT",
      body: { selectedOptionId: "A" },
    }
  );
  assert.equal(wrongOwner.status, 403);

  const storedAttempt = await Attempt.findById(attempt.attemptId).lean();
  assert.equal(storedAttempt.answers.length, 2);
  assert.equal(
    storedAttempt.answers.find((answer) => String(answer.questionId) === String(questions[0]._id))
      .selectedOptionId,
    "B"
  );

  const invalidBatch = await request(`/api/attempts/${attempt.attemptId}/answers`, {
    token: studentToken,
    method: "PUT",
    body: {
      answers: [
        { questionId: questions[0]._id.toString(), selectedOptionId: "A" },
        { questionId: questions[0]._id.toString(), selectedOptionId: "C" },
      ],
    },
  });
  assert.equal(invalidBatch.status, 400);
});

test("submission freezes grading, returns the result, and safely handles concurrent retries", async () => {
  const { exam, questions } = await createExamFixture();
  const { body: attempt } = await startCanonicalAttempt(exam._id.toString());
  const storedAttempt = await Attempt.findById(attempt.attemptId).lean();
  const q1Snapshot = storedAttempt.questionSnapshots.find(
    (snapshot) => String(snapshot.questionId) === String(questions[0]._id)
  );

  const saved = await request(`/api/attempts/${attempt.attemptId}/answers`, {
    token: studentToken,
    method: "PUT",
    body: {
      answers: [
        { questionId: questions[0]._id.toString(), selectedOptionId: q1Snapshot.correctOptionId },
        { questionId: questions[1]._id.toString(), selectedOptionId: "A" },
      ],
    },
  });
  assert.equal(saved.status, 200);

  await Question.updateOne(
    { _id: questions[0]._id },
    { $set: { correctOptionId: "C" } }
  );

  const submitPath = `/api/attempts/${attempt.attemptId}/submit`;
  const responses = await Promise.all([
    request(submitPath, { token: studentToken, method: "POST" }),
    request(submitPath, { token: studentToken, method: "POST" }),
  ]);
  const bodies = await Promise.all(responses.map((response) => response.json()));
  assert.deepEqual(responses.map((response) => response.status), [200, 200]);
  assert.deepEqual(
    bodies.map((body) => [body.attempt.score, body.attempt.maxScore]),
    [[1, 2], [1, 2]]
  );
  assert.ok(bodies.every((body) => body.attempt.status === "submitted"));

  const resultResponse = await request(`/api/attempts/${attempt.attemptId}/result`, {
    token: studentToken,
  });
  const resultBody = await resultResponse.json();
  assert.equal(resultResponse.status, 200);
  assert.equal(resultBody.result.score, 1);
  assert.equal(resultBody.result.maxScore, 2);

  const wrongOwnerResult = await request(`/api/attempts/${attempt.attemptId}/result`, {
    token: otherStudentToken,
  });
  assert.equal(wrongOwnerResult.status, 403);

  const lateSave = await request(
    `/api/attempts/${attempt.attemptId}/answers/${questions[0]._id}`,
    {
      token: studentToken,
      method: "PUT",
      body: { selectedOptionId: "A" },
    }
  );
  assert.equal(lateSave.status, 409);
  assert.equal(await Result.countDocuments({ attemptId: attempt.attemptId }), 1);
  assert.equal(
    await AuditLog.countDocuments({
      actorId: student._id,
      action: "attempt.graded",
      targetId: attempt.attemptId,
    }),
    1
  );
});

test("a save after the deadline is rejected and finalizes and grades the attempt", async () => {
  const { exam, questions } = await createExamFixture();
  const { body: attempt } = await startCanonicalAttempt(exam._id.toString());
  const expiredAt = new Date(Date.now() - 2_000);
  await Attempt.updateOne({ _id: attempt.attemptId }, { $set: { expiresAt: expiredAt } });

  const response = await request(
    `/api/attempts/${attempt.attemptId}/answers/${questions[0]._id}`,
    {
      token: studentToken,
      method: "PUT",
      body: { selectedOptionId: "A" },
    }
  );
  const body = await response.json();
  assert.equal(response.status, 409);
  assert.equal(body.error.code, "ATTEMPT_EXPIRED");

  const finalized = await Attempt.findById(attempt.attemptId).lean();
  const result = await Result.findOne({ attemptId: attempt.attemptId }).lean();
  assert.equal(finalized.status, "submitted");
  assert.equal(finalized.submittedAt.toISOString(), expiredAt.toISOString());
  assert.equal(result.score, 0);
  assert.equal(result.maxScore, 2);
});

test("the background deadline sweep submits and grades disconnected attempts", async () => {
  const { exam } = await createExamFixture();
  const { body: attempt } = await startCanonicalAttempt(exam._id.toString());
  const expiredAt = new Date(Date.now() - 3_000);
  await Attempt.updateOne({ _id: attempt.attemptId }, { $set: { expiresAt: expiredAt } });

  assert.equal(await autoSubmitExpiredAttempts(new Date()), 1);

  const finalized = await Attempt.findById(attempt.attemptId).lean();
  const result = await Result.findOne({ attemptId: attempt.attemptId }).lean();
  assert.equal(finalized.status, "submitted");
  assert.equal(finalized.submittedAt.toISOString(), expiredAt.toISOString());
  assert.equal(result.score, 0);
  assert.equal(result.maxScore, 2);
});
