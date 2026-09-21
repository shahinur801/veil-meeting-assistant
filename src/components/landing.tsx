import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  EyeOff,
  Keyboard,
  Mail,
  Mic,
  MonitorOff,
  Move,
  ScanSearch,
  Sparkles,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductMock } from "@/components/product-mock";

const tools = ["Zoom", "Meet", "Teams", "Webex", "Slack"];

const faqs = [
  {
    q: "Why real-time instead of a regular notetaker?",
    a: "Most notetakers join the call, listen, and email you a summary after. Veil stays on your side of the glass — it transcribes as people talk and answers the question you are about to be asked, while you are still in the room.",
  },
  {
    q: "Who is Veil for?",
    a: "Anyone who has to think on their feet: sales, customer success, recruiting, fundraising, interviews, and internal reviews. If you have ever wished for a private second brain during a call, it is for you.",
  },
  {
    q: "Do I need an API key?",
    a: "No. Assist is live out of the box here. On your own Mac or VM, paste a key from Gemini, OpenAI, Anthropic, xAI, Groq, or OpenRouter in Settings so answers run on your account.",
  },
  {
    q: "How is it undetectable?",
    a: "Veil never joins as a meeting bot, so it never appears on the guest list. Hide the overlay with Cmd/Ctrl + \\ before you share, and share only the Zoom / Meet / Teams window — not the Veil window.",
  },
  {
    q: "What languages and apps are supported?",
    a: "Live transcription uses your browser’s speech engine (Chrome works best) and can run in a dozen languages. Assist follows the conversation in the language you are speaking. It sits beside Zoom, Meet, Teams, Webex, or Slack — it does not need a bot invite.",
  },
  {
    q: "Can I run it on my Mac or a virtual machine?",
    a: "Yes. Open Install for the Mac and VM steps. Same product: overlay, live assist, notes. Chrome or Edge, plus any supported API key on your machine.",
  },
  {
    q: "Is anything stored in the cloud?",
    a: "Notes and transcripts stay in your browser. Assist calls go to the live model — or to the provider whose key you added. Veil never stores the meeting.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Veil home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
            <a href="#undetectable" className="hover:text-foreground">
              Undetectable
            </a>
            <Link to="/install" className="hover:text-foreground">
              Install
            </Link>
            <Link to="/notes" className="hover:text-foreground">
              Archive
            </Link>
          </nav>
          <Button asChild size="sm">
            <Link to="/app">
              Open the app
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:py-20">
          <div className="stagger-in max-w-xl">
            <p className="text-xs font-medium uppercase tracking-kicker text-muted-foreground">
              Undetectable · Live assist
            </p>
            <h1 className="mt-4 font-display text-5xl leading-tight tracking-tight text-foreground sm:text-6xl">
              Meeting intelligence that helps during the call.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Veil takes perfect notes and gives real-time answers — what to
              say, fact checks, who you are talking to, follow-up email —
              without ever joining the meeting.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/app">
                  Open the app
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/install">Install on Mac or VM</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Works instantly. Optionally bring your own key — Gemini, OpenAI,
              Claude, Grok, Groq, or OpenRouter.
            </p>
          </div>
          <ProductMock />
        </section>

        <section className="border-t border-border bg-card/60 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-xs font-medium uppercase tracking-kicker text-muted-foreground">
              Four ways we make meetings better
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                {
                  icon: Sparkles,
                  title: "Answers while they are still talking",
                  body: "Transcript plus an optional look at your screen. What to say, follow-ups, fact check, recap — Cmd/Ctrl + Enter.",
                },
                {
                  icon: Mail,
                  title: "Instant follow-up emails",
                  body: "A sendable email from the call: subject, what was agreed, owners, next step. Copy and go.",
                },
                {
                  icon: Users,
                  title: "Who are you really talking to?",
                  body: "Role, what they care about, leverage, and risk — from names and what they actually said.",
                },
                {
                  icon: ScanSearch,
                  title: "Beautiful meeting notes",
                  body: "Title, decisions, action items, open questions. Saved on this device. Copy as Markdown.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="flex gap-4 rounded-xl bg-background p-5 shadow-[var(--shadow-border)]"
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <item.icon className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how"
          className="border-t border-border py-20"
        >
          <div className="mx-auto grid max-w-6xl gap-16 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-kicker text-muted-foreground">
                During the call
              </p>
              <h2 className="mt-3 font-display text-4xl tracking-tight">
                Veil listens in to the conversation.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                It picks up context in real time — names, numbers, objections —
                so it can help the moment you need it. Hit Assist, or press
                Cmd/Ctrl + Enter. Hide with Cmd/Ctrl + \\.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  {
                    icon: Mic,
                    title: "Live transcription",
                    body: "Browser speech recognition, or a scripted demo if you just want to try the overlay.",
                  },
                  {
                    icon: Keyboard,
                    title: "Instant assist",
                    body: "What should I say, follow-ups, fact check, who is this, recap, notes, email, or ask about the screen.",
                  },
                  {
                    icon: Sparkles,
                    title: "Your model",
                    body: "Assist is live immediately. Paste a Gemini, OpenAI, Claude, Grok, Groq, or OpenRouter key in Settings to use your own account.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="mt-0.5 flex size-9 items-center justify-center rounded-md bg-muted text-foreground">
                      <item.icon className="size-4" />
                    </span>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-call p-3 text-call-foreground shadow-[var(--shadow-lift)]">
              <div className="rounded-xl bg-call-foreground/5 p-5">
                <p className="text-xs uppercase tracking-label text-call-muted">
                  Assist · ⌘↵
                </p>
                <p className="mt-3 text-lg font-medium">What should I say?</p>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-call-foreground/85">
                  <p>
                    <span className="text-call-muted">1.</span> Hold the date —
                    January 6 is possible if we freeze scope today.
                  </p>
                  <p>
                    <span className="text-call-muted">2.</span> Offer a three-year
                    number under the eighty-four thousand cap.
                  </p>
                  <p>
                    <span className="text-call-muted">3.</span> Promise Maya a
                    sandbox tenant this week so security is not the slip.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="notes" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-kicker text-muted-foreground">
              After, if you want
            </p>
            <h2 className="mt-3 font-display text-4xl tracking-tight">
              Instant meeting notes.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The easiest way to get beautiful, shareable notes — title,
              decisions, action items, open questions — generated from the live
              transcript and saved on this device.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                k: "Summary",
                v: "Acme wants 80 extra seats by 6 January. Okta SSO and EU residency are blockers. Budget is $84k.",
              },
              {
                k: "Decisions",
                v: "Freeze scope today. Confirm Okta + EU on Business. Send a short order form, not a 12-page MSA.",
              },
              {
                k: "Actions",
                v: "You: proposal + workshop this week. Maya: security review once the sandbox is live.",
              },
            ].map((card) => (
              <article
                key={card.k}
                className="rounded-xl bg-card p-5 shadow-[var(--shadow-border)]"
              >
                <p className="text-xs font-medium uppercase tracking-label text-muted-foreground">
                  {card.k}
                </p>
                <p className="mt-3 text-sm leading-relaxed">{card.v}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="undetectable"
          className="border-y border-border bg-card/60 py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-4xl tracking-tight">
              Undetectable in every way.
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              A suite of habits so you can use Veil without a trace on the guest
              list, the recording, or the shared screen.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: EyeOff,
                  title: "Doesn't join meetings",
                  body: "Veil never joins as a bot. No extra person on the guest list, no 'notetaker from…' banner.",
                },
                {
                  icon: MonitorOff,
                  title: "Invisible to screen share",
                  body: "Hide the overlay (⌘\\) and share only the meeting window — not Chrome, not the whole desktop.",
                },
                {
                  icon: Move,
                  title: "Follows your eyes",
                  body: "The assist panel is fully movable, so you can park it where you are already looking.",
                },
                {
                  icon: Sparkles,
                  title: "Compatible with every tool",
                  body: "Works beside Zoom, Meet, Teams, Webex, and Slack. No bot invite, no admin approval.",
                },
              ].map((f) => (
                <article
                  key={f.title}
                  className="flex gap-4 rounded-xl bg-background p-5 shadow-[var(--shadow-border)]"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <f.icon className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-medium">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {f.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {tools.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-background px-3 py-1.5 text-sm text-muted-foreground shadow-[var(--shadow-border)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-20 sm:grid-cols-3 sm:px-6">
          {[
            {
              stat: "12+",
              label: "Languages",
              body: "English, Spanish, Chinese, and more — via the browser’s live speech engine.",
            },
            {
              stat: "Live",
              label: "Instant assist",
              body: "Answers during the call. Use the built-in model, or route through your own API key.",
            },
            {
              stat: "On-device",
              label: "Notes archive",
              body: "Transcripts and notes never leave this browser unless you copy them out.",
            },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-5xl tracking-tight">{s.stat}</p>
              <p className="mt-2 font-medium">{s.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </section>

        <section className="border-t border-border py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="font-display text-4xl tracking-tight">
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="mt-8">
              {faqs.map((f) => (
                <AccordionItem key={f.q} value={f.q}>
                  <AccordionTrigger>{f.q}</AccordionTrigger>
                  <AccordionContent>{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="border-t border-border bg-call py-20 text-call-foreground">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
              Meeting AI that helps during the call, not after.
            </h2>
            <p className="mt-4 text-call-muted">
              Try Veil on a demo call, or install it on your Mac or a VM.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/app">
                  Open the app
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="call">
                <Link to="/install">Install guide</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6">
          <Logo />
          <p>Bring your own API key, or use live assist as-is. Open source under MIT.</p>
          <a
            href="https://github.com/shahinur801/veil-meeting-assistant"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
