import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AudioLines,
  Bell,
  Calendar,
  CreditCard,
  ExternalLink,
  Info,
  Keyboard,
  KeyRound,
  Languages,
  LayoutGrid,
  Loader2,
  Mic,
  Settings2,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { testApiKey } from "@/lib/gemini";
import { LANGUAGES } from "@/lib/languages";
import { meetingsThisMonth } from "@/lib/meetings";
import {
  PROVIDER_IDS,
  PROVIDERS,
  isProviderId,
  resolveModel,
  type ProviderId,
} from "@/lib/providers";
import {
  SESSION_MODES,
  type Settings,
} from "@/lib/settings";
import {
  listMicrophones,
  micErrorMessage,
  startMicMeter,
  type MicDevice,
} from "@/lib/speech";
import { cn } from "@/lib/utils";

type TabId =
  | "general"
  | "calendar"
  | "notifications"
  | "modes"
  | "keybinds"
  | "profile"
  | "security"
  | "billing"
  | "about";

const TABS: { id: TabId; label: string; icon: typeof Settings2 }[] = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "modes", label: "Modes", icon: LayoutGrid },
  { id: "keybinds", label: "Keybinds", icon: Keyboard },
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: KeyRound },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "about", label: "About", icon: Info },
];

const KEYBINDS = [
  { keys: "⌘ / Ctrl + Enter", action: "Ask Veil, or suggest what to say" },
  { keys: "⌘ / Ctrl + \\", action: "Hide or show the overlay" },
  { keys: "⌘ / Ctrl + ,", action: "Open settings" },
  { keys: "⌘ / Ctrl + Shift + S", action: "Capture the screen" },
];

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
  initialTab = "general",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onSave: (next: Settings) => void;
  initialTab?: TabId;
}) {
  const [draft, setDraft] = useState(settings);
  const [tab, setTab] = useState<TabId>(initialTab);
  const [testing, setTesting] = useState(false);
  const [mics, setMics] = useState<MicDevice[]>([]);
  const [meter, setMeter] = useState(0);
  const [testingMic, setTestingMic] = useState(false);
  const [monthCount, setMonthCount] = useState(0);
  const provider = PROVIDERS[draft.provider];
  const stopMeter = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(settings);
    setTab(initialTab);
    setMonthCount(meetingsThisMonth());
    void listMicrophones()
      .then(setMics)
      .catch(() => setMics([]));
  }, [open, settings, initialTab]);

  useEffect(() => {
    return () => {
      stopMeter.current?.();
      stopMeter.current = null;
    };
  }, []);

  function patch(next: Partial<Settings>) {
    setDraft((prev) => {
      const merged = { ...prev, ...next };
      onSave(merged);
      return merged;
    });
  }

  function setProvider(next: ProviderId) {
    patch({ provider: next, model: resolveModel(next, draft.model) });
  }

  async function handleTest() {
    if (!draft.apiKey.trim()) {
      toast.error(`Paste a ${provider.short} API key first.`);
      return;
    }
    setTesting(true);
    try {
      const result = await testApiKey({
        data: {
          provider: draft.provider,
          apiKey: draft.apiKey.trim(),
          model: draft.model,
        },
      });
      if (result.ok) toast.success(`${provider.short} is connected.`);
      else toast.error(result.error);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not test key.");
    } finally {
      setTesting(false);
    }
  }

  async function toggleMicTest() {
    if (testingMic) {
      stopMeter.current?.();
      stopMeter.current = null;
      setTestingMic(false);
      setMeter(0);
      return;
    }
    setTestingMic(true);
    try {
      const stop = await startMicMeter(draft.micId, setMeter);
      stopMeter.current = stop;
    } catch (err) {
      setTestingMic(false);
      toast.error(micErrorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 left-0 top-0 flex h-dvh w-full max-h-none max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-settings p-0 text-settings-foreground shadow-none [&>button]:text-settings-muted hover:[&>button]:text-settings-foreground">
        <DialogTitle className="sr-only">Veil Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Meetings, language, microphone, modes, keybinds, and API keys.
        </DialogDescription>

        <header className="px-4 pt-6 sm:px-8">
          <p className="text-center text-sm font-medium text-settings-muted">
            Veil Settings
          </p>
          <nav className="mx-auto mt-5 flex max-w-4xl gap-1 overflow-x-auto pb-1">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "flex min-w-20 flex-col items-center gap-2 rounded-2xl px-3 py-3 text-xs text-settings-muted transition-colors",
                    active
                      ? "bg-settings-tile text-settings-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                      : "hover:bg-settings-tile/60 hover:text-settings-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </header>

        <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-8 sm:px-6">
          {tab === "general" ? (
            <div className="space-y-10">
              <section>
                <h2 className="text-base font-semibold">Meetings</h2>
                <div className="mt-4 overflow-hidden rounded-2xl bg-settings-card shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                  <div className="flex items-start gap-4 p-5">
                    <Tile>
                      <Mic className="size-5" />
                    </Tile>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium">Sessions this month</p>
                        <p className="text-sm text-settings-muted">{monthCount}</p>
                      </div>
                      <p className="mt-1 text-sm text-settings-muted">
                        Unlimited on this device. Notes stay in this browser.
                      </p>
                    </div>
                  </div>
                  <div className="h-px bg-settings-line" />
                  <button
                    type="button"
                    onClick={() => setTab("security")}
                    className="flex w-full items-start gap-4 p-5 text-left hover:bg-white/3"
                  >
                    <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                      Key
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">Bring your own model</p>
                      <p className="mt-1 text-sm text-settings-muted">
                        Paste a Gemini, OpenAI, Claude, Grok, Groq, or OpenRouter key
                      </p>
                    </div>
                    <ExternalLink className="mt-1 size-4 text-settings-muted" />
                  </button>
                </div>
              </section>

              <section>
                <h2 className="text-base font-semibold">Language</h2>
                <p className="mt-1 text-sm text-settings-muted">
                  Choose how Veil listens and responds during meetings
                </p>
                <div className="mt-4 space-y-3">
                  <Row
                    icon={<AudioLines className="size-5" />}
                    title="Transcription language"
                    hint="Select the language you speak in meetings."
                    control={
                      <PillSelect
                        value={draft.lang}
                        onChange={(lang) => patch({ lang })}
                        options={LANGUAGES.map((l) => ({
                          value: l.id,
                          label: l.hint ? `${l.label} (recommended)` : l.label,
                        }))}
                      />
                    }
                  />
                  <Row
                    icon={<Languages className="size-5" />}
                    title="Output language"
                    hint="Your preferred language for AI and meeting notes."
                    control={
                      <PillSelect
                        value={draft.outputLang}
                        onChange={(outputLang) => patch({ outputLang })}
                        options={LANGUAGES.map((l) => ({
                          value: l.id,
                          label: l.label,
                        }))}
                      />
                    }
                  />
                </div>
              </section>

              <section>
                <h2 className="text-base font-semibold">Audio Settings</h2>
                <p className="mt-1 text-sm text-settings-muted">
                  Test your audio input before you hop into a call
                </p>
                <div className="mt-4">
                  <Row
                    icon={<Mic className="size-5" />}
                    title="Microphone Source"
                    hint={
                      mics.find((m) => m.deviceId === draft.micId)?.label ||
                      mics[0]?.label ||
                      "Default — system microphone"
                    }
                    control={
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {mics.length > 1 ? (
                          <PillSelect
                            value={draft.micId}
                            onChange={(micId) => patch({ micId })}
                            options={[
                              { value: "", label: "Default" },
                              ...mics.map((m) => ({
                                value: m.deviceId,
                                label: m.label,
                              })),
                            ]}
                          />
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 rounded-full border-white/10 bg-transparent text-settings-foreground hover:bg-white/8"
                          onClick={() => void toggleMicTest()}
                        >
                          {testingMic ? "Stop" : "Test Microphone"}
                        </Button>
                      </div>
                    }
                  />
                  {testingMic ? (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-75"
                        style={{ width: `${Math.round(meter * 100)}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}

          {tab === "calendar" ? (
            <section>
              <h2 className="text-base font-semibold">Calendar</h2>
              <p className="mt-1 text-sm text-settings-muted">
                Veil never joins as a meeting bot, so it never appears on the invite.
              </p>
              <div className="mt-4 rounded-2xl bg-settings-card p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <p className="font-medium">Starts with you</p>
                <p className="mt-2 text-sm leading-relaxed text-settings-muted">
                  Open Veil, press Listen, then join Zoom, Meet, or Teams as usual.
                  Share only the meeting window. There is no calendar sync and no
                  guest on the roster.
                </p>
              </div>
            </section>
          ) : null}

          {tab === "notifications" ? (
            <section className="space-y-3">
              <h2 className="text-base font-semibold">Notifications</h2>
              <Row
                icon={<Bell className="size-5" />}
                title="Assist toasts"
                hint="Show a quiet notice when an answer is ready."
                control={
                  <Toggle
                    checked={draft.notifyAssist}
                    onChange={(notifyAssist) => patch({ notifyAssist })}
                  />
                }
              />
              <Row
                icon={<Shield className="size-5" />}
                title="Hide before share"
                hint="Remind you to hide the overlay before you share your screen."
                control={
                  <Toggle
                    checked={draft.autoHideOnShare}
                    onChange={(autoHideOnShare) => patch({ autoHideOnShare })}
                  />
                }
              />
            </section>
          ) : null}

          {tab === "modes" ? (
            <section>
              <h2 className="text-base font-semibold">Modes</h2>
              <p className="mt-1 text-sm text-settings-muted">
                Changes how Veil writes during the call.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {SESSION_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => patch({ sessionMode: mode.id })}
                    className={cn(
                      "rounded-2xl bg-settings-card p-5 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-colors",
                      draft.sessionMode === mode.id &&
                        "shadow-[0_0_0_1px_rgba(61,107,255,0.7)]",
                    )}
                  >
                    <p className="font-medium">{mode.label}</p>
                    <p className="mt-1 text-sm text-settings-muted">{mode.hint}</p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {tab === "keybinds" ? (
            <section>
              <h2 className="text-base font-semibold">Keybinds</h2>
              <div className="mt-4 overflow-hidden rounded-2xl bg-settings-card shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                {KEYBINDS.map((row, i) => (
                  <div
                    key={row.keys}
                    className={cn(
                      "flex items-center justify-between gap-4 px-5 py-4",
                      i > 0 && "border-t border-white/6",
                    )}
                  >
                    <p className="text-sm">{row.action}</p>
                    <kbd className="rounded-lg bg-white/8 px-2.5 py-1 font-mono text-xs text-settings-muted">
                      {row.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {tab === "profile" ? (
            <section>
              <h2 className="text-base font-semibold">Profile</h2>
              <div className="mt-4 rounded-2xl bg-settings-card p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <p className="text-sm text-settings-muted">Display name in transcripts</p>
                <Input
                  className="mt-3 h-11 border-white/10 bg-settings-tile text-settings-foreground"
                  value={draft.displayName}
                  maxLength={40}
                  onChange={(e) => patch({ displayName: e.target.value })}
                />
              </div>
            </section>
          ) : null}

          {tab === "security" ? (
            <section className="space-y-4">
              <h2 className="text-base font-semibold">Security</h2>
              <p className="text-sm text-settings-muted">
                Keys stay in this browser and are sent only to the provider you pick.
              </p>
              <div className="space-y-4 rounded-2xl bg-settings-card p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <Field label="Provider">
                  <select
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-settings-tile px-3 text-sm"
                    value={draft.provider}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (isProviderId(next)) setProvider(next);
                    }}
                  >
                    {PROVIDER_IDS.map((id) => (
                      <option key={id} value={id}>
                        {PROVIDERS[id].label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={`${provider.short} API key`}>
                  <Input
                    type="password"
                    autoComplete="off"
                    placeholder={provider.placeholder}
                    className="border-white/10 bg-settings-tile text-settings-foreground"
                    value={draft.apiKey}
                    onChange={(e) => patch({ apiKey: e.target.value })}
                  />
                  <a
                    href={provider.keyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-settings-muted hover:text-settings-foreground"
                  >
                    {provider.keyHint}
                    <ExternalLink className="size-3" />
                  </a>
                </Field>
                <Field label="Model">
                  <select
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-settings-tile px-3 text-sm"
                    value={draft.model}
                    onChange={(e) => patch({ model: e.target.value })}
                  >
                    {provider.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} — {m.hint}
                      </option>
                    ))}
                  </select>
                </Field>
                <Button type="button" onClick={() => void handleTest()} disabled={testing}>
                  {testing ? <Loader2 className="animate-spin" /> : null}
                  Test connection
                </Button>
              </div>
            </section>
          ) : null}

          {tab === "billing" ? (
            <section>
              <h2 className="text-base font-semibold">Billing</h2>
              <div className="mt-4 rounded-2xl bg-settings-card p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <p className="font-medium">No subscription</p>
                <p className="mt-2 text-sm leading-relaxed text-settings-muted">
                  Veil is MIT-licensed and free. Assist is live here; on your machine
                  you bring your own API key. There is nothing to upgrade.
                </p>
                <a
                  href="https://github.com/shahinur801/veil-meeting-assistant"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Source on GitHub
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </section>
          ) : null}

          {tab === "about" ? (
            <section>
              <h2 className="text-base font-semibold">About</h2>
              <div className="mt-4 space-y-3 rounded-2xl bg-settings-card p-5 text-sm leading-relaxed text-settings-muted shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <p className="font-medium text-settings-foreground">Veil</p>
                <p>
                  Undetectable meeting assistant. It never joins the call. Hide the
                  overlay with ⌘\\ before you share, and share only the meeting window.
                </p>
                <p>Open source · MIT · 2026</p>
              </div>
            </section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Tile({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-settings-tile text-settings-foreground">
      {children}
    </span>
  );
}

function Row({
  icon,
  title,
  hint,
  control,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-settings-card p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] sm:flex-row sm:items-center sm:gap-4 sm:p-5">
      <Tile>{icon}</Tile>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-settings-muted">{hint}</p>
      </div>
      <div className="shrink-0 sm:ml-auto">{control}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-settings-muted">{label}</span>
      {children}
    </label>
  );
}

function PillSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 min-w-44 max-w-full rounded-full bg-white/8 px-4 text-sm text-settings-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
    >
      {options.map((o) => (
        <option key={o.value || "default"} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-white/15",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-6 rounded-full bg-white transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}