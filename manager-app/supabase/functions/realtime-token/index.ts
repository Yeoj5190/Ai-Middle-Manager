// ============================================================================
// realtime-token — Supabase Edge Function (Deno)
//
// Mints a SHORT-LIVED OpenAI Realtime ephemeral token. The secret OPENAI_API_KEY
// NEVER leaves the server. The browser calls this, gets back a client_secret,
// and uses it to open a WebRTC connection DIRECTLY to OpenAI (audio never flows
// through this server — only this cheap token request does).
//
// Secrets (set with `supabase secrets set ...`):
//   OPENAI_API_KEY   (required)  — your OpenAI secret key
//   REALTIME_MODEL   (optional)  — defaults below
//   REALTIME_VOICE   (optional)  — defaults below
// ============================================================================

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
// defaults to gpt-realtime-mini (~5x cheaper); set a REALTIME_MODEL secret to
// "gpt-realtime" to switch back to the full model.
const REALTIME_MODEL = Deno.env.get("REALTIME_MODEL") ?? "gpt-realtime-mini";
const REALTIME_VOICE = Deno.env.get("REALTIME_VOICE") ?? "marin";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Kept deliberately short: this is re-sent as input on every turn, so every word costs.
const INSTRUCTIONS = `You are the AI Operations Manager for motel housekeeping — a proactive shift manager on a voice call with a housekeeper. Drive the conversation. Be warm and brief: short spoken sentences, no jargon, no markdown. Don't interrupt; if they just say "ok"/"hm", keep it short.
Only reply when the worker is clearly speaking TO YOU. Ignore background noise, faint or partial sounds, and your own echo — if it isn't clearly the worker addressing you, stay silent and wait.
- The opening greeting is already handled — don't greet again or repeat the task list unless asked.
- When they finish a task or room, proactively tell them to tap the Camera for a photo check; don't wait to be asked.
- After each task, nudge them to the next one.
- For their tasks or what's next, call get_my_tasks and answer only from it — never invent tasks.
- After a photo, you'll get a quality result; explain it: praise passes, give a quick fix for fails.
- When the worker reports a problem, shortage, broken item, or anything needing follow-up (e.g. "we're out of towels", "the AC is broken"), call report_issue to log it as a task, then briefly confirm you've logged it.
- For SOP how-tos, just answer. If you genuinely can't help, say you'll flag their manager.
Replies are a sentence or two unless they ask for more.`;

// Tools the AI can invoke mid-call. Execution happens in the browser (it knows
// who the worker is and holds the Supabase session); this just declares them.
const TOOLS = [
  {
    type: "function",
    name: "get_my_tasks",
    description:
      "The worker's tasks for today. Call when they ask what to do, what's next, or about their tasks/rooms.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    type: "function",
    name: "report_issue",
    description:
      "Log a problem, shortage, broken item, or anything needing follow-up that the worker mentions, as a new task. Call this whenever the worker raises a concern (missing supplies, maintenance, a guest issue).",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short imperative task title, e.g. 'Restock towels in supply room'.",
        },
        details: {
          type: "string",
          description: "Any extra detail the worker gave (location, what's wrong).",
        },
        urgency: {
          type: "string",
          enum: ["high", "med", "low"],
          description: "How urgent it sounds.",
        },
      },
      required: ["title"],
    },
  },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (!OPENAI_API_KEY) {
    return json({ error: "OPENAI_API_KEY not configured on the server" }, 500);
  }

  try {
    // GA Realtime API: create an ephemeral client secret. The returned `value`
    // is the token the browser uses for its WebRTC connection (TTL ~1 minute).
    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: REALTIME_MODEL,
          instructions: INSTRUCTIONS,
          tools: TOOLS,
          tool_choice: "auto",
          audio: {
            input: {
              // streaming transcription so the worker's words appear live
              transcription: { model: "gpt-4o-mini-transcribe" },
              // clean up motel background noise (phone held near the mouth)
              noise_reduction: { type: "near_field" },
              // classic VAD, tuned to be LESS sensitive: needs clearer speech
              // (higher threshold) and a longer pause before the AI replies.
              // higher threshold = ignore background noise; only clear close speech
              // starts a turn. silence 900ms = wait before the AI replies.
              turn_detection: {
                type: "server_vad",
                threshold: 0.75,
                prefix_padding_ms: 300,
                silence_duration_ms: 900,
              },
            },
            output: { voice: REALTIME_VOICE },
          },
        },
      }),
    });

    const data = await r.json();
    if (!r.ok) return json({ error: data }, r.status);

    // GA returns { value, expires_at, session }. Pass through + the model used.
    return json({ ...data, model: REALTIME_MODEL }, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
