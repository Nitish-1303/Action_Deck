"use client";

import { useMemo, useRef, useState } from "react";
import type { ExtractedTask } from "@/lib/contracts";
import { samples, type SampleKey } from "@/lib/samples";

interface ExtractResponse {
  tasks: ExtractedTask[];
  provider: "gemini" | "groq";
  verificationError?: string;
}

function providerLabel(provider: "gemini" | "groq"): string {
  return provider === "gemini" ? "Google Gemini" : "Groq";
}

function markdownFor(tasks: ExtractedTask[]): string {
  return tasks
    .map(
      (task) =>
        `- [${task.verified ? "x" : " "}] ${task.task}\n` +
        `  - Owner: ${task.owner.value ? `${task.owner.value} (stated)` : "Missing"}\n` +
        `  - Deadline: ${task.deadline.value ? `${task.deadline.value} (stated)` : "Missing"}\n` +
        `  - Quote: “${task.source_quote}”` +
        `${task.verified ? "" : "\n  - Verification: Unverified"}`,
    )
    .join("\n\n");
}

function TaskCell({ value, status }: { value: string | null; status: "stated" | "missing" }) {
  return value ? (
    <span>
      {value}
      <span className="mt-1 block text-[10px] uppercase tracking-[0.1em] text-[var(--muted)]">
        {status}
      </span>
    </span>
  ) : (
    <span className="text-[#908e85] italic">
      <span>Missing</span>
      <span className="mt-1 block font-sans text-[10px] not-italic uppercase tracking-[0.1em]">
        {status}
      </span>
    </span>
  );
}

export default function Home({
  initialProvider,
}: {
  initialProvider: "gemini" | "groq";
}) {
  const [transcript, setTranscript] = useState("");
  const [provider, setProvider] = useState<"gemini" | "groq">(initialProvider);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [activeQuote, setActiveQuote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const transcriptRef = useRef<HTMLTextAreaElement>(null);

  const highlightedTranscript = useMemo(() => {
    if (!activeQuote) return null;
    const position = transcript.indexOf(activeQuote);
    if (position < 0) return null;
    return {
      before: transcript.slice(0, position),
      quote: transcript.slice(position, position + activeQuote.length),
      after: transcript.slice(position + activeQuote.length),
    };
  }, [activeQuote, transcript]);

  async function extractTasks() {
    setLoading(true);
    setError("");
    setResult(null);
    setActiveQuote(null);
    setCopied(false);
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "We couldn't extract tasks from this transcript.";
        throw new Error(message);
      }
      setResult(payload as ExtractResponse);
      setProvider((payload as ExtractResponse).provider);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We couldn't reach the extraction service. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function loadSample(key: SampleKey) {
    setTranscript(samples[key]);
    setResult(null);
    setError("");
    setActiveQuote(null);
    transcriptRef.current?.focus();
  }

  async function copyMarkdown() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(markdownFor(result.tasks));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Clipboard access was blocked. Check your browser permissions and try again.");
    }
  }

  function focusQuote(quote: string) {
    setActiveQuote(quote);
    document.getElementById("transcript-panel")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    transcriptRef.current?.focus({ preventScroll: true });
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1160px] px-5 sm:px-10">
      <header className="flex h-[76px] items-center justify-between border-b border-[var(--rule)]">
        <a className="focus-ring text-[19px] font-semibold tracking-[-0.06em]" href="#">
          ActionDeck<span className="text-[var(--accent)]">.</span>
        </a>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
          <span aria-hidden="true" className="h-1.5 w-1.5 bg-[#57745a]" />
          Traced with Neatlogs
        </div>
      </header>

      <section className="pb-11 pt-16 sm:pb-14 sm:pt-[84px]">
        <p className="mb-5 text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">
          The meeting follow-through tool
        </p>
        <h1 className="serif max-w-[780px] text-[clamp(52px,9vw,94px)] leading-[0.95]">
          Meetings in.
          <br />
          Tasks out.
        </h1>
        <p className="mt-7 max-w-[530px] text-[16px] leading-7 text-[#55544e]">
          Paste a transcript. Get every commitment, with an owner, a date, and
          the exact words behind it.
        </p>
      </section>

      <section aria-label="Transcript input" className="border-t border-[var(--rule)] pt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <label
            className="text-[11px] font-medium uppercase tracking-[0.14em]"
            htmlFor="transcript"
          >
            Meeting transcript
          </label>
          <div className="flex items-center gap-2">
            <button
              className="focus-ring border border-[var(--rule)] px-3 py-2 text-[12px] transition-colors hover:border-[var(--ink)]"
              onClick={() => loadSample("english")}
              type="button"
            >
              Load English sample
            </button>
            <button
              className="focus-ring border border-[var(--rule)] px-3 py-2 text-[12px] transition-colors hover:border-[var(--ink)]"
              onClick={() => loadSample("hinglish")}
              type="button"
            >
              Load Hinglish sample
            </button>
          </div>
        </div>
        <div className="relative" id="transcript-panel">
          <textarea
            ref={transcriptRef}
            id="transcript"
            className="focus-ring min-h-[250px] w-full resize-y border border-[var(--rule)] bg-transparent p-5 text-[14px] leading-6 placeholder:text-[#a09e96] focus:border-[var(--ink)] focus:outline-none"
            maxLength={50000}
            onChange={(event) => {
              setTranscript(event.target.value);
              setResult(null);
              setActiveQuote(null);
            }}
            placeholder="Paste your meeting transcript here…"
            value={transcript}
          />
        </div>
        {highlightedTranscript && (
          <div
            aria-live="polite"
            className="mt-3 border-l-2 border-[var(--accent)] bg-[#f0eee8] px-4 py-3"
          >
            <p className="mb-2 text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
              Source sentence in transcript
            </p>
            <p className="whitespace-pre-wrap text-[13px] leading-6">
              {highlightedTranscript.before}
              <mark className="transcript-mark">{highlightedTranscript.quote}</mark>
              {highlightedTranscript.after}
            </p>
          </div>
        )}
        {activeQuote && !highlightedTranscript && (
          <p className="mt-3 border-l-2 border-[var(--accent)] px-4 py-3 text-[13px] leading-5 text-[var(--accent)]" role="status">
            This quote was not found verbatim in the transcript.
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <span className="text-[12px] text-[var(--muted)]">
            {transcript.length.toLocaleString()} / 50,000 characters
          </span>
          <button
            className="focus-ring min-h-11 bg-[var(--ink)] px-5 text-[13px] font-medium text-[var(--paper)] transition-colors hover:bg-[#393831] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading || transcript.trim().length < 20}
            onClick={extractTasks}
            type="button"
          >
            {loading ? "Finding commitments…" : "Find tasks"}
            {!loading && <span className="ml-4" aria-hidden="true">→</span>}
          </button>
        </div>
        {error && (
          <p className="mt-4 border-l-2 border-[var(--accent)] pl-3 text-[13px] leading-5 text-[var(--accent)]" role="alert">
            {error}
          </p>
        )}
      </section>

      {result && (
        <section aria-label="Extracted tasks" className="mt-14 border-t border-[var(--rule)] pt-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.15em] text-[var(--muted)]">
                {result.tasks.length} {result.tasks.length === 1 ? "commitment" : "commitments"}
              </p>
              <h2 className="serif text-[38px] leading-none">The follow-through</h2>
            </div>
            <button
              className="focus-ring border border-[var(--ink)] px-4 py-2.5 text-[12px] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:opacity-50"
              disabled={result.tasks.length === 0}
              onClick={copyMarkdown}
              type="button"
            >
              {copied ? "Copied" : "Copy as Markdown"}
            </button>
          </div>

          {result.verificationError && (
            <p className="mb-4 border-l-2 border-[#a36a28] pl-3 text-[13px] leading-5 text-[#79501f]" role="status">
              {result.verificationError} Every task below is marked unverified.
            </p>
          )}

          {result.tasks.length > 0 ? (
            <div className="overflow-x-auto border-y border-[var(--rule)]">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">
                    <th className="w-[29%] py-3 pr-5 font-medium">Task</th>
                    <th className="w-[15%] py-3 pr-5 font-medium">Owner</th>
                    <th className="w-[18%] py-3 pr-5 font-medium">Deadline</th>
                    <th className="py-3 pr-5 font-medium">Source quote</th>
                  </tr>
                </thead>
                <tbody>
                  {result.tasks.map((task, index) => (
                    <tr className="task-row border-t border-[var(--rule)] align-top" key={`${task.source_quote}-${index}`}>
                      <td className="py-4 pr-5 text-[13px] leading-5">
                        <div>{task.task}</div>
                        {!task.verified && (
                          <span className="mt-2 inline-block border border-[var(--accent)] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-4 pr-5 text-[13px] leading-5">
                        <TaskCell {...task.owner} />
                      </td>
                      <td className="py-4 pr-5 text-[13px] leading-5">
                        <TaskCell {...task.deadline} />
                      </td>
                      <td className="py-4 text-[13px] leading-5">
                        <button
                          className="focus-ring text-left text-[#55544e] underline decoration-[var(--rule)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]"
                          onClick={() => focusQuote(task.source_quote)}
                          type="button"
                        >
                          “{task.source_quote}”
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="border-y border-[var(--rule)] py-8 text-[14px] text-[var(--muted)]">
              No clear commitments found. Try a longer transcript with explicit action items.
            </p>
          )}
          <p className="mt-3 text-[11px] text-[var(--muted)]">
            Processed by {providerLabel(result.provider)}. Click any quote to locate it in the transcript.
          </p>
        </section>
      )}

      <footer className="mt-20 border-t border-[var(--rule)] py-7 text-[12px] leading-5 text-[var(--muted)]">
        No bot, no account, no recording. Your transcript is sent to{" "}
        {providerLabel(result?.provider ?? provider)} for processing and is not stored by ActionDeck.
      </footer>
    </main>
  );
}
