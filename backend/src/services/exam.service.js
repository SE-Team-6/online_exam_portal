import mongoose from "mongoose";
import Exam from "../models/Exam.js";
import Question from "../models/Questions.js";

function apiError(statusCode, code, message) {
  return Object.assign(new Error(message), { statusCode, code });
}

function validateExam(body) {
  const { title, questionIds, durationSeconds, startsAt, endsAt } = body ?? {};
  if (typeof title !== "string" || !title.trim()) throw apiError(400, "INVALID_EXAM", "Exam title is required.");
  if (!Array.isArray(questionIds) || questionIds.length === 0 || questionIds.some((id) => !mongoose.isValidObjectId(id))) {
    throw apiError(400, "INVALID_QUESTION_IDS", "At least one valid question ID is required.");
  }
  const ids = questionIds.map(String);
  if (new Set(ids).size !== ids.length) throw apiError(400, "INVALID_QUESTION_IDS", "Question IDs must be unique.");
  if (!Number.isSafeInteger(durationSeconds) || durationSeconds < 1) throw apiError(400, "INVALID_DURATION", "durationSeconds must be a positive integer.");
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (!startsAt || Number.isNaN(start.getTime()) || !endsAt || Number.isNaN(end.getTime()) || start >= end) {
    throw apiError(400, "INVALID_SCHEDULE", "Valid startsAt and endsAt are required, and endsAt must be later.");
  }
  return { title: title.trim(), questionIds: ids, durationSeconds, startsAt: start, endsAt: end };
}

export async function createExam(body, actorId) {
  const input = validateExam(body);
  const found = await Question.countDocuments({ _id: { $in: input.questionIds } });
  if (found !== input.questionIds.length) throw apiError(400, "UNKNOWN_QUESTION", "One or more selected questions do not exist.");
  return Exam.create({ ...input, createdBy: actorId });
}

export function listExams() {
  return Exam.find().select("title questionIds durationSeconds startsAt endsAt createdBy createdAt updatedAt").sort({ startsAt: 1 });
}
