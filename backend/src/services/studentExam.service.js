import Exam from "../models/Exam.js";

export async function listAvailableExams(now = new Date()) {
  const exams = await Exam.find({
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  })
    .select("title description durationSeconds durationMinutes startsAt endsAt")
    .sort({ startsAt: 1, title: 1 })
    .lean();

  return exams.map((exam) => ({
    examId: exam._id.toString(),
    title: exam.title,
    description: exam.description,
    durationSeconds: exam.durationSeconds ?? exam.durationMinutes * 60,
    startsAt: exam.startsAt,
    endsAt: exam.endsAt,
  }));
}
