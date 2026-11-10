import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Results from "./Results";
import { apiRequest } from "../services/api";

vi.mock("../services/api", () => ({ apiRequest: vi.fn() }));

function renderResults() {
  return render(
    <MemoryRouter>
      <Results />
    </MemoryRouter>
  );
}

afterEach(() => cleanup());

describe("Results page", () => {
  it("shows a student's score and correctly formats percentile ordinals", async () => {
    apiRequest.mockResolvedValue({
      results: [
        {
          resultId: "result-1",
          examTitle: "Algebra Basics",
          submittedAt: "2026-11-01T10:00:00.000Z",
          score: 8,
          maxScore: 10,
          percentage: 80,
          percentile: 21,
        },
      ],
    });

    renderResults();

    expect(await screen.findByRole("heading", { name: "Completed attempts (1)" }))
      .toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Algebra Basics" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "8 / 10" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "80.0%" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "21st" })).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith("/student/results");
  });

  it("shows an empty state when no results have been submitted", async () => {
    apiRequest.mockResolvedValue({ results: [] });

    renderResults();

    expect(await screen.findByRole("heading", { name: "No results yet" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse available exams" }))
      .toHaveAttribute("href", "/student");
  });

  it("shows a useful error when results cannot be loaded", async () => {
    apiRequest.mockRejectedValue(new Error("Session expired"));

    renderResults();

    expect(await screen.findByRole("alert")).toHaveTextContent("Session expired");
  });
});
