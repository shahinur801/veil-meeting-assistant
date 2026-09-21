import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GEMINI_MODELS, type GeminiModel } from "@/lib/types";
import { testGeminiKey } from "@/lib/gemini";
import { type Settings } from "@/lib/settings";

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onSave: (next: Settings) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [testing, setTesting] = useState(false);

  function syncOpen(next: boolean) {
    if (next) setDraft(settings);
    onOpenChange(next);
  }

  async function handleTest() {
    if (!draft.apiKey.trim()) {
      toast.error("Paste a Google Gemini API key first.");
      return;
    }
    setTesting(true);
    try {
      const result = await testGeminiKey({
        data: { apiKey: draft.apiKey.trim(), model: draft.model },
      });
      if (result.ok) toast.success("Gemini is connected.");
      else toast.error(result.error);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not test key.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={syncOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gemini settings</DialogTitle>
          <DialogDescription>
            Veil already runs live assist. Paste a Google Gemini API key only
            if you want answers from your own Google account. The key stays in
            this browser.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="apiKey">Google API key</Label>
            <Input
              id="apiKey"
              type="password"
              autoComplete="off"
              placeholder="AIza…"
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
            />
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Get a free key in Google AI Studio
              <ExternalLink className="size-3" />
            </a>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="model">Model</Label>
            <select
              id="model"
              className="flex h-11 w-full rounded-md border border-border bg-card px-3 text-sm"
              value={draft.model}
              onChange={(e) =>
                setDraft({ ...draft, model: e.target.value as GeminiModel })
              }
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} — {m.hint}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lang">Transcription language</Label>
            <select
              id="lang"
              className="flex h-11 w-full rounded-md border border-border bg-card px-3 text-sm"
              value={draft.lang}
              onChange={(e) => setDraft({ ...draft, lang: e.target.value })}
            >
              {[
                ["en-US", "English (US)"],
                ["en-GB", "English (UK)"],
                ["es-ES", "Spanish"],
                ["fr-FR", "French"],
                ["de-DE", "German"],
                ["pt-BR", "Portuguese"],
                ["zh-CN", "Chinese"],
                ["ja-JP", "Japanese"],
                ["ko-KR", "Korean"],
                ["hi-IN", "Hindi"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? <Loader2 className="animate-spin" /> : null}
            Test connection
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSave({ ...draft, apiKey: draft.apiKey.trim() });
              onOpenChange(false);
              toast.success("Settings saved on this device.");
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
