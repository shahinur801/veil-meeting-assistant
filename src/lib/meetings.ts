import type { SavedMeeting } from "./types";

const KEY = "veil.meetings.v1";

function read(): SavedMeeting[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedMeeting[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(meetings: SavedMeeting[]) {
  localStorage.setItem(KEY, JSON.stringify(meetings.slice(0, 40)));
}

export function listMeetings(): SavedMeeting[] {
  return read().sort((a, b) => b.startedAt - a.startedAt);
}

export function getMeeting(id: string): SavedMeeting | undefined {
  return read().find((m) => m.id === id);
}

export function saveMeeting(meeting: SavedMeeting) {
  const all = read().filter((m) => m.id !== meeting.id);
  all.unshift(meeting);
  write(all);
}

export function deleteMeeting(id: string) {
  write(read().filter((m) => m.id !== id));
}

export function notesToMarkdown(meeting: SavedMeeting) {
  if (meeting.notesMarkdown) return meeting.notesMarkdown;
  const n = meeting.notes;
  if (!n) return meeting.title;
  const items = n.actionItems
    .map((a) => `- [${a.owner}] ${a.task}${a.due ? ` (${a.due})` : ""}`)
    .join("\n");
  return `# ${n.title}

${n.summary}

## Attendees
${n.attendees.map((a) => `- ${a}`).join("\n")}

## Key points
${n.keyPoints.map((a) => `- ${a}`).join("\n")}

## Decisions
${n.decisions.map((a) => `- ${a}`).join("\n")}

## Action items
${items}

## Open questions
${n.openQuestions.map((a) => `- ${a}`).join("\n")}
`;
}
