export function serializeQuestionForStudent(question) {
  const result =
    typeof question.toObject === "function" ? question.toObject() : { ...question };

  delete result.correctOptionId;
  return result;
}

export function serializeUser(user) {
  const result =
    typeof user.toObject === "function" ? user.toObject() : { ...user };

  delete result.passwordHash;
  return result;
}

