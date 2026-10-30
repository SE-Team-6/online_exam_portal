import "dotenv/config";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Question from "../src/models/Questions.js";
import Exam from "../src/models/Exam.js";

const scrypt = promisify(scryptCallback);
const password = process.env.SEED_PASSWORD ?? "Sprint1Pass123!";

async function hashPassword(value) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(value, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}

async function upsertUser(email, name, role) {
  return User.findOneAndUpdate(
    { email },
    {
      $set: { name, role, failedLoginCount: 0, lockedAt: null },
      $setOnInsert: { passwordHash: await hashPassword(password) },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The demo seed script is disabled in production");
  }
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  await mongoose.connect(process.env.MONGODB_URI);

  const admin = await upsertUser("admin@example.com", "Sprint 1 Admin", "admin");
  const instructor = await upsertUser(
    "instructor@example.com",
    "Sprint 1 Instructor",
    "instructor"
  );
  await Promise.all(
    [1, 2, 3].map((number) =>
      upsertUser(`student${number}@example.com`, `Sprint 1 Student ${number}`, "student")
    )
  );

  const questions = [];
  for (let number = 1; number <= 10; number += 1) {
    questions.push(
      await Question.findOneAndUpdate(
        { stem: `Sprint 1 sample question ${number}` },
        {
          stem: `Sprint 1 sample question ${number}`,
          options: [
            { optionId: "a", text: "Option A" },
            { optionId: "b", text: "Option B" },
            { optionId: "c", text: "Option C" },
            { optionId: "d", text: "Option D" },
          ],
          correctOptionId: "a",
          tags: ["sprint1"],
          difficulty: "Easy",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    );
  }

  await Exam.findOneAndUpdate(
    { title: "Sprint 1 Sample Exam" },
    {
      title: "Sprint 1 Sample Exam",
      description: "Seed data for local Sprint 1 demonstrations.",
      questionIds: questions.map((question) => question._id),
      durationSeconds: 30 * 60,
      durationMinutes: 30,
      createdBy: instructor._id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Seeded admin ${admin.email}, instructor ${instructor.email}, and Sprint 1 sample data.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
