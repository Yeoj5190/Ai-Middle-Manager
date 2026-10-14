// ============================================================================
// AI Middle Manager — "brain", piece 1: post-call extraction.
//
// Pure function over A TRANSCRIPT (string). Decoupled from VAPI so it runs on
// stub/sample transcripts now and real ones later with no rework. Uses OpenAI
// Structured Outputs so the result is guaranteed to match the schema.
//
// CORE PRINCIPLE: this reads what the employee *reported* on the call. It is a
// CLAIM, not verified truth — downstream code must treat it as "reported" and
// never override the verified task state.
// ============================================================================
import "server-only";
import OpenAI from "openai";
import type { ExtractedOutcome } from "@/lib/types";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

// OpenAI Structured Outputs JSON schema (strict).
const CALL_OUTCOME_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reported_task_status", "acknowledged", "needs_help", "blocker", "follow_up_needed", "notes"],
  properties: {
    reported_task_status: {
      type: ["string", "null"],
      enum: ["done", "in_progress", "blocked", "not_started", null],
      description: "The task status the EMPLOYEE CLAIMED on the call. null if not discussed.",
    },
    acknowledged: {
      type: ["boolean", "null"],
      description: "Did the employee confirm they heard/understood the reminder? null if unclear.",
    },
    needs_help: { type: ["boolean", "null"], description: "Did they ask for or clearly need help?" },
    blocker: { type: ["string", "null"], description: "Short description of what's blocking progress, or null." },
    follow_up_needed: { type: ["boolean", "null"], description: "Does a human follow-up / re-check seem warranted?" },
    notes: { type: ["string", "null"], description: "One short neutral sentence summarizing what they reported, or null." },
  },
} as const;

const SYSTEM_PROMPT = `You are the post-call analysis layer of an AI middle manager that supervises frontline staff (e.g. motel workers). You read a transcript of a phone call between the AI and an employee and extract a structured summary of what the EMPLOYEE REPORTED.

CRITICAL RULES:
- Extract ONLY what the employee actually claimed or said. This is REPORTED information, not verified truth. Never infer task completion from anything other than the employee's own words.
- If a field cannot be determined from the transcript, set it to null. Never guess or fabricate.
- reported_task_status: 'done' (employee says it's finished), 'in_progress' (actively working on it), 'blocked' (cannot proceed due to an obstacle), 'not_started' (hasn't begun). null if not discussed.
- acknowledged: true if they confirmed hearing/understanding the reminder; false if they clearly did not; null if unclear.
- needs_help: true if they asked for or clearly need assistance.
- blocker: a short description of what is preventing progress, in your own words, or null.
- follow_up_needed: true if a human follow-up or re-check is warranted (e.g. blocked, vague, non-committal, or unresolved).
- notes: one short neutral sentence summarizing what the employee reported, or null if nothing substantive.`;

export interface ExtractionResult {
  outcome: ExtractedOutcome;
  model: string;
  raw: unknown;
}

export async function extractCallOutcome(transcript: string): Promise<ExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");
  if (!transcript || !transcript.trim()) throw new Error("Transcript is empty.");

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Call transcript:\n\n${transcript}` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "call_outcome", strict: true, schema: CALL_OUTCOME_SCHEMA },
    },
  });

  const choice = completion.choices[0];
  if (choice?.message?.refusal) throw new Error(`Model refused: ${choice.message.refusal}`);
  const content = choice?.message?.content;
  if (!content) throw new Error("No content returned from model.");

  const outcome = JSON.parse(content) as ExtractedOutcome;
  return { outcome, model: completion.model || MODEL, raw: outcome };
}
