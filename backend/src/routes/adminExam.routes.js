import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import AuditLog from "../models/AuditLog.js";
import {
  createExam,
  listExamsWithAttemptCounts,
} from "../services/exam.service.js";

const router = express.Router();
router.use(requireAuth, requireRole("instructor", "admin"));

router.get("/", asyncHandler(async (_req, res) => {
  res.status(200).json({
    exams: await listExamsWithAttemptCounts(),
  });
}));

router.post("/", asyncHandler(async (req, res) => {
  const exam = await createExam(req.body, req.user.id);
  await AuditLog.create({
    actorId: req.user.id,
    action: "exam.scheduled",
    targetType: "Exam",
    targetId: exam._id,
    requestId: res.locals.requestId,
    metadata: { questionCount: exam.questionIds.length, startsAt: exam.startsAt, endsAt: exam.endsAt },
  });
  res.status(201).json({ exam: {
    id: exam._id.toString(),
    title: exam.title,
    questionIds: exam.questionIds.map(String),
    durationSeconds: exam.durationSeconds,
    startsAt: exam.startsAt,
    endsAt: exam.endsAt,
  } });
}));

export default router;
