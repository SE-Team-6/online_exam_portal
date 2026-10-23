import mongoose from "mongoose";
import Question from "../models/Questions.js";

function apiError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function validateQuestion(body) {
  const { stem, options, correctOptionId, tags, difficulty } = body ?? {};

  if (typeof stem !== "string" || !stem.trim()) {
    throw apiError(400, "INVALID_QUESTION", "Question stem is required.");
  }

  if (!Array.isArray(options) || options.length !== 4) {
    throw apiError(400, "INVALID_OPTIONS", "A question must have exactly four options.");
  }

  const optionIds = options.map((option) => option?.optionId);

  if (
    options.some(
      (option) =>
        typeof option?.optionId !== "string" ||
        !option.optionId.trim() ||
        typeof option?.text !== "string" ||
        !option.text.trim()
    ) ||
    new Set(optionIds).size !== optionIds.length
  ) {
    throw apiError(400, "INVALID_OPTIONS", "Each option needs a unique ID and non-empty text.");
  }

  if (!optionIds.includes(correctOptionId)) {
    throw apiError(400, "INVALID_ANSWER", "correctOptionId must match one of the option IDs.");
  }

  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) {
    throw apiError(400, "INVALID_TAGS", "Tags must be an array of strings.");
  }

  if (typeof difficulty !== "string" || !difficulty.trim()) {
    throw apiError(400, "INVALID_DIFFICULTY", "Difficulty is required.");
  }

  return {
    stem: stem.trim(),
    options: options.map(({ optionId, text }) => ({
      optionId: optionId.trim(),
      text: text.trim(),
    })),
    correctOptionId,
    tags: tags.map((tag) => tag.trim()).filter(Boolean),
    difficulty: difficulty.trim(),
  };
}

async function findQuestion(questionId) {
  if (!mongoose.isValidObjectId(questionId)) {
    throw apiError(400, "INVALID_QUESTION_ID", "Question ID is invalid.");
  }

  const question = await Question.findById(questionId);

  if (!question) {
    throw apiError(404, "QUESTION_NOT_FOUND", "Question was not found.");
  }

  return question;
}

export function listQuestions() {
  return Question.find().sort({ createdAt: -1 });
}

export async function getQuestion(questionId) {
  return findQuestion(questionId);
}

export async function createQuestion(body) {
  return Question.create(validateQuestion(body));
}

export async function updateQuestion(questionId, body) {
  const question = await findQuestion(questionId);
  question.set(validateQuestion(body));
  await question.save();
  return question;
}

export async function deleteQuestion(questionId) {
  const question = await findQuestion(questionId);
  await question.deleteOne();
}
