import { recordAuditEvent } from "../services/audit.service.js";

function eventFor(req, statusCode) {
  const path = req.originalUrl.split("?")[0];
  const method = req.method.toUpperCase();
  const attemptId = path.match(/^\/api\/attempts\/([a-f\d]{24})/i)?.[1];
  const questionPath = path.match(/^\/api\/admin\/questions(?:\/([a-f\d]{24}))?/i);

  if (path === "/api/auth/login" && statusCode === 423) {
    return { action: "auth.login_locked", targetType: "User" };
  }
  if (questionPath && statusCode < 400) {
    const action = method === "POST" ? "question.created" : method === "PUT" ? "question.updated" : method === "DELETE" ? "question.deleted" : null;
    if (action) return { action, targetType: "Question", targetId: questionPath[1] };
  }
  if (path === "/api/attempts" && method === "POST" && statusCode < 400) {
    return { action: "attempt.started", targetType: "Attempt" };
  }
  if (/^\/api\/exams\/[a-f\d]{24}\/attempts$/i.test(path) && method === "POST" && statusCode < 400) {
    return { action: "attempt.started", targetType: "Attempt" };
  }
  if (attemptId && method === "POST" && path.endsWith("/submit") && statusCode < 400) {
    return { action: "attempt.submitted", targetType: "Attempt", targetId: attemptId };
  }
  if (attemptId && method === "GET" && path.endsWith("/result") && statusCode < 400) {
    return { action: "attempt.result_viewed", targetType: "Attempt", targetId: attemptId };
  }
  return null;
}

export function auditEvents(req, res, next) {
  const sendJson = res.json.bind(res);
  res.json = (payload) => {
    if (payload && typeof payload === "object") {
      req.auditTargetId ??= payload.questionId ?? payload.attemptId ?? payload.exam?.id ?? payload.id;
    }
    return sendJson(payload);
  };

  res.once("finish", () => {
    const event = eventFor(req, res.statusCode);
    if (!event) return;
    recordAuditEvent({
      actorId: req.user?.id ?? req.auditActorId,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId ?? req.auditTargetId,
      requestId: res.locals.requestId,
    }).catch((error) => {
      // Audit failures are surfaced to server logs without recording request bodies or credentials.
      console.error("Could not write audit log", error?.message ?? "unknown error");
    });
  });
  next();
}
