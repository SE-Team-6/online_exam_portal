import express from "express";
import healthRouter from "./routes/health.routes.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { corsMiddleware } from "./middleware/cors.js";
import adminQuestionRoutes from "./routes/adminQuestion.routes.js";
import authRoutes from "./routes/auth.routes.js";
import attemptRoutes from "./routes/attempt.routes.js";
import adminExamRoutes from "./routes/adminExam.routes.js";
import examRoutes from "./routes/exam.routes.js";
const app = express();

app.disable("x-powered-by");
app.use(requestIdMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use("/api/health", healthRouter);
app.use("/api/auth", authRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/admin/questions", adminQuestionRoutes);
app.use("/api/admin/exams", adminExamRoutes);
app.use("/api/student/exams", examRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
