import express from "express";
import healthRouter from "./routes/health.routes.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import adminQuestionRoutes from "./routes/adminQuestion.routes.js";
import authRoutes from "./routes/auth.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import { auditEvents } from "./middleware/auditEvents.js";
const app = express();

app.disable("x-powered-by");
app.use(requestIdMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(auditEvents);
app.use("/api/health", healthRouter);
app.use("/api/auth", authRoutes);
app.use("/api/admin/questions", adminQuestionRoutes);
app.use("/api/admin/audit-logs", auditRoutes);


app.use(notFoundHandler);
app.use(errorHandler);

export default app;
