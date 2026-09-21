import {
  isProviderId,
  resolveModel,
  type ProviderId,
} from "./providers";
import { LANGUAGES } from "./languages";

const KEY = "veil.settings.v1";

export type SessionMode = "meeting" | "interview" | "sales" | "coaching";

export const SESSION_MODES: {
  id: SessionMode;
  label: string;
  hint: string;
}[] = [
  { id: "meeting", label: "Meeting", hint: "What to say, recap, decisions." },
  { id: "interview", label: "Interview", hint: "Short answers you can speak." },
  { id: "sales", label: "Sales", hint: "Discovery, objections, next step." },
  { id: "coaching", label: "Coaching", hint: "How you are showing up." },
];

export type Settings = {
  provider: ProviderId;
  apiKey: string;
  model: string;
  lang: string;
  outputLang: string;
  micId: string;
  sessionMode: SessionMode;
  displayName: string;
  notifyAssist: boolean;
  autoHideOnShare: boolean;
};

const DEFAULTS: Settings = {
  provider: "gemini",
  apiKey: "",
  model: "gemini-2.5-flash",
  lang: "en-US",
  outputLang: "en-US",
  micId: "",
  sessionMode: "meeting",
  displayName: "You",
  notifyAssist: true,
  autoHideOnShare: true,
};

export function isSessionMode(v: unknown): v is SessionMode {
  return v === "meeting" || v === "interview" || v === "sales" || v === "coaching";
}

function knownLang(v: unknown) {
  return typeof v === "string" && LANGUAGES.some((l) => l.id === v) ? v : DEFAULTS.lang;
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const provider = isProviderId(parsed.provider) ? parsed.provider : DEFAULTS.provider;
    return {
      provider,
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      model: resolveModel(provider, parsed.model),
      lang: knownLang(parsed.lang),
      outputLang: knownLang(parsed.outputLang ?? parsed.lang),
      micId: typeof parsed.micId === "string" ? parsed.micId : "",
      sessionMode: isSessionMode(parsed.sessionMode) ? parsed.sessionMode : DEFAULTS.sessionMode,
      displayName:
        typeof parsed.displayName === "string" && parsed.displayName.trim()
          ? parsed.displayName.trim().slice(0, 40)
          : DEFAULTS.displayName,
      notifyAssist: parsed.notifyAssist !== false,
      autoHideOnShare: parsed.autoHideOnShare !== false,
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

export { DEFAULTS as DEFAULT_SETTINGS };
