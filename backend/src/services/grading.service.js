import mongoose from "mongoose";
import Attempt from "../models/Attempt.js";
import Exam from "../models/Exam.js";
import Question from "../models/Questions.js";
import Result from "../models/Result.js";
import AuditLog from "../models/AuditLog.js";

function apiError(statusCode, code, message) {
  return Object.assign(new Error(message), { statusCode, code });
}

export async function freezeAttemptAnswerKey(attemptId) {
  if (!mongoose.isValidObjectId(attemptId)) throw apiError(400, "INVALID_ATTEMPT_ID", "Attempt ID is invalid.");
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) throw apiError(404, "ATTEMPT_NOT_FOUND", "Attempt was not found.");
  if (attempt.questionSnapshots.length) return attempt;

  const exam = await Exam.findById(attempt.examId).select("questionIds");
  if (!exam || !exam.questionIds.length) throw apiError(409, "EXAM_QUESTIONS_MISSING", "The exam has no questions to snapshot.");
  const questions = await Question.find({ _id: { $in: exam.questionIds } }).select("_id correctOptionId");
  if (questions.length !== exam.questionIds.length) throw apiError(409, "EXAM_QUESTIONS_MISSING", "One or more exam questions are unavailable.");
  const byId = new Map(questions.map((question) => [String(question._id), question.correctOptionId]));
  attempt.questionSnapshots = exam.questionIds.map((questionId) => ({
    questionId,
    correctOptionId: byId.get(String(questionId)),
  }));
  await attempt.save();
  return attempt;
}

export async function gradeSubmittedAttempt(attempt, { requestId = "unknown" } = {}) {
  if (!attempt.submittedAt || attempt.status !== "submitted") {
    throw apiError(409, "ATTEMPT_NOT_SUBMITTED", "Only submitted attempts can be graded.");
  }
  if (!attempt.questionSnapshots?.length) {
    throw apiError(409, "ANSWER_SNAPSHOT_MISSING", "The attempt has no frozen answer key snapshot.");
  }
  const savedResult = await Result.findOne({ attemptId: attempt._id });
  if (savedResult) return savedResult;

  const selectedByQuestion = new Map(attempt.answers.map((answer) => [String(answer.questionId), answer.selectedOptionId]));
  const score = attempt.questionSnapshots.reduce((total, snapshot) =>
    total + (selectedByQuestion.get(String(snapshot.questionId)) === snapshot.correctOptionId ? 1 : 0), 0);
  const maxScore = attempt.questionSnapshots.length;

  const result = await Result.findOneAndUpdate(
    { attemptId: attempt._id },
    {
      $set: {
        examId: attempt.examId,
        studentId: attempt.studentId,
        score,
        maxScore,
        totalQuestions: maxScore,
        submittedAt: attempt.submittedAt,
      },
      $setOnInsert: { attemptId: attempt._id },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  await AuditLog.create({
    actorId: attempt.studentId,
    action: "attempt.graded",
    targetType: "Attempt",
    targetId: attempt._id,
    requestId,
    metadata: { score, maxScore },
  });

  return result;
}

export async function getAttemptResult(attemptId, studentId, requestId) {
  if (!mongoose.isValidObjectId(attemptId)) throw apiError(400, "INVALID_ATTEMPT_ID", "Attempt ID is invalid.");
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) throw apiError(404, "ATTEMPT_NOT_FOUND", "Attempt was not found.");
  if (String(attempt.studentId) !== String(studentId)) throw apiError(403, "FORBIDDEN", "You cannot view another student's result.");
  return gradeSubmittedAttempt(attempt, { requestId });
}
