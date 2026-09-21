import type { ProviderId } from "./providers";

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
