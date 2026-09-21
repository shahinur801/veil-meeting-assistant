import type { ProviderId } from "./providers";
import type { SessionMode } from "./settings";

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

export const ACTION_LABELS: Record<AssistAction, string> = {
  say: "What should I say?",
  followups: "Follow-ups",
  recap: "Recap",
  notes: "Notes",
  ask: "Ask",
  factcheck: "Fact check",
  who: "Who is this?",
  email: "Email",
  screen: "Screen",
};

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
  provider: ProviderId;
  apiKey: string;
  model: string;
  action: AssistAction;
  question?: string;
  transcript: string;
  image?: string;
  outputLang?: string;
  sessionMode?: SessionMode;
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

export type HistoryItem = {
  id: string;
  action: AssistAction;
  question?: string;
  text: string;
};
