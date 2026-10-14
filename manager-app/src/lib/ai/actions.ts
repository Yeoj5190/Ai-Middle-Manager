"use server";
// Server actions for the post-call extraction. Both route through the one pure
// extractor (extractCallOutcome) so the logic isn't duplicated. The same
// runCallExtraction() will later be invoked automatically when a real VAPI
// transcript lands — for now it's triggered from the Call Log "Run AI
// extraction" button.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { extractCallOutcome } from "@/lib/ai/extractCallOutcome";
import type { ExtractedOutcome } from "@/lib/types";

export interface ExtractionActionResult {
  ok: boolean;
  message: string;
  outcome?: ExtractedOutcome;
  model?: string;
}

// Extract structured outcome from a logged call's transcript and persist it.
export async function runCallExtraction(callLogId: string): Promise<ExtractionActionResult> {
  if (!supabaseConfigured) {
    return { ok: false, message: "Supabase not configured." };
  }
  const supabase = await createClient();

  const { data: call, error: readErr } = await supabase
    .from("call_logs")
    .select("id, org_id, transcript")
    .eq("id", callLogId)
    .maybeSingle();
  if (readErr) return { ok: false, message: readErr.message };
  if (!call) return { ok: false, message: "Call not found." };
  if (!call.transcript || !call.transcript.trim()) {
    return { ok: false, message: "This call has no transcript to analyze yet." };
  }

  let result;
  try {
    result = await extractCallOutcome(call.transcript);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Extraction failed." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: insErr } = await supabase.from("call_extractions").insert({
    org_id: call.org_id,
    call_log_id: call.id,
    transcript: call.transcript,
    reported_task_status: result.outcome.reported_task_status,
    acknowledged: result.outcome.acknowledged,
    needs_help: result.outcome.needs_help,
    blocker: result.outcome.blocker,
    follow_up_needed: result.outcome.follow_up_needed,
    notes: result.outcome.notes,
    model: result.model,
    raw_output: result.raw,
    source: "manual_test",
    created_by: user?.id ?? null,
  });
  if (insErr) return { ok: false, message: insErr.message };

  revalidatePath("/calls");
  return { ok: true, message: `Extracted with ${result.model}.`, outcome: result.outcome, model: result.model };
}

// Ad-hoc: run extraction on any pasted transcript (does not persist). For the
// quick test box.
export async function runSampleExtraction(transcript: string): Promise<ExtractionActionResult> {
  if (!transcript || !transcript.trim()) return { ok: false, message: "Paste a transcript first." };
  try {
    const result = await extractCallOutcome(transcript);
    return { ok: true, message: `Extracted with ${result.model}.`, outcome: result.outcome, model: result.model };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Extraction failed." };
  }
}
