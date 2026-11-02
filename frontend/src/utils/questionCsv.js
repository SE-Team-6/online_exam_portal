const REQUIRED_HEADERS = [
  "stem",
  "optiona",
  "optionb",
  "optionc",
  "optiond",
  "correctoptionid",
  "tags",
  "difficulty",
];

function parseRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("CSV has an unclosed quoted field.");
  row.push(field.replace(/\r$/, ""));
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

export function parseQuestionCsv(text) {
  const rows = parseRows(String(text).replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("CSV must include a header and at least one question.");

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  if (REQUIRED_HEADERS.some((header) => !headers.includes(header))) {
    throw new Error(
      "CSV headers must include stem, optionA, optionB, optionC, optionD, correctOptionId, tags, and difficulty."
    );
  }

  const positions = Object.fromEntries(
    REQUIRED_HEADERS.map((header) => [header, headers.indexOf(header)])
  );

  return rows.slice(1).map((values, index) => {
    const read = (header) => (values[positions[header]] ?? "").trim();
    const optionIds = ["a", "b", "c", "d"];
    const question = {
      stem: read("stem"),
      options: optionIds.map((optionId) => ({
        optionId,
        text: (values[positions[`option${optionId}`]] ?? "").trim(),
      })),
      correctOptionId: read("correctoptionid").toLowerCase(),
      tags: read("tags")
        .split(";")
        .map((tag) => tag.trim())
        .filter(Boolean),
      difficulty: read("difficulty"),
    };

    if (
      !question.stem ||
      question.options.some((option) => !option.text) ||
      !optionIds.includes(question.correctOptionId) ||
      !question.difficulty
    ) {
      throw new Error(`CSV row ${index + 2} is missing required question data.`);
    }

    return question;
  });
}
