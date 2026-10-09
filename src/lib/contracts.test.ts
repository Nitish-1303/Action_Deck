import { describe, expect, it } from "vitest";
import {
  InvalidModelResponseError,
  parseTasksResponse,
  parseVerifierResponse,
} from "./contracts";

describe("parseTasksResponse", () => {
  it("marks unstated owners and deadlines missing rather than filling them in", () => {
    const [task] = parseTasksResponse(
      JSON.stringify({
        tasks: [
          {
            task: "Review the draft",
            owner: null,
            deadline: "",
            source_quote: "We should review the draft.",
          },
        ],
      }),
    );
    expect(task.owner).toEqual({ value: null, status: "missing" });
    expect(task.deadline).toEqual({ value: null, status: "missing" });
  });

  it("retains explicitly stated owner and deadline", () => {
    const [task] = parseTasksResponse(
      JSON.stringify({
        tasks: [
          {
            task: "Send the draft",
            owner: "Maya",
            deadline: "Friday, October 9, 2026",
            source_quote: "Maya: I'll send the draft by Friday.",
          },
        ],
      }),
    );
    expect(task.owner).toEqual({ value: "Maya", status: "stated" });
    expect(task.deadline).toEqual({
      value: "Friday, October 9, 2026",
      status: "stated",
    });
  });

  it("rejects invalid task shapes for the one-time repair flow", () => {
    expect(() => parseTasksResponse("not json")).toThrow(
      InvalidModelResponseError,
    );
    expect(() =>
      parseTasksResponse(JSON.stringify({ tasks: [{ task: "No quote" }] })),
    ).toThrow(InvalidModelResponseError);
    expect(() =>
      parseTasksResponse(
        JSON.stringify({
          tasks: [
            {
              task: "Send the draft",
              owner: 42,
              deadline: null,
              source_quote: "I will send the draft.",
            },
          ],
        }),
      ),
    ).toThrow(InvalidModelResponseError);
  });
});

describe("parseVerifierResponse", () => {
  const tasks = [
    {
      task: "Send the draft",
      owner: { value: "Maya", status: "stated" as const },
      deadline: { value: null, status: "missing" as const },
      source_quote: "Maya: I'll send the draft.",
    },
    {
      task: "Book a room",
      owner: { value: null, status: "missing" as const },
      deadline: { value: null, status: "missing" as const },
      source_quote: "Invented quote.",
    },
  ];

  it("requires exact source presence and both verifier checks", () => {
    const results = parseVerifierResponse(
      JSON.stringify({
        verifications: [
          { index: 0, quote_exact: true, supports_task: true },
          { index: 1, quote_exact: true, supports_task: true },
        ],
      }),
      tasks,
      "Maya: I'll send the draft.",
    );
    expect(results).toEqual([true, false]);
  });

  it("rejects incomplete or duplicate verifier results", () => {
    expect(() =>
      parseVerifierResponse(
        JSON.stringify({
          verifications: [{ index: 0, quote_exact: true, supports_task: true }],
        }),
        tasks,
        "Maya: I'll send the draft.",
      ),
    ).toThrow(InvalidModelResponseError);
  });
});
