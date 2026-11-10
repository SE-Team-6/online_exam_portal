import { describe, expect, it } from "vitest";
import { parseQuestionCsv } from "./questionCsv";

const headers = "stem,optionA,optionB,optionC,optionD,correctOptionId,tags,difficulty";

describe("parseQuestionCsv", () => {
  it("parses quoted commas, escaped quotes, and semicolon-separated tags", () => {
    const csv = [
      headers,
      '"What is ""2, 2""?","Add, then check","Say ""yes""",No,Skip,b,"math; addition",Easy',
    ].join("\n");

    expect(parseQuestionCsv(csv)).toEqual([
      {
        stem: 'What is "2, 2"?',
        options: [
          { optionId: "a", text: "Add, then check" },
          { optionId: "b", text: 'Say "yes"' },
          { optionId: "c", text: "No" },
          { optionId: "d", text: "Skip" },
        ],
        correctOptionId: "b",
        tags: ["math", "addition"],
        difficulty: "Easy",
      },
    ]);
  });

  it("accepts a UTF-8 BOM and ignores blank rows", () => {
    const csv = `\uFEFF${headers}\nQuestion?,A,B,C,D,a,basics,Easy\n\n`;

    expect(parseQuestionCsv(csv)).toHaveLength(1);
  });

  it("rejects files without all required headers", () => {
    expect(() => parseQuestionCsv("stem,optionA\nQuestion?,A"))
      .toThrow(/headers must include/i);
  });

  it("rejects unclosed quoted fields", () => {
    expect(() => parseQuestionCsv(`${headers}\nQuestion?,"Option A,B,C,D,a,basics,Easy`))
      .toThrow(/unclosed quoted field/i);
  });

  it("identifies a row with missing required question data", () => {
    expect(() => parseQuestionCsv(`${headers}\nQuestion?,A,,C,D,a,basics,Easy`))
      .toThrow(/row 2 is missing required question data/i);
  });
});
