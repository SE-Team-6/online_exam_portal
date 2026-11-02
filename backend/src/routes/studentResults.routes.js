import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { listStudentResults } from "../services/reporting.service.js";

const router = express.Router();
router.use(requireAuth, requireRole("student"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const results = await listStudentResults(req.user.id);
    res.status(200).json({ results });
  })
);

export default router;
