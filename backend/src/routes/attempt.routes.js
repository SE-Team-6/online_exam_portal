import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { getAttemptResult } from "../services/grading.service.js";
import { startAttempt } from "../services/attempt.service.js";

const router = express.Router();
router.use(requireAuth, requireRole("student"));

router.get("/:attemptId/result", asyncHandler(async (req, res) => {
  const result = await getAttemptResult(req.params.attemptId, req.user.id, res.locals.requestId);
  res.status(200).json({ result: {
    attemptId: result.attemptId.toString(),
    examId: result.examId.toString(),
    score: result.score,
    maxScore: result.maxScore,
    submittedAt: result.submittedAt,
  } });
}));

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const attempt = await startAttempt({
      examId: req.body?.examId,
      studentId: req.user.id,
    });

    res.status(201).json({ attempt });
  })
);

export default router;
