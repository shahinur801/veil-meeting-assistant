export type ProviderId =
  | "gemini"
  | "openai"
  | "anthropic"
  | "xai"
  | "groq"
  | "openrouter";

export type ProviderKind = "gemini" | "openai" | "anthropic";

export type ModelOption = { id: string; label: string; hint: string };

export type ProviderDef = {
  id: ProviderId;
  label: string;
  short: string;
  kind: ProviderKind;
  keyUrl: string;
  keyHint: string;
  placeholder: string;
  defaultModel: string;
  chatUrl?: string;
  models: ModelOption[];
};

export const PROVIDERS: Record<ProviderId, ProviderDef> = {
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    short: "Gemini",
    kind: "gemini",
    keyUrl: "https://aistudio.google.com/apikey",
    keyHint: "Get a free key in Google AI Studio",
    placeholder: "AIza…",
    defaultModel: "gemini-2.5-flash",
    models: [
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", hint: "Fast, recommended" },
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", hint: "Stable fallback" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", hint: "Deeper reasoning" },
    ],
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    short: "OpenAI",
    kind: "openai",
    keyUrl: "https://platform.openai.com/api-keys",
    keyHint: "Create a key in the OpenAI dashboard",
    placeholder: "sk-…",
    defaultModel: "gpt-4o-mini",
    chatUrl: "https://api.openai.com/v1/chat/completions",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o mini", hint: "Fast, inexpensive" },
      { id: "gpt-4o", label: "GPT-4o", hint: "Strong vision" },
      { id: "gpt-4.1-mini", label: "GPT-4.1 mini", hint: "Fast" },
      { id: "gpt-4.1", label: "GPT-4.1", hint: "Recommended" },
    ],
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic Claude",
    short: "Claude",
    kind: "anthropic",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyHint: "Create a key in the Anthropic console",
    placeholder: "sk-ant-…",
    defaultModel: "claude-sonnet-4-5",
    models: [
      { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", hint: "Recommended" },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", hint: "Fast" },
      { id: "claude-opus-4-1", label: "Claude Opus 4.1", hint: "Deepest" },
    ],
  },
  xai: {
    id: "xai",
    label: "xAI Grok",
    short: "Grok",
    kind: "openai",
    keyUrl: "https://console.x.ai/",
    keyHint: "Create a key in the xAI console",
    placeholder: "xai-…",
    defaultModel: "grok-4.5",
    chatUrl: "https://api.x.ai/v1/chat/completions",
    models: [
      { id: "grok-4.5", label: "Grok 4.5", hint: "Recommended" },
      { id: "grok-4", label: "Grok 4", hint: "Strong reasoning" },
      { id: "grok-3-mini", label: "Grok 3 mini", hint: "Fast" },
    ],
  },
  groq: {
    id: "groq",
    label: "Groq",
    short: "Groq",
    kind: "openai",
    keyUrl: "https://console.groq.com/keys",
    keyHint: "Create a key in the Groq console",
    placeholder: "gsk_…",
    defaultModel: "llama-3.3-70b-versatile",
    chatUrl: "https://api.groq.com/openai/v1/chat/completions",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", hint: "Recommended" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B", hint: "Fastest" },
      { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", hint: "Open weights" },
    ],
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    short: "OpenRouter",
    kind: "openai",
    keyUrl: "https://openrouter.ai/keys",
    keyHint: "Create a key to route any model",
    placeholder: "sk-or-…",
    defaultModel: "openai/gpt-4o-mini",
    chatUrl: "https://openrouter.ai/api/v1/chat/completions",
    models: [
      { id: "openai/gpt-4o-mini", label: "GPT-4o mini", hint: "Via OpenAI" },
      { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", hint: "Via Google" },
      { id: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5", hint: "Via Anthropic" },
      { id: "x-ai/grok-4.5", label: "Grok 4.5", hint: "Via xAI" },
    ],
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && value in PROVIDERS;
}

export function providerLabel(id: ProviderId) {
  return PROVIDERS[id].label;
}

export function isAllowedModel(provider: ProviderId, model: string) {
  return PROVIDERS[provider].models.some((m) => m.id === model);
}

export function resolveModel(provider: ProviderId, model: unknown) {
  if (typeof model === "string" && isAllowedModel(provider, model)) return model;
  return PROVIDERS[provider].defaultModel;
}
