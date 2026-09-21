import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteMeeting, getMeeting, notesToMarkdown } from "@/lib/meetings";
import type { SavedMeeting } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

export const Route = createFileRoute("/notes/$id")({ component: NoteDetail });

function NoteDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<SavedMeeting | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMeeting(getMeeting(id) ?? null);
    setReady(true);
  }, [id]);

  if (!ready) {
    return <div className="min-h-96 bg-background" />;
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <p className="font-medium">That meeting is not on this device.</p>
        <Button asChild variant="outline">
          <Link to="/notes">Back to notes</Link>
        </Button>
      </div>
    );
  }

  const md = notesToMarkdown(meeting);
  const n = meeting.notes;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/notes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All notes
        </Link>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(md);
              toast.success("Copied as Markdown.");
            }}
          >
            <Copy />
            Copy
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              deleteMeeting(id);
              toast.success("Deleted.");
              void navigate({ to: "/notes" });
            }}
          >
            <Trash2 />
            Delete
          </Button>
        </div>
      </div>
      <h1 className="mt-4 font-display text-4xl tracking-tight">{meeting.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {new Date(meeting.startedAt).toLocaleString()} ·{" "}
        {formatDuration(meeting.durationSec)}
      </p>

      <Tabs defaultValue="summary" className="mt-8">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          {n ? (
            <div className="space-y-8">
              <p className="text-base leading-relaxed">{n.summary}</p>
              <Section title="Attendees" items={n.attendees} />
              <Section title="Key points" items={n.keyPoints} />
              <Section title="Decisions" items={n.decisions} />
              <div>
                <h2 className="text-sm font-medium uppercase tracking-label text-muted-foreground">
                  Action items
                </h2>
                <ul className="mt-3 space-y-2">
                  {n.actionItems.map((a, i) => (
                    <li
                      key={i}
                      className="rounded-lg bg-card px-4 py-3 text-sm shadow-[var(--shadow-border)]"
                    >
                      <span className="font-medium">{a.owner}</span>
                      <span className="text-muted-foreground"> — {a.task}</span>
                      {a.due ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {a.due}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
              <Section title="Open questions" items={n.openQuestions} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {meeting.notesMarkdown ||
                "No structured notes were generated for this session."}
            </p>
          )}
        </TabsContent>
        <TabsContent value="transcript">
          <div className="space-y-4">
            {meeting.transcript.length === 0 ? (
              <p className="text-sm text-muted-foreground">Empty transcript.</p>
            ) : (
              meeting.transcript.map((l) => (
                <div key={l.id}>
                  <p className="text-xs font-medium">{l.speaker}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {l.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h2 className="text-sm font-medium uppercase tracking-label text-muted-foreground">
        {title}
      </h2>
      <ul className="mt-3 space-y-1.5 text-sm leading-relaxed">
        {items.map((item) => (
          <li key={item} className="pl-3">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
