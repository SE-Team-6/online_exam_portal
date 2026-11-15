import mongoose from "mongoose";

const examOptionSchema = new mongoose.Schema(
  {
    optionId: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const examQuestionSnapshotSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    questionVersion: { type: Number, required: true, min: 1 },
    stem: { type: String, required: true },
    options: { type: [examOptionSchema], required: true },
    correctOptionId: { type: String, required: true },
    tags: { type: [String], default: [] },
    difficulty: { type: String, required: true },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    questionSnapshots: {
      type: [examQuestionSnapshotSchema],
      default: [],
    },
    durationSeconds: { type: Number, required: true, min: 1 },
    startsAt: { type: Date },
    endsAt: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);