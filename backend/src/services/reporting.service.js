import mongoose from "mongoose";
import Result from "../models/Result.js";

function percentage(score, maxScore) {
  return maxScore > 0 ? (score / maxScore) * 100 : 0;
}

function percentileFor(result, cohort) {
  if (!cohort.length) return 0;
  const resultPercentage = percentage(result.score, result.maxScore);
  const atOrBelow = cohort.filter(
    (item) => percentage(item.score, item.maxScore) <= resultPercentage
  ).length;
  return Math.round((atOrBelow / cohort.length) * 100);
}

async function loadCohorts(examIds) {
  if (examIds.length === 0) return new Map();

  const rows = await Result.find({ examId: { $in: examIds } })
    .select("examId score maxScore")
    .lean();
  const cohorts = new Map();

  for (const row of rows) {
    const examId = String(row.examId);
    if (!cohorts.has(examId)) cohorts.set(examId, []);
    cohorts.get(examId).push(row);
  }

  return cohorts;
}

function serializeResult(row, cohorts, includeStudent = false) {
  const examId = String(row.examId?._id ?? row.examId);
  const cohort = cohorts.get(examId) ?? [];
  const serialized = {
    resultId: String(row._id),
    attemptId: String(row.attemptId),
    examId,
    examTitle: row.examId?.title ?? "Exam",
    score: row.score,
    maxScore: row.maxScore,
    percentage: Number(percentage(row.score, row.maxScore).toFixed(1)),
    percentile: percentileFor(row, cohort),
    submittedAt: row.submittedAt,
  };

  if (includeStudent) {
    serialized.studentId = String(row.studentId?._id ?? row.studentId);
    serialized.studentName = row.studentId?.name ?? "Student";
    serialized.studentEmail = row.studentId?.email ?? "";
  }

  return serialized;
}

export async function listStudentResults(studentId) {
  const rows = await Result.find({ studentId })
    .populate("examId", "title")
    .sort({ submittedAt: -1, _id: -1 })
    .lean();
  const examIds = [...new Set(rows.map((row) => String(row.examId?._id ?? row.examId)))];
  const cohorts = await loadCohorts(examIds);

  return rows.map((row) => serializeResult(row, cohorts));
}

export async function listAdministrativeResults({ examId, limit = 500 } = {}) {
  const filter = {};
  if (examId !== undefined) {
    if (!mongoose.isValidObjectId(examId)) {
      throw Object.assign(new Error("Exam ID is invalid."), {
        statusCode: 400,
        code: "INVALID_EXAM_ID",
      });
    }
    filter.examId = examId;
  }

  const boundedLimit = Math.min(Math.max(Number(limit) || 500, 1), 500);
  const [rows, total] = await Promise.all([
    Result.find(filter)
      .populate("examId", "title")
      .populate("studentId", "name email")
      .sort({ submittedAt: -1, _id: -1 })
      .limit(boundedLimit)
      .lean(),
    Result.countDocuments(filter),
  ]);
  const examIds = [...new Set(rows.map((row) => String(row.examId?._id ?? row.examId)))];
  const cohorts = await loadCohorts(examIds);
  const results = rows.map((row) => serializeResult(row, cohorts, true));
  const percentages = results.map((row) => row.percentage);
  const analytics = {
    resultCount: total,
    averagePercentage: percentages.length
      ? Number((percentages.reduce((sum, value) => sum + value, 0) / percentages.length).toFixed(1))
      : 0,
    highestPercentage: percentages.length ? Math.max(...percentages) : 0,
    lowestPercentage: percentages.length ? Math.min(...percentages) : 0,
  };

  return { results, analytics, limit: boundedLimit };
}
