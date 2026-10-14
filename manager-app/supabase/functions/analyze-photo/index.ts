// analyze-photo — scores a photo of completed work against an SOP checklist using
// an OpenAI vision model with Structured Outputs. The secret key stays server-side.
// Grounds judgments in the actual image: describes what's visible, flags off-topic
// photos as not relevant, and never invents observations.
// Input  (JSON): { image, checklist: [{key,label,critical}], sop_title }
// Output (JSON): { photo_summary, relevant, overall, score, results: [{key,label,pass,reason}] }
//
// Secrets: OPENAI_API_KEY (required), VISION_MODEL (optional, defaults below).

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const VISION_MODEL = Deno.env.get("VISION_MODEL") ?? "gpt-5.4-mini";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SCHEMA = {
  name: "qc_result",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      photo_summary: {
        type: "string",
        description: "One short sentence describing ONLY what is actually visible in the photo.",
      },
      relevant: {
        type: "boolean",
        description: "true ONLY if the photo clearly shows the room/area/subject this SOP inspects.",
      },
      overall: { type: "string", enum: ["pass", "fail", "partial"] },
      score: { type: "integer", description: "0-100 overall quality score" },
      results: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            key: { type: "string" },
            label: { type: "string" },
            pass: { type: "boolean" },
            reason: { type: "string" },
          },
          required: ["key", "label", "pass", "reason"],
        },
      },
    },
    required: ["photo_summary", "relevant", "overall", "score", "results"],
  },
};

const SYSTEM = `You are a meticulous housekeeping quality inspector judging a single photo.

STEP 1 — Look carefully and write photo_summary: describe ONLY what is literally visible in the image. Do not assume or imagine anything that isn't there.

STEP 2 — Decide relevance: set relevant=true ONLY if the photo clearly shows the area/subject this SOP is about (e.g. a hotel room, a made bed, a bathroom). If the photo shows something unrelated — a computer/screen, a person, a phone, the outdoors, a random object, a screenshot, or it's too dark/blurry to tell — set relevant=false.

STEP 3 — Score:
- If relevant=false: set overall='fail', score 0-10, and for EVERY checklist item set pass=false with reason "not shown in the photo". Do NOT invent observations (never mention a bed, towels, etc. if they are not visible).
- If relevant=true: judge each checklist item ONLY from what is visible. If a specific item isn't visible in the shot, pass=false with reason "not visible in photo". overall='pass' only if all critical items pass; 'fail' if a critical item fails; otherwise 'partial'.

Never describe or judge things that are not actually in the photo. Ground every statement in the pixels.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!OPENAI_API_KEY) {
    return json({ error: "OPENAI_API_KEY not configured on the server" }, 500);
  }

  try {
    const { image, checklist, sop_title } = await req.json();
    if (!image || !Array.isArray(checklist) || checklist.length === 0) {
      return json({ error: "`image` and a non-empty `checklist` are required" }, 400);
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `SOP: ${sop_title ?? "Quality check"}. Evaluate the photo against this checklist. Checklist JSON: ${JSON.stringify(checklist)}`,
              },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        response_format: { type: "json_schema", json_schema: SCHEMA },
      }),
    });

    const data = await r.json();
    if (!r.ok) return json({ error: data }, r.status);
    const content = data.choices?.[0]?.message?.content ?? "{}";
    return json(JSON.parse(content), 200);
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
