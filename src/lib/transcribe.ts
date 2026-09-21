import { createServerFn } from "@tanstack/react-start";
import { isProviderId, type ProviderId } from "./providers";

export type TranscribeResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

const ALLOWED_MIME = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp3",
]);

function extFor(mime: string) {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

function langCode(lang: string) {
  const base = lang.trim().toLowerCase().split("-")[0] || "en";
  return base.slice(0, 8);
}

async function transcribeGemini(
  apiKey: string,
  mime: string,
  audio: string,
): Promise<TranscribeResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Transcribe the spoken words in this audio. Return only the transcript. If there is no speech, return an empty string.",
              },
              { inlineData: { mimeType: mime, data: audio } },
            ],
          },
        ],
        generationConfig: { temperature: 0, maxOutputTokens: 512 },
      }),
    });
    const raw = await res.text();
    if (!res.ok) {
      return { ok: false, error: "Could not transcribe with Gemini." };
    }
    const json = JSON.parse(raw) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text =
      json.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join(" ")
        .trim() ?? "";
    return { ok: true, text };
  } catch {
    return { ok: false, error: "Could not reach Gemini for transcription." };
  }
}

async function transcribeXai(
  apiKey: string,
  mime: string,
  audio: string,
  lang: string,
): Promise<TranscribeResult> {
  const buf = Buffer.from(audio, "base64");
  const form = new FormData();
  form.append("model", "grok-voice-transcribe-2.0");
  form.append("language", lang);
  form.append("file", new Blob([buf], { type: mime }), `chunk.${extFor(mime)}`);
  try {
    const res = await fetch("https://api.x.ai/v1/stt", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    const raw = await res.text();
    if (!res.ok) {
      return { ok: false, error: "Live transcription failed. Try again." };
    }
    const json = JSON.parse(raw) as { text?: string };
    return { ok: true, text: (json.text ?? "").trim() };
  } catch {
    return { ok: false, error: "Could not reach live transcription." };
  }
}

async function transcribeOpenAICompat(
  url: string,
  apiKey: string,
  model: string,
  mime: string,
  audio: string,
  lang: string,
  label: string,
): Promise<TranscribeResult> {
  const buf = Buffer.from(audio, "base64");
  const form = new FormData();
  form.append("model", model);
  form.append("language", lang);
  form.append("file", new Blob([buf], { type: mime }), `chunk.${extFor(mime)}`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    const raw = await res.text();
    if (!res.ok) {
      return { ok: false, error: `Could not transcribe with ${label}.` };
    }
    const json = JSON.parse(raw) as { text?: string };
    return { ok: true, text: (json.text ?? "").trim() };
  } catch {
    return { ok: false, error: `Could not reach ${label} for transcription.` };
  }
}

async function transcribeHostedXai(
  mime: string,
  audio: string,
  lang: string,
): Promise<TranscribeResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "Add an API key in Settings to transcribe.",
    };
  }
  return transcribeXai(apiKey, mime, audio, lang);
}

async function transcribeWithProvider(
  provider: ProviderId,
  apiKey: string,
  mime: string,
  audio: string,
  lang: string,
): Promise<TranscribeResult | null> {
  switch (provider) {
    case "gemini":
      return transcribeGemini(apiKey, mime, audio);
    case "openai":
      return transcribeOpenAICompat(
        "https://api.openai.com/v1/audio/transcriptions",
        apiKey,
        "whisper-1",
        mime,
        audio,
        lang,
        "OpenAI",
      );
    case "groq":
      return transcribeOpenAICompat(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        apiKey,
        "whisper-large-v3",
        mime,
        audio,
        lang,
        "Groq",
      );
    case "xai":
      return transcribeXai(apiKey, mime, audio, lang);
    case "anthropic":
    case "openrouter":
      return null;
  }
}

export const transcribeChunk = createServerFn({ method: "POST" })
  .validator(
    (input: {
      provider?: ProviderId;
      apiKey?: string;
      lang?: string;
      mime?: string;
      audio: string;
    }) => {
      const audio = String(input?.audio ?? "").replace(/\s/g, "");
      if (audio.length < 32 || audio.length > 2_000_000) {
        throw new Error("Invalid audio");
      }
      if (!/^[A-Za-z0-9+/]+=*$/.test(audio)) throw new Error("Invalid audio");
      const rawMime = String(input?.mime ?? "audio/webm")
        .split(";")[0]
        .trim()
        .toLowerCase();
      const mime = ALLOWED_MIME.has(rawMime) ? rawMime : "audio/webm";
      const apiKey = String(input?.apiKey ?? "").trim().slice(0, 512);
      const lang = langCode(String(input?.lang ?? "en"));
      const provider: ProviderId = isProviderId(input?.provider)
        ? input.provider
        : "gemini";
      return { provider, apiKey, lang, mime, audio };
    },
  )
  .handler(async ({ data }): Promise<TranscribeResult> => {
    if (data.apiKey) {
      const own = await transcribeWithProvider(
        data.provider,
        data.apiKey,
        data.mime,
        data.audio,
        data.lang,
      );
      if (own?.ok) return own;
    }
    return transcribeHostedXai(data.mime, data.audio, data.lang);
  });
