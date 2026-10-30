import mongoose from "mongoose";
import AuditLog from "../models/AuditLog.js";

export async function recordAuditEvent({ actorId, action, targetType, targetId, requestId }) {
  if (actorId && !mongoose.isValidObjectId(actorId)) return;
  return AuditLog.create({
    ...(actorId ? { actorId } : {}),
    action,
    targetType,
    ...(targetId && mongoose.isValidObjectId(targetId) ? { targetId } : {}),
    requestId: requestId || "unknown",
    metadata: {},
  });
}
