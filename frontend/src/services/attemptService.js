
import { apiRequest } from "./api";

export async function startAttempt(examId) {
  return apiRequest("/attempts", {
    method: "POST",
    body: JSON.stringify({ examId }),
  });
}

export async function saveAttemptAnswer(
  attemptId,
  questionId,
  selectedOptionId
) {
  return apiRequest(
    `/attempts/${attemptId}/answers/${questionId}`,
    {
      method: "PUT",
      body: JSON.stringify({ selectedOptionId }),
    }
  );
}

export async function submitAttempt(attemptId) {
  return apiRequest(`/attempts/${attemptId}/submit`, {
    method: "POST",
  });
}

export async function getAttemptResult(attemptId) {
  return apiRequest(`/attempts/${attemptId}/result`);
}
