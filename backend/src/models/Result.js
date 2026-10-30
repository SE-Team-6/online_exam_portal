import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: true,
      unique: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 0 },
    totalQuestions: { type: Number, required: true, min: 0 },
    submittedAt: { type: Date, required: true },
    evaluatedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Result", resultSchema);
