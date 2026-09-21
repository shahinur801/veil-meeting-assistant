import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  GripHorizontal,
  Keyboard,
  Loader2,
  Mic,
  MicOff,
  Monitor,
  Play,
  Settings2,
  Sparkles,
  Square,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/components/settings-dialog";
import { captureScreenJpeg } from "@/lib/capture";
import { RichText } from "@/lib/rich-text";
import {
  DEMO_ASSIST,
  DEMO_CUES,
  DEMO_PARTICIPANTS,
  DEMO_TITLE,
  cuesToLines,
  demoAsk,
  formatTranscript,
} from "@/lib/demo-meeting";
import { runAssist } from "@/lib/gemini";
import { saveMeeting } from "@/lib/meetings";
import { loadSettings, saveSettings, type Settings } from "@/lib/settings";
import { getSpeechRecognition, speechSupported, type SpeechRecognitionLike } from "@/lib/speech";
import type { AssistAction, MeetingNotes, TranscriptLine } from "@/lib/types";
import { cn, formatDuration, uid } from "@/lib/utils";

type Mode = "idle" | "demo" | "mic";
type OverlayTab = "assist" | "transcript";

export function SessionApp() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>({
    apiKey: "",
    model: "gemini-2.5-flash",
    lang: "en-US",
  });
  const [speechOk, setSpeechOk] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [hidden, setHidden] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [interim, setInterim] = useState("");
  const [tab, setTab] = useState<OverlayTab>("assist");
  const [action, setAction] = useState<AssistAction | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState("");
  const [camera, setCamera] = useState<MediaStream | null>(null);
  const [ending, setEnding] = useState(false);
  const startedAt = useRef<number | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const keepListening = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const runActionRef = useRef<(next: AssistAction, image?: string) => Promise<void>>(
    async () => {},
  );

  const live = mode !== "idle";

  useEffect(() => {
    setSettings(loadSettings());
    setSpeechOk(speechSupported());
  }, []);

  useEffect(() => {
    if (!live || !startedAt.current) return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - (startedAt.current ?? Date.now())) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [live]);

  useEffect(() => {
    if (mode !== "demo" || !startedAt.current) return;
    const origin = startedAt.current;
    const id = window.setInterval(() => {
      const t = Date.now() - origin;
      setLines(cuesToLines(DEMO_CUES, t));
      if (t > DEMO_CUES[DEMO_CUES.length - 1].delayMs + 4000) {
        window.clearInterval(id);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [mode]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "\\" || e.code === "Backslash")) {
        e.preventDefault();
        if (mode === "idle") return;
        setHidden((h) => !h);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (mode === "idle") return;
        setHidden(false);
        void runActionRef.current(question.trim() ? "ask" : "say");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, mode]);

  useEffect(() => {
    return () => {
      keepListening.current = false;
      recRef.current?.abort();
      camera?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (videoRef.current && camera) {
      videoRef.current.srcObject = camera;
    }
  }, [camera]);

  const startDemo = () => {
    startedAt.current = Date.now();
    setElapsed(0);
    setLines([]);
    setAnswer("");
    setAction(null);
    setHidden(false);
    setMode("demo");
  };

  const startMic = async () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      toast.error("Live transcription needs Chrome or Edge.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "user" },
      });
      setCamera(stream);
    } catch {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        toast.error("Microphone permission is required to listen.");
        return;
      }
    }

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = settings.lang;
    rec.onresult = (ev) => {
      let finalChunk = "";
      let liveChunk = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const result = ev.results[i];
        if (result.isFinal) finalChunk += result[0].transcript;
        else liveChunk += result[0].transcript;
      }
      if (finalChunk.trim()) {
        setLines((prev) => [
          ...prev,
          {
            id: uid(),
            speaker: "You",
            text: finalChunk.trim(),
            atMs: Date.now() - (startedAt.current ?? Date.now()),
          },
        ]);
      }
      setInterim(liveChunk.trim());
    };
    rec.onerror = (ev) => {
      if (ev.error === "not-allowed") {
        toast.error("Microphone blocked. Allow it and try again.");
      }
    };
    rec.onend = () => {
      if (keepListening.current) {
        try {
          rec.start();
        } catch {
          /* already started */
        }
      }
    };
    keepListening.current = true;
    recRef.current = rec;
    rec.start();
    startedAt.current = Date.now();
    setElapsed(0);
    setLines([]);
    setAnswer("");
    setAction(null);
    setHidden(false);
    setMode("mic");
  };

  const stopListening = () => {
    keepListening.current = false;
    recRef.current?.stop();
    recRef.current = null;
    camera?.getTracks().forEach((t) => t.stop());
    setCamera(null);
    setInterim("");
  };

  const transcriptText = useMemo(
    () => formatTranscript(lines),
    [lines],
  );

  const runAction = useCallback(
    async (next: AssistAction, image?: string) => {
      if (!live) return;
      setTab("assist");
      setBusy(true);
      setAction(next);
      setAnswer("");
      setHidden(false);
      try {
        const result = await runAssist({
          data: {
            apiKey: settings.apiKey,
            model: settings.model,
            action: next,
            question: next === "ask" || next === "screen" ? question : undefined,
            transcript: transcriptText,
            image,
          },
        });
        if (!result.ok) {
          if (mode === "demo") {
            const canned =
              next === "ask"
                ? { text: demoAsk(question) }
                : DEMO_ASSIST[next];
            setAnswer(canned.text);
            toast.message(result.error);
            return;
          }
          toast.error(result.error);
          if (result.code === "key") setSettingsOpen(true);
          return;
        }
        setAnswer(result.text);
      } catch (err) {
        if (mode === "demo") {
          const canned =
            next === "ask"
              ? { text: demoAsk(question) }
              : DEMO_ASSIST[next];
          setAnswer(canned.text);
          return;
        }
        toast.error(err instanceof Error ? err.message : "Assist failed.");
      } finally {
        setBusy(false);
      }
    },
    [live, mode, question, settings, transcriptText],
  );

  runActionRef.current = runAction;

  async function captureThenAssist() {
    try {
      const image = await captureScreenJpeg();
      await runAction("screen", image);
    } catch (err) {
      if (mode === "demo") {
        setAction("screen");
        setAnswer(DEMO_ASSIST.screen.text);
        setTab("assist");
        return;
      }
      const msg = err instanceof Error ? err.message : "Screen capture cancelled.";
      if (msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("cancel")) {
        toast.message("Screen capture cancelled.");
        return;
      }
      toast.error(msg);
    }
  }

  async function endMeeting() {
    if (!live) return;
    setEnding(true);
    stopListening();
    let notes: MeetingNotes | null = null;
    let notesMarkdown = "";
    try {
      const result = await runAssist({
        data: {
          apiKey: settings.apiKey,
          model: settings.model,
          action: "notes",
          transcript: transcriptText,
        },
      });
      if (result.ok) {
        notes = result.notes ?? null;
        notesMarkdown = result.text;
      } else if (mode === "demo") {
        notes = DEMO_ASSIST.notes.notes ?? null;
        notesMarkdown = DEMO_ASSIST.notes.text;
      }
    } catch {
      if (mode === "demo") {
        notes = DEMO_ASSIST.notes.notes ?? null;
        notesMarkdown = DEMO_ASSIST.notes.text;
      }
    }
    const id = uid();
    const title =
      notes?.title ||
      (mode === "demo" ? DEMO_TITLE : `Meeting ${new Date().toLocaleString()}`);
    saveMeeting({
      id,
      title,
      startedAt: startedAt.current ?? Date.now(),
      durationSec: elapsed,
      transcript: lines,
      notes,
      notesMarkdown,
    });
    setEnding(false);
    setMode("idle");
    toast.success("Notes saved on this device.");
    void navigate({ to: "/notes/$id", params: { id } });
  }

  return (
    <div className="relative min-h-dvh bg-call text-call-foreground">
      <header className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex size-11 items-center justify-center rounded-md text-call-foreground/80 hover:bg-call-foreground/8 hover:text-call-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <Logo className="text-call-foreground" />
        </div>
        {live ? (
          <div className="flex items-center gap-2 rounded-full bg-call-foreground/8 px-3 py-1.5 text-sm">
            <span className="size-2 animate-[veil-pulse_1.4s_ease-in-out_infinite] rounded-full bg-destructive" />
            <span className="font-mono tabular-nums">{formatDuration(elapsed)}</span>
            <span className="hidden text-call-muted sm:inline">
              {mode === "demo" ? "Demo" : "Listening"}
            </span>
          </div>
        ) : (
          <span className="text-sm text-call-muted">Ready</span>
        )}
        <div className="flex items-center gap-1">
          {live ? (
            <>
              <Button
                variant="call"
                size="icon-sm"
                onClick={() => setHidden((h) => !h)}
                aria-label={hidden ? "Show overlay" : "Hide overlay"}
              >
                {hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </Button>
              <Button
                variant="call"
                size="sm"
                onClick={() => void endMeeting()}
                disabled={ending}
              >
                {ending ? <Loader2 className="animate-spin" /> : <Square className="size-3 fill-current" />}
                End
              </Button>
            </>
          ) : null}
          <Button
            variant="call"
            size="icon-sm"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
          >
            <Settings2 className="size-4" />
          </Button>
        </div>
      </header>

      <CallGrid camera={camera} videoRef={videoRef} />

      {mode === "idle" ? (
        <IdleGate
          hasKey={Boolean(settings.apiKey)}
          speechOk={speechOk}
          onDemo={startDemo}
          onMic={() => void startMic()}
          onSettings={() => setSettingsOpen(true)}
        />
      ) : null}

      {live && !hidden ? (
        <AssistOverlay
          tab={tab}
          onTab={setTab}
          lines={lines}
          interim={interim}
          busy={busy}
          action={action}
          answer={answer}
          question={question}
          onQuestion={setQuestion}
          onAssist={(a) => {
            if (a === "screen") void captureThenAssist();
            else void runAction(a);
          }}
          hasKey={Boolean(settings.apiKey)}
        />
      ) : null}

      {live && hidden ? (
        <button
          type="button"
          onClick={() => setHidden(false)}
          className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-card px-4 py-2 text-sm text-foreground shadow-[var(--shadow-lift)]"
        >
          <Eye className="size-4" />
          Show Veil
          <span className="hidden text-muted-foreground sm:inline">⌘\\</span>
        </button>
      ) : null}

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={(next) => {
          setSettings(next);
          saveSettings(next);
        }}
      />
    </div>
  );
}

function CallGrid({
  camera,
  videoRef,
}: {
  camera: MediaStream | null;
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 px-3 pb-36 sm:gap-3 sm:px-5 lg:grid-cols-4 lg:pb-8">
      {DEMO_PARTICIPANTS.map((p, i) => (
        <div
          key={p.name}
          className="relative aspect-tile overflow-hidden rounded-xl bg-call-foreground/8 lg:aspect-video"
        >
          {i === 0 && camera ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 size-full object-cover -scale-x-100"
            />
          ) : (
            <>
              <div
                className={cn(
                  "absolute inset-0",
                  i === 0 && "bg-primary/25",
                  i === 1 && "bg-call-foreground/10",
                  i === 2 && "bg-muted-foreground/25",
                  i === 3 && "bg-primary/15",
                )}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-call-foreground/12 text-lg font-medium">
                  {p.initials}
                </span>
              </div>
            </>
          )}
          <div className="absolute bottom-2 left-2 rounded-sm bg-call/70 px-2 py-0.5 text-xs">
            {p.name}
            <span className="hidden text-call-muted sm:inline"> · {p.role}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function IdleGate({
  hasKey,
  speechOk,
  onDemo,
  onMic,
  onSettings,
}: {
  hasKey: boolean;
  speechOk: boolean;
  onDemo: () => void;
  onMic: () => void;
  onSettings: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-call/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 text-foreground shadow-[var(--shadow-lift)]">
        <p className="text-xs font-medium uppercase tracking-kicker text-muted-foreground">
          Start a session
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">
          Invisible to them. Useful to you.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Run a scripted Acme expansion call, or listen with your microphone.
          Assist is live
          {hasKey ? " on your Gemini key." : " — add a Gemini key in Settings if you want to use Google."}
        </p>
        <div className="mt-6 grid gap-2">
          <Button size="lg" onClick={onDemo}>
            <Play />
            Start demo call
          </Button>
          <Button size="lg" variant="outline" onClick={onMic} disabled={!speechOk}>
            {speechOk ? <Mic /> : <MicOff />}
            {speechOk ? "Listen with microphone" : "Microphone not supported"}
          </Button>
          <Button size="lg" variant="ghost" onClick={onSettings}>
            <Settings2 />
            {hasKey ? "Gemini settings" : "Optional Gemini key"}
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Keyboard className="mr-1 inline size-3" />
          ⌘↵ Assist · ⌘\\ Hide overlay
        </p>
      </div>
    </div>
  );
}

function AssistOverlay({
  tab,
  onTab,
  lines,
  interim,
  busy,
  action,
  answer,
  question,
  onQuestion,
  onAssist,
  hasKey,
}: {
  tab: OverlayTab;
  onTab: (t: OverlayTab) => void;
  lines: TranscriptLine[];
  interim: string;
  busy: boolean;
  action: AssistAction | null;
  answer: string;
  question: string;
  onQuestion: (v: string) => void;
  onAssist: (a: AssistAction) => void;
  hasKey: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    if (window.matchMedia("(max-width: 640px)").matches) return;
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    drag.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const x = Math.max(8, e.clientX - drag.current.dx);
    const y = Math.max(8, e.clientY - drag.current.dy);
    setPos({ x, y });
  }
  function onPointerUp() {
    drag.current = null;
  }

  const chips: { id: AssistAction; label: string }[] = [
    { id: "say", label: "What should I say?" },
    { id: "followups", label: "Follow-ups" },
    { id: "factcheck", label: "Fact check" },
    { id: "who", label: "Who is this?" },
    { id: "recap", label: "Recap" },
    { id: "notes", label: "Notes" },
    { id: "email", label: "Email" },
    { id: "screen", label: "Screen" },
  ];

  return (
    <div
      ref={panelRef}
      style={
        pos
          ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
          : undefined
      }
      className={cn(
        "fixed z-30 flex max-h-[min(72dvh,38rem)] w-[min(100%-1.5rem,24rem)] flex-col rounded-xl bg-card text-foreground shadow-[var(--shadow-lift)]",
        pos ? "" : "bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0",
      )}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="flex cursor-grab items-center justify-between gap-2 border-b border-border px-3 py-2 active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-label text-muted-foreground">
          <GripHorizontal className="size-3.5" />
          Assist
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs tracking-normal text-muted-foreground">
            {hasKey ? "Gemini" : "Live"}
          </span>
        </div>
        <div className="flex rounded-md bg-muted p-0.5">
          <button
            type="button"
            onClick={() => onTab("assist")}
            className={cn(
              "rounded-sm px-2 py-1 text-xs",
              tab === "assist" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            Assist
          </button>
          <button
            type="button"
            onClick={() => onTab("transcript")}
            className={cn(
              "rounded-sm px-2 py-1 text-xs",
              tab === "transcript" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            Transcript
          </button>
        </div>
      </div>

      {tab === "assist" ? (
        <>
          <div className="flex flex-wrap gap-1.5 px-3 pt-3">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onAssist(c.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs",
                  action === c.id
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {c.id === "screen" ? <Monitor className="size-3" /> : null}
                {c.label}
              </button>
            ))}
          </div>
          <div className="min-h-36 flex-1 overflow-y-auto px-4 py-3">
            {busy ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Thinking…
              </p>
            ) : answer ? (
              <div>
                <RichText text={answer} />
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={async () => {
                    await navigator.clipboard.writeText(answer);
                    toast.success("Copied.");
                  }}
                >
                  <Copy className="size-3" />
                  Copy
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ask about the conversation or the screen. ⌘↵ Assist · ⌘\\ hide.
              </p>
            )}
          </div>
          <form
            className="flex gap-2 border-t border-border p-2"
            onSubmit={(e) => {
              e.preventDefault();
              onAssist("ask");
            }}
          >
            <input
              value={question}
              onChange={(e) => onQuestion(e.target.value)}
              placeholder="Ask about the conversation"
              className="h-10 flex-1 rounded-md bg-muted px-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" size="sm" disabled={busy}>
              <Sparkles />
              Assist
            </Button>
          </form>
        </>
      ) : (
        <TranscriptPane lines={lines} interim={interim} />
      )}
    </div>
  );
}

function TranscriptPane({
  lines,
  interim,
}: {
  lines: TranscriptLine[];
  interim: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, interim]);
  return (
    <div className="min-h-48 flex-1 space-y-3 overflow-y-auto px-4 py-3">
      {lines.length === 0 && !interim ? (
        <p className="text-sm text-muted-foreground">Waiting for speech…</p>
      ) : null}
      {lines.map((l) => (
        <div key={l.id}>
          <p className="text-xs font-medium text-foreground">{l.speaker}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{l.text}</p>
        </div>
      ))}
      {interim ? (
        <div>
          <p className="text-xs font-medium text-foreground">You</p>
          <p className="text-sm italic text-muted-foreground">{interim}</p>
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}
