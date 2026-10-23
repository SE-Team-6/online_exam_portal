import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      required: true,
      default: "student",
    },
    passwordHash: { type: String, required: true, select: false },
    failedLoginCount: { type: Number, default: 0, min: 0 },
    lockedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);