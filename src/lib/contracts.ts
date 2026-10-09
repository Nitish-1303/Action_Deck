export type FieldStatus = "stated" | "missing";

export interface TaskField {
  value: string | null;
  status: FieldStatus;
}

export interface ExtractedTask {
  task: string;
  owner: TaskField;
  deadline: TaskField;
  source_quote: string;
  verified: boolean;
}

interface RawTask {
  task?: unknown;
  owner?: unknown;
  deadline?: unknown;
  source_quote?: unknown;
}

export class InvalidModelResponseError extends Error {
  constructor() {
    super("The model response did not match the required task format.");
    this.name = "InvalidModelResponseError";
  }
}

export function parseTasksResponse(content: string): Omit<ExtractedTask, "verified">[] {
  let decoded: unknown;
  try {
    decoded = JSON.parse(content);
  } catch {
    throw new InvalidModelResponseError();
  }

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("tasks" in decoded) ||
    !Array.isArray(decoded.tasks)
  ) {
    throw new InvalidModelResponseError();
  }

  return decoded.tasks.map((item: RawTask) => {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof item.task !== "string" ||
      !item.task.trim() ||
      typeof item.source_quote !== "string" ||
      !item.source_quote.trim()
    ) {
      throw new InvalidModelResponseError();
    }

    return {
      task: item.task.trim(),
      owner: parseField(item.owner),
      deadline: parseField(item.deadline),
      source_quote: item.source_quote,
    };
  });
}

function parseField(value: unknown): TaskField {
  if (value !== undefined && value !== null && typeof value !== "string") {
    throw new InvalidModelResponseError();
  }
  if (typeof value === "string" && value.trim()) {
    return { value: value.trim(), status: "stated" };
  }
  return { value: null, status: "missing" };
}

export function parseVerifierResponse(
  content: string,
  tasks: readonly Omit<ExtractedTask, "verified">[],
  transcript: string,
): boolean[] {
  let decoded: unknown;
  try {
    decoded = JSON.parse(content);
  } catch {
    throw new InvalidModelResponseError();
  }

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("verifications" in decoded) ||
    !Array.isArray(decoded.verifications) ||
    decoded.verifications.length !== tasks.length
  ) {
    throw new InvalidModelResponseError();
  }

  const byIndex = new Map<number, boolean>();
  for (const entry of decoded.verifications) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      !("index" in entry) ||
      typeof entry.index !== "number" ||
      !Number.isInteger(entry.index) ||
      entry.index < 0 ||
      entry.index >= tasks.length ||
      !("quote_exact" in entry) ||
      typeof entry.quote_exact !== "boolean" ||
      !("supports_task" in entry) ||
      typeof entry.supports_task !== "boolean" ||
      byIndex.has(entry.index)
    ) {
      throw new InvalidModelResponseError();
    }
    byIndex.set(
      entry.index,
      entry.quote_exact && entry.supports_task,
    );
  }

  if (byIndex.size !== tasks.length) {
    throw new InvalidModelResponseError();
  }

  return tasks.map(
    (task, index) =>
      transcript.includes(task.source_quote) && byIndex.get(index) === true,
  );
}
