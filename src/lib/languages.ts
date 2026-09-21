export const LANGUAGES: { id: string; label: string; hint?: string }[] = [
  { id: "en-US", label: "English", hint: "recommended" },
  { id: "en-GB", label: "English (UK)" },
  { id: "es-ES", label: "Spanish" },
  { id: "fr-FR", label: "French" },
  { id: "de-DE", label: "German" },
  { id: "pt-BR", label: "Portuguese" },
  { id: "zh-CN", label: "Chinese" },
  { id: "ja-JP", label: "Japanese" },
  { id: "ko-KR", label: "Korean" },
  { id: "hi-IN", label: "Hindi" },
  { id: "it-IT", label: "Italian" },
  { id: "nl-NL", label: "Dutch" },
  { id: "pl-PL", label: "Polish" },
  { id: "ar-SA", label: "Arabic" },
];

export function languageLabel(id: string) {
  return LANGUAGES.find((l) => l.id === id)?.label ?? "English";
}
