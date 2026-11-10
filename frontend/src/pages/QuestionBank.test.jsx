import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionBank from "./QuestionBank";
import { apiRequest } from "../services/api";

vi.mock("../services/api", () => ({ apiRequest: vi.fn() }));

afterEach(() => cleanup());

describe("QuestionBank CSV import", () => {
  it("sends parsed questions to the import API and reports success", async () => {
    let imported = false;
    apiRequest.mockImplementation(async (endpoint) => {
      if (endpoint === "/admin/questions/import") {
        imported = true;
        return { importedCount: 1 };
      }
      return {
        questions: imported
          ? [{
            _id: "question-1",
            stem: "What is 2 + 2?",
            options: [
              { optionId: "a", text: "4" },
              { optionId: "b", text: "3" },
              { optionId: "c", text: "5" },
              { optionId: "d", text: "6" },
            ],
            tags: ["math"],
            difficulty: "Easy",
          }]
          : [],
      };
    });
    const user = userEvent.setup();
    const csv = [
      "stem,optionA,optionB,optionC,optionD,correctOptionId,tags,difficulty",
      '"What is 2 + 2?",4,3,5,6,a,math,Easy',
    ].join("\n");
    const file = new File([csv], "questions.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: async () => csv });

    render(<QuestionBank />);
    await user.upload(screen.getByLabelText("CSV file"), file);

    expect(await screen.findByText("1 questions imported successfully."))
      .toBeInTheDocument();
    const importCall = apiRequest.mock.calls.find(([endpoint]) => endpoint === "/admin/questions/import");
    expect(importCall[1].method).toBe("POST");
    expect(JSON.parse(importCall[1].body)).toEqual({
      questions: [
        {
          stem: "What is 2 + 2?",
          options: [
            { optionId: "a", text: "4" },
            { optionId: "b", text: "3" },
            { optionId: "c", text: "5" },
            { optionId: "d", text: "6" },
          ],
          correctOptionId: "a",
          tags: ["math"],
          difficulty: "Easy",
        },
      ],
    });
    expect(screen.getByRole("heading", { name: "What is 2 + 2?" })).toBeInTheDocument();
  });
});
