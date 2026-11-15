import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

function healthDetails() {
  return {
    uptimeSeconds: Math.floor(process.uptime()),
    checkedAt: new Date().toISOString(),
  };
}

// Liveness: the backend process is running.
router.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    ...healthDetails(),
  });
});

// Readiness: the backend can serve requests that need MongoDB.
router.get("/ready", (_req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;

  res.status(mongoReady ? 200 : 503).json({
    status: mongoReady ? "ready" : "not_ready",
    checks: {
      mongodb: mongoReady ? "ok" : "unavailable",
    },
    ...healthDetails(),
  });
});

export default router;