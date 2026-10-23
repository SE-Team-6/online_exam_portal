import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    optionId: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    stem: { type: String, required: true, trim: true },
    options: {
      type: [optionSchema],
      required: true,
      validate: {
        validator: (options) => options.length === 4,
        message: "A question must have exactly four options.",
      },
    },
    correctOptionId: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    difficulty: { type: String, required: true, trim: true },
    version: { type: Number, required: true, default: 1, min: 1 },
  },
  { timestamps: true }
);

questionSchema.pre("validate", function () {
  const correctOptionExists = this.options.some(
    (option) => option.optionId === this.correctOptionId
  );

  if (!correctOptionExists) {
    this.invalidate("correctOptionId", "It must match one of the option IDs.");
  }
});

export default mongoose.model("Question", questionSchema);