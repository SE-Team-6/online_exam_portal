import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    durationMinutes: { type: Number, required: true, min: 1 },
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
