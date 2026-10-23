import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  createQuestion,
  deleteQuestion,
  getQuestion,
  listQuestions,
  updateQuestion,
} from "../services/question.service.js";

// Change this import to the actual path/export from Arvind's #2 auth middleware.
import {requireAuth} from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

// #7 requires a valid login. #6 will add the instructor/admin role restriction.
router.use(requireAuth);
router.use(requireRole("instructor", "admin"));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.status(200).json({ questions: await listQuestions() });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const question = await createQuestion(req.body);
    res.status(201).json({
      questionId: question._id.toString(),
      version: question.version,
    });
  })
);

router.get(
  "/:questionId",
  asyncHandler(async (req, res) => {
    const question = await getQuestion(req.params.questionId);
    res.status(200).json({ question });
  })
);

router.put(
  "/:questionId",
  asyncHandler(async (req, res) => {
    const question = await updateQuestion(req.params.questionId, req.body);
    res.status(200).json({
      questionId: question._id.toString(),
      version: question.version,
    });
  })
);

router.delete(
  "/:questionId",
  asyncHandler(async (req, res) => {
    await deleteQuestion(req.params.questionId);
    res.status(204).end();
  })
);

export default router;
