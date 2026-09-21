export type AssistAction =
  | "say"
  | "followups"
  | "recap"
  | "notes"
  | "ask"
  | "factcheck"
  | "who"
  | "email"
  | "screen";

export type GeminiModel =
  | "gemini-2.5-flash"
  | "gemini-2.0-flash"
  | "gemini-2.5-pro";

export const GEMINI_MODELS: { id: GeminiModel; label: string; hint: string }[] =
  [
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", hint: "Fast, recommended" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", hint: "Stable fallback" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", hint: "Deeper reasoning" },
  ];

export const ASSIST_ACTIONS: AssistAction[] = [
  "say",
  "followups",
  "recap",
  "notes",
  "ask",
  "factcheck",
  "who",
  "email",
  "screen",
];

export type TranscriptLine = {
  id: string;
  speaker: string;
  text: string;
  atMs: number;
  interim?: boolean;
};

export type ActionItem = {
  owner: string;
  task: string;
  due?: string;
};

export type MeetingNotes = {
  title: string;
  summary: string;
  attendees: string[];
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  openQuestions: string[];
};

export type SavedMeeting = {
  id: string;
  title: string;
  startedAt: number;
  durationSec: number;
  transcript: TranscriptLine[];
  notes: MeetingNotes | null;
  notesMarkdown: string;
};

export type AssistRequest = {
  apiKey: string;
  model: GeminiModel;
  action: AssistAction;
  question?: string;
  transcript: string;
  image?: string;
};

export type AssistOk = {
  ok: true;
  text: string;
  notes?: MeetingNotes;
};

export type AssistErr = {
  ok: false;
  error: string;
  code?: "key" | "quota" | "model" | "network";
};

export type AssistResult = AssistOk | AssistErr;
