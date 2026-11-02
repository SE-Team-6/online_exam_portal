import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { listAdministrativeResults } from "../services/reporting.service.js";

const router = express.Router();
router.use(requireAuth, requireRole("admin", "instructor"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const report = await listAdministrativeResults({
      examId: req.query.examId,
      limit: req.query.limit,
    });
    res.status(200).json(report);
  })
);

export default router;
