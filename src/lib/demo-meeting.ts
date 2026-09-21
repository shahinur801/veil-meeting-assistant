import type { AssistAction, MeetingNotes, TranscriptLine } from "./types";

export const DEMO_TITLE = "Acme × Northwind — Q4 expansion";

export const DEMO_PARTICIPANTS = [
  { name: "You", role: "Account lead", initials: "YO", tone: "bg-primary" },
  { name: "Jordan Hale", role: "VP Sales, Acme", initials: "JH", tone: "bg-call" },
  { name: "Maya Chen", role: "IT, Acme", initials: "MC", tone: "bg-muted-foreground" },
  { name: "Priya Shah", role: "Finance, Acme", initials: "PS", tone: "bg-foreground" },
] as const;

type Cue = {
  delayMs: number;
  speaker: string;
  text: string;
};

export const DEMO_CUES: Cue[] = [
  {
    delayMs: 600,
    speaker: "Jordan Hale",
    text: "Thanks for jumping on. We want to expand from 40 to 120 seats in January — same workspace, just a lot more people.",
  },
  {
    delayMs: 4200,
    speaker: "You",
    text: "We've been scoping that. Two things I want to lock today: timeline, and whether SSO is a must-have for the January cutover.",
  },
  {
    delayMs: 8600,
    speaker: "Maya Chen",
    text: "SSO is a hard requirement. We use Okta. Also data residency — a third of the new seats are in Frankfurt, so EU region has to be real, not a checkbox.",
  },
  {
    delayMs: 13200,
    speaker: "Priya Shah",
    text: "Budget is approved up to eighty-four thousand annually. We'd rather a three-year term if the unit price moves. Procurement needs a redline by Friday.",
  },
  {
    delayMs: 17800,
    speaker: "Jordan Hale",
    text: "If we slip past January sixth we miss onboarding week and I'm stuck explaining it to the board. Can you actually staff implementation that fast?",
  },
  {
    delayMs: 22400,
    speaker: "You",
    text: "January sixth is tight but doable if we freeze scope today. I'll confirm Okta + EU residency on Business, and come back with a three-year number.",
  },
  {
    delayMs: 27200,
    speaker: "Maya Chen",
    text: "We also need a sandbox tenant for the security review. Last vendor took three weeks. I cannot sign off without it.",
  },
  {
    delayMs: 31800,
    speaker: "Priya Shah",
    text: "And please don't send a twelve-page MSA. Legal will sit on it. A short order form plus DPA is what actually gets signed here.",
  },
  {
    delayMs: 36400,
    speaker: "Jordan Hale",
    text: "So — can you get us a commercial proposal and a technical workshop on the calendar this week? That's the only way this stays on the January train.",
  },
];

export function cuesToLines(cues: Cue[], upToMs: number): TranscriptLine[] {
  return cues
    .filter((c) => c.delayMs <= upToMs)
    .map((c, i) => ({
      id: `demo-${i}`,
      speaker: c.speaker,
      text: c.text,
      atMs: c.delayMs,
    }));
}

export function formatTranscript(lines: TranscriptLine[]) {
  return lines
    .filter((l) => l.text.trim() && !l.interim)
    .map((l) => `${l.speaker}: ${l.text}`)
    .join("\n");
}

export const DEMO_NOTES: MeetingNotes = {
  title: "Acme × Northwind — Q4 expansion",
  summary:
    "Acme wants to grow from 40 to 120 seats by 6 January in the same workspace. Okta SSO and real EU residency are hard requirements. Budget is $84k/year with a preference for a three-year term. Next: freeze scope, send a short order form + DPA, stand up a sandbox, and book a workshop this week.",
  attendees: ["You", "Jordan Hale (VP Sales)", "Maya Chen (IT)", "Priya Shah (Finance)"],
  keyPoints: [
    "80 extra seats by 6 January — board-visible onboarding week.",
    "Okta SSO is day-one, not phase two.",
    "A third of new seats sit in Frankfurt; EU residency must be real.",
    "Budget ceiling $84k annually; 3-year term preferred if unit price moves.",
    "Legal wants a short order form + DPA, not a 12-page MSA.",
    "Sandbox tenant required before Maya can sign off.",
  ],
  decisions: [
    "Freeze scope today to keep January 6.",
    "Confirm Okta + EU on Business.",
    "Send commercial proposal and book a technical workshop this week.",
  ],
  actionItems: [
    { owner: "You", task: "Confirm Okta SSO and EU residency on Business", due: "today" },
    { owner: "You", task: "Send 1- and 3-year proposal + short order form + DPA", due: "Friday" },
    { owner: "You", task: "Stand up a sandbox tenant for security review", due: "this week" },
    { owner: "Jordan Hale", task: "Hold January 6 onboarding week if scope freezes", due: "today" },
  ],
  openQuestions: [
    "Can implementation be staffed to hit January 6 if scope freezes today?",
    "What 3-year unit price can Northwind offer under the $84k cap?",
  ],
};

export const DEMO_ASSIST: Record<
  Exclude<AssistAction, "ask">,
  { text: string; notes?: MeetingNotes }
> = {
  say: {
    text: `1. **Hold the date**  
"January 6 is holdable if we freeze scope today — I'll confirm Okta and EU residency on Business before end of day."

2. **Move the commercial**  
"I can come back with a three-year number under the eighty-four thousand cap, plus a short order form Legal will actually sign."

3. **Unblock Maya**  
"We'll stand up a sandbox tenant this week so security review isn't the thing that slips onboarding."`,
  },
  followups: {
    text: `1. Which Okta features must be live on day one — SCIM provisioning, or just SAML SSO?
2. For EU residency, do Frankfurt seats need a separate tenant, or is region-pinning inside one workspace enough?
3. If we miss January 6, is there a second onboarding window or does the board date slip a full quarter?
4. Who besides Legal has to countersign the order form so Friday is a real deadline?`,
  },
  recap: {
    text: `**Goal** — Expand Acme from 40 to 120 seats by 6 January without slipping onboarding week.

**Agreed so far**
- SSO (Okta) and true EU data residency are non-negotiable.
- Budget approved at $84k/year; 3-year term is preferred.
- A short order form + DPA beats a long MSA.

**Tensions**
- January 6 is a board-visible date; implementation staffing is the open risk.
- Security review needs a sandbox — last vendor took three weeks.

**Still open**
- Commercial proposal (1- and 3-year)
- Technical workshop this week
- Friday redline package`,
  },
  notes: {
    text: JSON.stringify(DEMO_NOTES, null, 2),
    notes: DEMO_NOTES,
  },
  factcheck: {
    text: `**Supported**
- Seat expansion 40 → 120 in January — Jordan said it.
- Okta SSO is a hard requirement — Maya.
- ~1/3 of new seats in Frankfurt — Maya.
- $84k annual budget ceiling — Priya.
- January 6 onboarding week is the board date — Jordan.

**Unverified — do not treat as closed**
- That Business tier actually includes Okta + EU residency (you offered to confirm).
- That implementation can be staffed by January 6 (Jordan asked; you have not proven it).
- That a sandbox can land this week vs. the last vendor's three weeks.

**Contradicted / risky**
- Nothing in the transcript contradicts the $84k cap. Do not quote a higher number.`,
  },
  who: {
    text: `**Jordan Hale — VP Sales, Acme**  
Cares about January 6 and the board. Leverage: he wants this deal on the train. Risk: if you slip the date, you become the story he has to explain.

**Maya Chen — IT**  
Cares about Okta, real EU residency, and a sandbox for security review. Leverage: she can block sign-off. Risk: last vendor burned her on sandbox timing.

**Priya Shah — Finance**  
Cares about the $84k ceiling, a 3-year unit price, and a short order form Legal will actually sign. Leverage: budget is approved. Risk: a long MSA dies in procurement.

**How to play it**  
Freeze scope for Jordan, unblock Maya with a sandbox this week, and send Priya a short commercial pack under $84k.`,
  },
  email: {
    text: `Subject: Acme expansion — proposal, sandbox, and workshop this week

Hi Jordan, Maya, and Priya —

Thank you for the time today. As discussed, we are lining up the 40 → 120 seat expansion for a 6 January cutover, with Okta SSO and real EU residency (Frankfurt seats) in scope.

What we will send this week:
- Commercial proposal (1-year and 3-year) at or under the $84k annual cap
- Short order form + DPA for Friday's redline (not a long MSA)
- Sandbox tenant for Maya's security review
- Time options for a technical workshop

I will confirm Okta + EU on Business today so we can freeze scope.

Best,`,
  },
  screen: {
    text: `On screen: four-up call with you, Jordan Hale (VP Sales), Maya Chen (IT), and Priya Shah (Finance). Overlay is on your side only.

What to do next: freeze January 6 with Jordan, promise Maya a sandbox this week, and tell Priya the pack will be a short order form under $84k — not a 12-page MSA.`,
  },
};

export function demoAsk(question: string) {
  const q = question.toLowerCase();
  if (q.includes("price") || q.includes("budget") || q.includes("84")) {
    return "Priya approved $84k per year and would rather a three-year term if the unit price improves. That is the ceiling, not a starting offer — anything above it will bounce in procurement.";
  }
  if (q.includes("sso") || q.includes("okta")) {
    return "Maya made Okta SSO a hard requirement for the January cutover. Treat it as day-one scope, not a phase-two extra, and confirm SCIM vs SAML before the workshop.";
  }
  if (q.includes("date") || q.includes("january") || q.includes("timeline")) {
    return "Jordan's hard date is January 6. Missing it means they miss onboarding week and he has to explain it to the board. Scope has to freeze today for that date to stay real.";
  }
  return "From the call: 80 extra seats by January 6, Okta SSO + EU residency as blockers, $84k annual cap, sandbox for security, and a short order form by Friday. Ask me about pricing, SSO, or the date for a tighter read.";
}
