import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  Copy,
  CornerDownLeft,
  Eye,
  EyeOff,
  ImageIcon,
  LayoutGrid,
  Loader2,
  Slash,
} from "lucide-react";
import { RichText } from "@/lib/rich-text";
import { ACTION_LABELS, type AssistAction, type HistoryItem, type TranscriptLine } from "@/lib/types";
import { cn } from "@/lib/utils";

const COMMANDS: { id: AssistAction; label: string }[] = [
  { id: "say", label: "What should I say?" },
  { id: "followups", label: "Follow-ups" },
  { id: "factcheck", label: "Fact check" },
  { id: "who", label: "Who is this?" },
  { id: "recap", label: "Recap" },
  { id: "notes", label: "Notes" },
  { id: "email", label: "Email" },
  { id: "screen", label: "Capture screen" },
];

type Panel = "answer" | "commands" | "history" | "transcript" | null;

export function CommandBar({
  live,
  listening,
  busy,
  action,
  answer,
  question,
  onQuestion,
  onAssist,
  onHide,
  history,
  onOpenHistory,
  lines,
  interim,
}: {
  live: boolean;
  listening: boolean;
  busy: boolean;
  action: AssistAction | null;
  answer: string;
  question: string;
  onQuestion: (v: string) => void;
  onAssist: (a: AssistAction) => void;
  onHide: () => void;
  history: HistoryItem[];
  onOpenHistory: (item: HistoryItem) => void;
  lines: TranscriptLine[];
  interim: string;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    if (busy || answer) setPanel("answer");
  }, [busy, answer]);

  function toggle(next: Panel) {
    setPanel((cur) => (cur === next ? null : next));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (window.matchMedia("(max-width: 640px)").matches) return;
    if ((e.target as HTMLElement).closest("input,button,a,textarea")) return;
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    drag.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setPos({
      x: Math.max(8, e.clientX - drag.current.dx),
      y: Math.max(8, e.clientY - drag.current.dy),
    });
  }
  function onPointerUp() {
    drag.current = null;
  }

  const showSheet = panel !== null;

  return (
    <div
      ref={rootRef}
      style={
        pos
          ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto", transform: "none" }
          : undefined
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={cn(
        "fixed z-30 w-[min(100%-1.25rem,42rem)]",
        pos ? "" : "bottom-5 left-1/2 -translate-x-1/2",
      )}
    >
      {showSheet ? (
        <div className="glass-panel mb-2 max-h-[min(52dvh,28rem)] overflow-hidden rounded-[28px]">
          <div className="max-h-[min(52dvh,28rem)] overflow-y-auto px-5 py-4">
            {panel === "commands" ? (
              <div className="grid grid-cols-2 gap-2">
                {COMMANDS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onAssist(c.id);
                      setPanel("answer");
                    }}
                    className={cn(
                      "rounded-2xl bg-white/8 px-3 py-3 text-left text-sm hover:bg-white/12",
                      action === c.id && "bg-white/16",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            ) : null}

            {panel === "history" ? (
              history.length === 0 ? (
                <p className="text-sm text-glass-muted">No answers yet this session.</p>
              ) : (
                <ul className="space-y-2">
                  {history.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="w-full rounded-2xl bg-white/8 px-3 py-3 text-left hover:bg-white/12"
                        onClick={() => {
                          onOpenHistory(item);
                          setPanel("answer");
                        }}
                      >
                        <p className="text-xs text-glass-muted">{ACTION_LABELS[item.action]}</p>
                        <p className="mt-1 line-clamp-2 text-sm">
                          {item.question || item.text}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : null}

            {panel === "transcript" ? (
              <TranscriptPane lines={lines} interim={interim} />
            ) : null}

            {panel === "answer" ? (
              busy ? (
                <p className="flex items-center gap-2 text-sm text-glass-muted">
                  <Loader2 className="size-4 animate-spin" />
                  Thinking…
                </p>
              ) : answer ? (
                <div>
                  {action ? (
                    <p className="mb-2 text-xs font-medium uppercase tracking-label text-glass-muted">
                      {ACTION_LABELS[action]}
                    </p>
                  ) : null}
                  <RichText text={answer} className="text-glass-fg" />
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-glass-muted hover:text-glass-fg"
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
                <p className="text-sm text-glass-muted">
                  Ask anything about the call, or open commands.
                </p>
              )
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="glass-panel overflow-hidden rounded-[28px]">
        <form
          className="flex items-center gap-2 px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!live) return;
            onAssist(question.trim() ? "ask" : "say");
            setPanel("answer");
          }}
        >
          <input
            value={question}
            onChange={(e) => onQuestion(e.target.value)}
            placeholder="Ask or search anything"
            disabled={!live}
            className="h-11 flex-1 bg-transparent text-[15px] text-glass-fg outline-none placeholder:text-glass-muted disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!live || busy}
            aria-label="Ask"
            className="flex size-10 items-center justify-center rounded-xl bg-white/12 text-glass-fg hover:bg-white/18 disabled:opacity-40"
          >
            <CornerDownLeft className="size-4" />
          </button>
        </form>

        <div className="glass-deep flex items-center gap-0.5 px-2 py-2">
          <IconBtn label="Hide overlay" onClick={onHide}>
            <span className="relative flex size-4 items-center justify-center">
              <Slash className="size-4" />
            </span>
          </IconBtn>
          <IconBtn
            label="Capture screen"
            onClick={() => {
              if (!live) return;
              onAssist("screen");
              setPanel("answer");
            }}
          >
            <ImageIcon className="size-4" />
          </IconBtn>
          <IconBtn
            label={panel === "transcript" ? "Hide transcript" : "Show transcript"}
            onClick={() => toggle("transcript")}
          >
            {panel === "transcript" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </IconBtn>
          <IconBtn label="Commands" onClick={() => toggle("commands")}>
            <LayoutGrid className="size-4" />
          </IconBtn>

          <span className="mx-2 h-5 w-px bg-white/15" />

          <span className="flex h-8 items-center px-1" aria-hidden="true">
            <Waveform active={listening || live} />
          </span>

          <button
            type="button"
            onClick={() => toggle("history")}
            className="ml-auto flex h-10 items-center gap-1 rounded-xl px-3 text-sm text-glass-fg hover:bg-white/8"
          >
            History
            <ChevronDown
              className={cn("size-4 transition-transform", panel === "history" && "rotate-180")}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-10 items-center justify-center rounded-xl text-glass-fg hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function Waveform({ active }: { active: boolean }) {
  return (
    <span className="flex h-4 items-end gap-0.5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="w-0.5 origin-bottom rounded-full bg-white/85"
          style={{
            height: "14px",
            animation: active ? "veil-wave 1s ease-in-out infinite" : undefined,
            animationDelay: `${i * 0.1}s`,
            opacity: active ? 1 : 0.35,
            transform: active ? undefined : "scaleY(0.4)",
          }}
        />
      ))}
    </span>
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
    <div className="space-y-3">
      {lines.length === 0 && !interim ? (
        <p className="text-sm text-glass-muted">Waiting for speech…</p>
      ) : null}
      {lines.map((l) => (
        <div key={l.id}>
          <p className="text-xs font-medium text-glass-fg">{l.speaker}</p>
          <p className="text-sm leading-relaxed text-glass-muted">{l.text}</p>
        </div>
      ))}
      {interim ? (
        <div>
          <p className="text-xs font-medium text-glass-fg">You</p>
          <p className="text-sm italic text-glass-muted">{interim}</p>
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}
