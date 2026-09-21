import type { GeminiModel } from "./types";

const KEY = "veil.settings.v1";

export type Settings = {
  apiKey: string;
  model: GeminiModel;
  lang: string;
};

const DEFAULTS: Settings = {
  apiKey: "",
  model: "gemini-2.5-flash",
  lang: "en-US",
};

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      model:
        parsed.model === "gemini-2.0-flash" ||
        parsed.model === "gemini-2.5-pro" ||
        parsed.model === "gemini-2.5-flash"
          ? parsed.model
          : DEFAULTS.model,
      lang: typeof parsed.lang === "string" ? parsed.lang : DEFAULTS.lang,
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function maskKey(key: string) {
  const t = key.trim();
  if (t.length < 8) return t ? "••••" : "";
  return `${t.slice(0, 4)}••••${t.slice(-4)}`;
}
