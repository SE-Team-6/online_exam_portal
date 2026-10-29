import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { listAvailableExams } from "../services/exam.service.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("student"));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const exams = await listAvailableExams();
    res.status(200).json({ exams });
  })
);

export default router;