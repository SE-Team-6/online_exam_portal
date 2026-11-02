import { randomInt } from "node:crypto";
import mongoose from "mongoose";
import Attempt from "../models/Attempt.js";
import Exam from "../models/Exam.js";
import Question from "../models/Questions.js";
import { gradeSubmittedAttempt } from "./grading.service.js";

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

function submissionResponse(attempt, result) {
  return {
    attemptId: attempt._id.toString(),
    examId: attempt.examId.toString(),
    status: attempt.status,
    submittedAt: attempt.submittedAt,
    score: result.score,
    maxScore: result.maxScore,
  };
}

async function finalizeExpiredAttempt(attempt, now, requestId = "unknown") {
  if (
    !attempt ||
    attempt.status !== "in_progress" ||
    new Date(attempt.expiresAt) > now
  ) {
    return attempt;
  }

  const finalizedAttempt = await Attempt.findOneAndUpdate(
    {
      _id: attempt._id,
      status: "in_progress",
      expiresAt: { $lte: now },
      submittedAt: null,
    },
    {
      $set: {
        status: "submitted",
        submittedAt: attempt.expiresAt,
      },
    },
    { returnDocument: "after", runValidators: true }
  );

  if (finalizedAttempt) {
    await gradeSubmittedAttempt(finalizedAttempt, { requestId });
    return finalizedAttempt;
  }

  const latestAttempt = await Attempt.findById(attempt._id);
  if (latestAttempt?.status === "submitted") {
    await gradeSubmittedAttempt(latestAttempt, { requestId });
  }
  return latestAttempt;
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
  const durationDeadline = new Date(
    startedAt.getTime() + durationSeconds * 1000
  );
  const examDeadline = exam.endsAt ? new Date(exam.endsAt) : null;
  const expiresAt = examDeadline && examDeadline < durationDeadline
    ? examDeadline
    : durationDeadline;

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

export async function saveAttemptAnswer({
  attemptId,
  questionId,
  selectedOptionId,
  studentId,
}) {
  if (
    !mongoose.isValidObjectId(attemptId) ||
    !mongoose.isValidObjectId(questionId)
  ) {
    throw apiError(400, "INVALID_ID", "Attempt ID or question ID is invalid.");
  }

  if (
    typeof selectedOptionId !== "string" ||
    !selectedOptionId.trim()
  ) {
    throw apiError(
      400,
      "INVALID_OPTION",
      "A selected option ID is required."
    );
  }

  const optionId = selectedOptionId.trim();

  const attempt = await Attempt.findById(attemptId).select(
    "studentId status expiresAt questionSnapshots"
  );

  if (!attempt) {
    throw apiError(404, "ATTEMPT_NOT_FOUND", "Attempt was not found.");
  }

  if (String(attempt.studentId) !== String(studentId)) {
    throw apiError(403, "FORBIDDEN", "You cannot update another student's attempt.");
  }

  const questionIsInAttempt = attempt.questionSnapshots.some(
    (snapshot) => String(snapshot.questionId) === String(questionId)
  );

  if (!questionIsInAttempt) {
    throw apiError(
      400,
      "QUESTION_NOT_IN_ATTEMPT",
      "This question is not part of the attempt."
    );
  }

  if (attempt.status !== "in_progress") {
    throw apiError(409, "ATTEMPT_NOT_ACTIVE", "This attempt is not active.");
  }

  if (new Date(attempt.expiresAt) <= new Date()) {
    await finalizeExpiredAttempt(attempt, new Date());
    throw apiError(409, "ATTEMPT_EXPIRED", "The exam deadline has passed.");
  }

  const question = await Question.findById(questionId)
    .select("options.optionId")
    .lean();

  if (!question) {
    throw apiError(404, "QUESTION_NOT_FOUND", "Question was not found.");
  }

  const optionIsValid = question.options.some(
    (option) => option.optionId === optionId
  );

  if (!optionIsValid) {
    throw apiError(
      400,
      "INVALID_OPTION",
      "The selected option does not belong to this question."
    );
  }

  // Use the server clock and include the deadline in each atomic update.
  const now = new Date();
  const activeAttemptFilter = {
    _id: attempt._id,
    studentId,
    status: "in_progress",
    expiresAt: { $gt: now },
    "questionSnapshots.questionId": question._id,
  };

  // If this question already has an answer, replace its selection.
  let updatedAttempt = await Attempt.findOneAndUpdate(
    {
      ...activeAttemptFilter,
      "answers.questionId": question._id,
    },
    {
      $set: { "answers.$[answer].selectedOptionId": optionId },
    },
    {
      returnDocument: "after",
      runValidators: true,
      arrayFilters: [{ "answer.questionId": question._id }],
    }
  );

  // Otherwise add one answer. The filter prevents concurrent retries from
  // adding duplicate entries for the same question.
  if (!updatedAttempt) {
    updatedAttempt = await Attempt.findOneAndUpdate(
      {
        ...activeAttemptFilter,
        answers: {
          $not: {
            $elemMatch: { questionId: question._id },
          },
        },
      },
      {
        $push: {
          answers: {
            questionId: question._id,
            selectedOptionId: optionId,
          },
        },
      },
      { returnDocument: "after", runValidators: true }
    );
  }

  // A concurrent save may have inserted the answer first; update that entry.
  if (!updatedAttempt) {
    updatedAttempt = await Attempt.findOneAndUpdate(
      {
        ...activeAttemptFilter,
        "answers.questionId": question._id,
      },
      {
        $set: { "answers.$[answer].selectedOptionId": optionId },
      },
      {
        returnDocument: "after",
        runValidators: true,
        arrayFilters: [{ "answer.questionId": question._id }],
      }
    );
  }

  if (!updatedAttempt) {
    const latestAttempt = await Attempt.findById(attempt._id).select(
      "status expiresAt"
    );
    if (
      latestAttempt?.status === "in_progress" &&
      new Date(latestAttempt.expiresAt) <= new Date()
    ) {
      await finalizeExpiredAttempt(latestAttempt, new Date());
      throw apiError(409, "ATTEMPT_EXPIRED", "The exam deadline has passed.");
    }
    throw apiError(
      409,
      "ATTEMPT_NOT_ACTIVE",
      "The attempt was submitted or its timer expired."
    );
  }

  return {
    attemptId: updatedAttempt._id.toString(),
    questionId: question._id.toString(),
    selectedOptionId: optionId,
    savedAt: updatedAttempt.updatedAt,
  };
}

export async function saveAttemptAnswers({ attemptId, answers, studentId }) {
  if (!Array.isArray(answers) || answers.length === 0) {
    throw apiError(400, "INVALID_ANSWERS", "At least one answer is required.");
  }

  const seenQuestionIds = new Set();
  for (const answer of answers) {
    if (!answer || typeof answer !== "object") {
      throw apiError(400, "INVALID_ANSWERS", "Each answer must be an object.");
    }
    if (!mongoose.isValidObjectId(answer.questionId)) {
      throw apiError(400, "INVALID_ID", "Each answer must include a valid questionId.");
    }
    if (seenQuestionIds.has(String(answer.questionId))) {
      throw apiError(400, "INVALID_ANSWERS", "Question IDs must be unique in a save request.");
    }
    seenQuestionIds.add(String(answer.questionId));
    if (typeof answer.selectedOptionId !== "string" || !answer.selectedOptionId.trim()) {
      throw apiError(400, "INVALID_OPTION", "Each answer must include a selectedOptionId.");
    }
  }

  const savedAnswers = [];
  for (const answer of answers) {
    savedAnswers.push(await saveAttemptAnswer({
      attemptId,
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId,
      studentId,
    }));
  }

  return {
    attemptId: String(attemptId),
    savedAt: savedAnswers[savedAnswers.length - 1].savedAt,
    savedCount: savedAnswers.length,
  };
}

export async function submitAttempt({ attemptId, studentId, requestId = "unknown" }) {
  if (!mongoose.isValidObjectId(attemptId)) {
    throw apiError(400, "INVALID_ATTEMPT_ID", "Attempt ID is invalid.");
  }

  const attempt = await Attempt.findById(attemptId);

  if (!attempt) {
    throw apiError(404, "ATTEMPT_NOT_FOUND", "Attempt was not found.");
  }

  if (String(attempt.studentId) !== String(studentId)) {
    throw apiError(
      403,
      "FORBIDDEN",
      "You cannot submit another student's attempt."
    );
  }

  // Make a repeated submit request safe: return the existing submission.
  if (attempt.status === "submitted") {
    const result = await gradeSubmittedAttempt(attempt, { requestId });
    return submissionResponse(attempt, result);
  }

  if (attempt.status !== "in_progress") {
    throw apiError(409, "ATTEMPT_NOT_ACTIVE", "This attempt is not active.");
  }

  const now = new Date();
  const expiresAt = new Date(attempt.expiresAt);

  // A late submit is recorded at the server-side deadline.
  const isExpired = now >= expiresAt;
  const submittedAt = isExpired ? expiresAt : now;

  const updatedAttempt = await Attempt.findOneAndUpdate(
    {
      _id: attempt._id,
      studentId,
      status: "in_progress",
      submittedAt: null,
      expiresAt: isExpired ? { $lte: now } : { $gt: now },
    },
    {
      $set: {
        status: "submitted",
        submittedAt,
      },
    },
    { returnDocument: "after", runValidators: true }
  );

  if (updatedAttempt) {
    const result = await gradeSubmittedAttempt(updatedAttempt, { requestId });
    return submissionResponse(updatedAttempt, result);
  }

  // Another request or the expiry worker may have submitted it concurrently.
  const latestAttempt = await Attempt.findById(attemptId);

  if (!latestAttempt) {
    throw apiError(404, "ATTEMPT_NOT_FOUND", "Attempt was not found.");
  }

  if (String(latestAttempt.studentId) !== String(studentId)) {
    throw apiError(
      403,
      "FORBIDDEN",
      "You cannot submit another student's attempt."
    );
  }

  if (latestAttempt.status === "submitted") {
    const result = await gradeSubmittedAttempt(latestAttempt, { requestId });
    return submissionResponse(latestAttempt, result);
  }

  if (
    latestAttempt.status === "in_progress" &&
    new Date(latestAttempt.expiresAt) <= new Date()
  ) {
    const finalizedAttempt = await finalizeExpiredAttempt(latestAttempt, new Date(), requestId);
    if (finalizedAttempt?.status === "submitted") {
      const result = await gradeSubmittedAttempt(finalizedAttempt, { requestId });
      return submissionResponse(finalizedAttempt, result);
    }
  }

  throw apiError(409, "ATTEMPT_NOT_ACTIVE", "This attempt is not active.");
}

export async function autoSubmitExpiredAttempts(now = new Date()) {
  const expiredAttempts = await Attempt.find({
    status: "in_progress",
    expiresAt: { $lte: now },
    submittedAt: null,
  })
    .select("_id expiresAt")
    .limit(100)
    .lean();

  let submittedCount = 0;

  for (const attempt of expiredAttempts) {
    const finalizedAttempt = await Attempt.findOneAndUpdate(
      {
        _id: attempt._id,
        status: "in_progress",
        expiresAt: { $lte: now },
        submittedAt: null,
      },
      {
        $set: {
          status: "submitted",
          submittedAt: attempt.expiresAt,
        },
      },
      { returnDocument: "after", runValidators: true }
    );

    if (finalizedAttempt) {
      await gradeSubmittedAttempt(finalizedAttempt);
      submittedCount += 1;
    }
  }

  return submittedCount;
}
