import { randomInt } from "node:crypto";
import mongoose from "mongoose";
import Attempt from "../models/Attempt.js";
import Exam from "../models/Exam.js";
import Question from "../models/Questions.js";

function apiError(statusCode, code, message) {
  return Object.assign(new Error(message), { statusCode, code });
}

function shuffle(items) {
  const shuffled = [...items];

  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export async function startAttempt({ examId, studentId }) {
  if (!mongoose.isValidObjectId(examId)) {
    throw apiError(400, "INVALID_EXAM_ID", "Exam ID is invalid.");
  }

  const startedAt = new Date();

  const exam = await Exam.findById(examId)
    .select("questionIds durationSeconds startsAt endsAt")
    .lean();

  if (!exam) {
    throw apiError(404, "EXAM_NOT_FOUND", "Exam was not found.");
  }

  if (exam.startsAt && new Date(exam.startsAt) > startedAt) {
    throw apiError(409, "EXAM_NOT_STARTED", "This exam is not available yet.");
  }

  if (exam.endsAt && new Date(exam.endsAt) < startedAt) {
    throw apiError(409, "EXAM_CLOSED", "This exam is no longer available.");
  }

  const questionIds = [
    ...new Map(exam.questionIds.map((id) => [String(id), id])).values(),
  ];

  if (questionIds.length === 0) {
    throw apiError(409, "EXAM_HAS_NO_QUESTIONS", "This exam has no questions.");
  }

  const questions = await Question.find({ _id: { $in: questionIds } })
    .select("_id stem options correctOptionId")
    .lean();

  const questionsById = new Map(
    questions.map((question) => [String(question._id), question])
  );

  const examQuestions = questionIds
    .map((id) => questionsById.get(String(id)))
    .filter(Boolean);

  if (examQuestions.length !== questionIds.length) {
    throw apiError(
      409,
      "EXAM_QUESTIONS_MISSING",
      "One or more exam questions are unavailable."
    );
  }

  const durationSeconds = Number(exam.durationSeconds);

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw apiError(
      409,
      "INVALID_EXAM_DURATION",
      "The exam does not have a valid duration."
    );
  }

  const randomizedQuestions = shuffle(examQuestions);
  const expiresAt = new Date(
    startedAt.getTime() + durationSeconds * 1000
  );

  const attempt = await Attempt.create({
    examId: exam._id,
    studentId,
    startedAt,
    expiresAt,
    status: "in_progress",

    // Saved in this order so later answer saving and grading use this attempt's
    // exact questions and frozen answer key.
    questionSnapshots: randomizedQuestions.map((question) => ({
      questionId: question._id,
      correctOptionId: question.correctOptionId,
    })),
  });

  return {
    attemptId: attempt._id.toString(),
    examId: exam._id.toString(),
    status: attempt.status,
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    durationSeconds,
    questions: randomizedQuestions.map((question) => ({
      questionId: question._id.toString(),
      stem: question.stem,
      options: question.options.map(({ optionId, text }) => ({
        optionId,
        text,
      })),
    })),
  };
}
