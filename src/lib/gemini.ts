import { createServerFn } from "@tanstack/react-start";
import type {
  AssistRequest,
  AssistResult,
  GeminiModel,
  MeetingNotes,
} from "./types";
import { ASSIST_ACTIONS } from "./types";

const ALLOWED_MODELS: GeminiModel[] = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-pro",
];

const SYSTEM = `You are Veil, a live meeting assistant sitting privately on the user's screen. You never join the call. You help in the moment: what to say next, follow-ups, fact checks, who they are talking to, recaps, follow-up emails, and structured notes.

Rules:
- Be concise, specific, and immediately usable.
- Ground every answer in the transcript (and the screenshot, if one is attached). If context is thin, say so and still be useful.
- Do not mention being an AI unless asked.
- Never invent attendees, numbers, or commitments that are not in the transcript or screenshot.
- Write in a calm, professional tone.`;

function actionPrompt(action: AssistRequest["action"], question?: string) {
  switch (action) {
    case "say":
      return `Suggest 3 things the user should say next. Each MUST be a first-person spoken line they can read aloud — a statement, offer, or commitment, not a question. Format as a numbered list with a 4–8 word bold lead-in, then the quoted line.`;
    case "followups":
      return `Propose 4 sharp follow-up questions the user should ask next. Make them specific to this conversation, not generic. Numbered list.`;
    case "recap":
      return `Recap the meeting so far in tight bullets: goal, what was agreed, tensions / blockers, and what is still open. 8 bullets max.`;
    case "notes":
      return `Produce structured meeting notes as JSON only, matching this shape:
{
  "title": string,
  "summary": string (2–4 sentences),
  "attendees": string[],
  "keyPoints": string[],
  "decisions": string[],
  "actionItems": [{"owner": string, "task": string, "due": string}],
  "openQuestions": string[]
}
No markdown fences.`;
    case "ask":
      return `Answer the user's question using only the meeting so far${question ? "" : ""}.
Question: ${question ?? ""}`;
    case "factcheck":
      return `Fact-check the conversation. List claims, numbers, dates, and commitments. Mark each as Supported, Unverified, or Contradicted, with a one-line reason grounded in the transcript. Flag anything the user should not repeat as fact. Tight bullets.`;
    case "who":
      return `Who is the user talking to? For each named person: role, what they care about, leverage, and risk. If names are missing, infer from what was said and label them clearly as inferred. End with one line on how the user should play the room.`;
    case "email":
      return `Draft a follow-up email the user can send after this call. Include:
Subject: ...
Then a short body: thanks, what was agreed, action items with owners, and a clear next step. Grounded only in the transcript. No fluff.`;
    case "screen":
      return `The user attached a screenshot of their screen or call. Use the image AND the transcript.
${question?.trim() ? `Question: ${question}` : "Describe what matters on screen and what they should say or do next."}
Be specific about visible names, numbers, slides, chat, or UI.`;
  }
}

function extractJson(text: string): MeetingNotes | undefined {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return undefined;
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as MeetingNotes;
    if (!parsed || typeof parsed.title !== "string") return undefined;
    return {
      title: parsed.title,
      summary: parsed.summary ?? "",
      attendees: Array.isArray(parsed.attendees) ? parsed.attendees.map(String) : [],
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions.map(String) : [],
      actionItems: Array.isArray(parsed.actionItems)
        ? parsed.actionItems.map((item) => ({
            owner: String((item as ActionItemLike)?.owner ?? "Unassigned"),
            task: String((item as ActionItemLike)?.task ?? ""),
            due: (item as ActionItemLike)?.due
              ? String((item as ActionItemLike).due)
              : undefined,
          }))
        : [],
      openQuestions: Array.isArray(parsed.openQuestions)
        ? parsed.openQuestions.map(String)
        : [],
    };
  } catch {
    return undefined;
  }
}

type ActionItemLike = { owner?: unknown; task?: unknown; due?: unknown };

function mapGoogleError(status: number, body: string): AssistResult {
  const lower = body.toLowerCase();
  if (status === 400 || status === 401 || status === 403) {
    if (lower.includes("api key") || lower.includes("api_key") || status === 401) {
      return {
        ok: false,
        code: "key",
        error:
          "Google rejected this API key. Check it in Google AI Studio and try again.",
      };
    }
    if (lower.includes("quota") || lower.includes("rate")) {
      return {
        ok: false,
        code: "quota",
        error: "Gemini quota exceeded. Wait a moment or switch models.",
      };
    }
  }
  if (status === 404) {
    return {
      ok: false,
      code: "model",
      error: "That Gemini model is not available on this key. Try Gemini 2.0 Flash.",
    };
  }
  if (status === 429) {
    return {
      ok: false,
      code: "quota",
      error: "Too many requests. Pause, then try again.",
    };
  }
  return {
    ok: false,
    error: `Gemini returned ${status}. ${body.slice(0, 180)}`,
  };
}

function userPromptFor(data: AssistRequest) {
  return `${actionPrompt(data.action, data.question)}

Live transcript:
${data.transcript || "(no transcript yet)"}`;
}

function normalizeImage(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const m = trimmed.match(/^data:image\/(?:jpeg|jpg|png);base64,(.+)$/i);
  const b64 = (m ? m[1] : trimmed).replace(/\s/g, "");
  if (b64.length < 32 || b64.length > 800000) return undefined;
  if (!/^[A-Za-z0-9+/]+=*$/.test(b64)) return undefined;
  return b64;
}

async function callGemini(data: AssistRequest): Promise<AssistResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${data.model}:generateContent?key=${encodeURIComponent(data.apiKey)}`;
  const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] =
    [{ text: userPromptFor(data) }];
  if (data.image) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: data.image } });
  }
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: data.action === "notes" ? 0.3 : 0.6,
          maxOutputTokens: data.action === "notes" || data.action === "email" ? 2048 : 1024,
          ...(data.action === "notes"
            ? { responseMimeType: "application/json" }
            : {}),
        },
      }),
    });
  } catch {
    return {
      ok: false,
      code: "network",
      error: "Could not reach Google. Check your connection and try again.",
    };
  }

  const raw = await res.text();
  if (!res.ok) return mapGoogleError(res.status, raw);
  return parseModelText(raw, data.action === "notes", "gemini");
}

async function callGrok(data: AssistRequest): Promise<AssistResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "Live AI is not available. Add a Google Gemini API key in Settings.",
    };
  }

  const userContent = data.image
    ? [
        { type: "text" as const, text: userPromptFor(data) },
        {
          type: "image_url" as const,
          image_url: { url: `data:image/jpeg;base64,${data.image}` },
        },
      ]
    : userPromptFor(data);

  let res: Response;
  try {
    res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: data.action === "notes" ? 0.3 : 0.6,
        max_tokens: data.action === "notes" || data.action === "email" ? 2048 : 1024,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
      }),
    });
  } catch {
    return {
      ok: false,
      code: "network",
      error: "Could not reach the live model. Try again in a moment.",
    };
  }

  const raw = await res.text();
  if (!res.ok) {
    return { ok: false, error: `Live assist failed (${res.status}). Try again.` };
  }

  try {
    const json = JSON.parse(raw) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return { ok: false, error: "The model returned an empty answer. Try again." };
    }
    const notes = data.action === "notes" ? extractJson(text) : undefined;
    return { ok: true, text, notes };
  } catch {
    return { ok: false, error: "Unexpected response from the live model." };
  }
}

function parseModelText(
  raw: string,
  wantNotes: boolean,
  kind: "gemini" | "grok",
): AssistResult {
  try {
    const json = JSON.parse(raw) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      error?: { message?: string };
    };
    const text =
      json.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("\n")
        .trim() ?? "";
    if (!text && json.error?.message) {
      return { ok: false, error: json.error.message };
    }
    if (!text) {
      return {
        ok: false,
        error:
          kind === "gemini"
            ? "Gemini returned an empty answer. Try again."
            : "The model returned an empty answer. Try again.",
      };
    }
    const notes = wantNotes ? extractJson(text) : undefined;
    return { ok: true, text, notes };
  } catch {
    return { ok: false, error: "Unexpected response from Gemini." };
  }
}

export const runAssist = createServerFn({ method: "POST" })
  .validator((input: AssistRequest) => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid request");
    }
    const apiKey = String(input.apiKey ?? "").trim();
    if (apiKey.length > 200) throw new Error("Invalid API key");
    const model = ALLOWED_MODELS.includes(input.model)
      ? input.model
      : "gemini-2.5-flash";
    const action = input.action;
    if (!ASSIST_ACTIONS.includes(action)) {
      throw new Error("Invalid action");
    }
    const transcript = String(input.transcript ?? "").slice(-14000);
    const question = input.question ? String(input.question).slice(0, 2000) : undefined;
    const image = normalizeImage(input.image);
    return { apiKey, model, action, transcript, question, image } satisfies AssistRequest;
  })
  .handler(async ({ data }): Promise<AssistResult> => {
    if (data.apiKey) {
      const gemini = await callGemini(data);
      if (gemini.ok) return gemini;
      if (gemini.code === "key" || gemini.code === "quota") return gemini;
    }
    return callGrok(data);
  });

export const testGeminiKey = createServerFn({ method: "POST" })
  .validator((input: { apiKey: string; model: GeminiModel }) => {
    const apiKey = String(input?.apiKey ?? "").trim();
    if (!apiKey) throw new Error("Missing API key");
    const model = ALLOWED_MODELS.includes(input.model)
      ? input.model
      : "gemini-2.5-flash";
    return { apiKey, model };
  })
  .handler(async ({ data }): Promise<AssistResult> => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${data.model}:generateContent?key=${encodeURIComponent(data.apiKey)}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Reply with the single word ok." }] }],
          generationConfig: { maxOutputTokens: 8, temperature: 0 },
        }),
      });
      const raw = await res.text();
      if (!res.ok) return mapGoogleError(res.status, raw);
      return { ok: true, text: "connected" };
    } catch {
      return {
        ok: false,
        code: "network",
        error: "Could not reach Google.",
      };
    }
  });
