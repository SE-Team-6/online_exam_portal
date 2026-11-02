import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { startAttempt } from "../services/attempt.service.js";

const router = express.Router({ mergeParams: true });

router.use(requireAuth, requireRole("student"));

// SAD contract: POST /api/exams/:examId/attempts
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const attempt = await startAttempt({
      examId: req.params.examId,
      studentId: req.user.id,
    });

    res.status(201).json(attempt);
  })
);

export default router;
