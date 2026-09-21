import { createServerFn } from "@tanstack/react-start";
import {
  isProviderId,
  PROVIDERS,
  type ProviderId,
} from "./providers";
import type { AssistRequest, AssistResult, MeetingNotes } from "./types";
import { ASSIST_ACTIONS } from "./types";

const MODEL_RE = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,79}$/;

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
      return `Answer the user's question using only the meeting so far.
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

function maxTokens(action: AssistRequest["action"]) {
  return action === "notes" || action === "email" ? 2048 : 1024;
}

function temperature(action: AssistRequest["action"]) {
  return action === "notes" ? 0.3 : 0.6;
}

function okText(text: string, wantNotes: boolean): AssistResult {
  const notes = wantNotes ? extractJson(text) : undefined;
  return { ok: true, text, notes };
}

function emptyAnswer(label: string): AssistResult {
  return { ok: false, error: `${label} returned an empty answer. Try again.` };
}

function mapHttpError(
  status: number,
  body: string,
  label: string,
): AssistResult {
  const lower = body.toLowerCase();
  if (status === 400 || status === 401 || status === 403) {
    if (
      status === 401 ||
      lower.includes("api key") ||
      lower.includes("api_key") ||
      lower.includes("invalid_api_key") ||
      lower.includes("incorrect api key") ||
      lower.includes("authentication")
    ) {
      return {
        ok: false,
        code: "key",
        error: `${label} rejected this API key. Check it and try again.`,
      };
    }
    if (lower.includes("quota") || lower.includes("rate") || lower.includes("credit")) {
      return {
        ok: false,
        code: "quota",
        error: `${label} quota exceeded. Wait a moment or switch models.`,
      };
    }
  }
  if (status === 404) {
    return {
      ok: false,
      code: "model",
      error: `That ${label} model is not available on this key. Try another model.`,
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
    error: `${label} returned ${status}. ${body.slice(0, 180)}`,
  };
}

function openaiContent(
  content: unknown,
): string {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text ?? "");
        }
        return "";
      })
      .join("\n")
      .trim();
  }
  return "";
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
          temperature: temperature(data.action),
          maxOutputTokens: maxTokens(data.action),
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
  if (!res.ok) return mapHttpError(res.status, raw, "Gemini");
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
    if (!text) return emptyAnswer("Gemini");
    return okText(text, data.action === "notes");
  } catch {
    return { ok: false, error: "Unexpected response from Gemini." };
  }
}

async function callOpenAICompat(
  data: AssistRequest,
  url: string,
  label: string,
  extraHeaders?: Record<string, string>,
): Promise<AssistResult> {
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
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify({
        model: data.model,
        temperature: temperature(data.action),
        max_tokens: maxTokens(data.action),
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
      error: `Could not reach ${label}. Check your connection and try again.`,
    };
  }

  const raw = await res.text();
  if (!res.ok) return mapHttpError(res.status, raw, label);
  try {
    const json = JSON.parse(raw) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const text = openaiContent(json.choices?.[0]?.message?.content);
    if (!text) return emptyAnswer(label);
    return okText(text, data.action === "notes");
  } catch {
    return { ok: false, error: `Unexpected response from ${label}.` };
  }
}

async function callAnthropic(data: AssistRequest): Promise<AssistResult> {
  const content: Array<
    | { type: "text"; text: string }
    | {
        type: "image";
        source: { type: "base64"; media_type: "image/jpeg"; data: string };
      }
  > = [{ type: "text", text: userPromptFor(data) }];
  if (data.image) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: data.image },
    });
  }

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": data.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: data.model,
        max_tokens: maxTokens(data.action),
        temperature: temperature(data.action),
        system: SYSTEM,
        messages: [{ role: "user", content }],
      }),
    });
  } catch {
    return {
      ok: false,
      code: "network",
      error: "Could not reach Anthropic. Check your connection and try again.",
    };
  }

  const raw = await res.text();
  if (!res.ok) return mapHttpError(res.status, raw, "Claude");
  try {
    const json = JSON.parse(raw) as {
      content?: { type?: string; text?: string }[];
    };
    const text =
      json.content
        ?.filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("\n")
        .trim() ?? "";
    if (!text) return emptyAnswer("Claude");
    return okText(text, data.action === "notes");
  } catch {
    return { ok: false, error: "Unexpected response from Claude." };
  }
}

async function callHostedGrok(data: AssistRequest): Promise<AssistResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "Live AI is not available. Add an API key in Settings.",
    };
  }
  return callOpenAICompat(
    { ...data, apiKey, model: "grok-4.5" },
    "https://api.x.ai/v1/chat/completions",
    "Live assist",
  );
}

function extraHeadersFor(provider: ProviderId): Record<string, string> | undefined {
  if (provider !== "openrouter") return undefined;
  return {
    "HTTP-Referer": "https://github.com/shahinur801/veil-meeting-assistant",
    "X-Title": "Veil",
  };
}

async function callProvider(data: AssistRequest): Promise<AssistResult> {
  const def = PROVIDERS[data.provider];
  if (def.kind === "gemini") return callGemini(data);
  if (def.kind === "anthropic") return callAnthropic(data);
  if (!def.chatUrl) {
    return { ok: false, error: `${def.label} is not configured.` };
  }
  return callOpenAICompat(
    data,
    def.chatUrl,
    def.short,
    extraHeadersFor(data.provider),
  );
}

function sanitizeRequest(input: AssistRequest): AssistRequest {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid request");
  }
  const apiKey = String(input.apiKey ?? "").trim();
  if (apiKey.length > 512) throw new Error("Invalid API key");
  const provider: ProviderId = isProviderId(input.provider)
    ? input.provider
    : "gemini";
  const rawModel = String(input.model ?? "").trim();
  const model = MODEL_RE.test(rawModel)
    ? rawModel
    : PROVIDERS[provider].defaultModel;
  const action = input.action;
  if (!ASSIST_ACTIONS.includes(action)) {
    throw new Error("Invalid action");
  }
  const transcript = String(input.transcript ?? "").slice(-14000);
  const question = input.question ? String(input.question).slice(0, 2000) : undefined;
  const image = normalizeImage(input.image);
  return { provider, apiKey, model, action, transcript, question, image };
}

export const runAssist = createServerFn({ method: "POST" })
  .validator((input: AssistRequest) => sanitizeRequest(input))
  .handler(async ({ data }): Promise<AssistResult> => {
    if (data.apiKey) {
      const result = await callProvider(data);
      if (result.ok) return result;
      if (result.code === "key" || result.code === "quota") return result;
    }
    return callHostedGrok(data);
  });

export const testApiKey = createServerFn({ method: "POST" })
  .validator((input: { provider: ProviderId; apiKey: string; model: string }) => {
    const apiKey = String(input?.apiKey ?? "").trim();
    if (!apiKey) throw new Error("Missing API key");
    if (apiKey.length > 512) throw new Error("Invalid API key");
    const provider: ProviderId = isProviderId(input.provider)
      ? input.provider
      : "gemini";
    const rawModel = String(input.model ?? "").trim();
    const model = MODEL_RE.test(rawModel)
      ? rawModel
      : PROVIDERS[provider].defaultModel;
    return { provider, apiKey, model };
  })
  .handler(async ({ data }): Promise<AssistResult> => {
    const probe: AssistRequest = {
      provider: data.provider,
      apiKey: data.apiKey,
      model: data.model,
      action: "ask",
      question: "Reply with the single word ok.",
      transcript: "(connection test)",
    };
    if (data.provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${data.model}:generateContent?key=${encodeURIComponent(data.apiKey)}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: "Reply with the single word ok." }] },
            ],
            generationConfig: { maxOutputTokens: 8, temperature: 0 },
          }),
        });
        const raw = await res.text();
        if (!res.ok) return mapHttpError(res.status, raw, "Gemini");
        return { ok: true, text: "connected" };
      } catch {
        return { ok: false, code: "network", error: "Could not reach Google." };
      }
    }
    const result = await callProvider({
      ...probe,
      action: "ask",
    });
    if (result.ok) return { ok: true, text: "connected" };
    return result;
  });
