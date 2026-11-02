import express from "express";
import AuditLog from "../models/AuditLog.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();
router.use(requireAuth, requireRole("admin"));

router.get("/", asyncHandler(async (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
  const query = {};
  if (typeof req.query.action === "string" && req.query.action.length <= 80) query.action = req.query.action;
  if (typeof req.query.targetType === "string" && req.query.targetType.length <= 80) query.targetType = req.query.targetType;
  if (typeof req.query.actorId === "string" && /^[a-f\d]{24}$/i.test(req.query.actorId)) query.actorId = req.query.actorId;

  const entries = await AuditLog.find(query)
    .select("actorId action targetType targetId requestId createdAt")
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();
  res.status(200).json({ entries });
}));

export default router;
