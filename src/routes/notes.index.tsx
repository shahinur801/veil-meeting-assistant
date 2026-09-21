import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listMeetings } from "@/lib/meetings";
import type { SavedMeeting } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

export const Route = createFileRoute("/notes/")({ component: NotesIndex });

function NotesIndex() {
  const [meetings, setMeetings] = useState<SavedMeeting[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMeetings(listMeetings());
    setReady(true);
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-kicker text-muted-foreground">
        Archive
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Meeting notes</h1>
      <p className="mt-2 text-muted-foreground">
        Saved on this device. Nothing is uploaded unless you copy it out.
      </p>
      {!ready ? null : meetings.length === 0 ? (
        <div className="mt-12 rounded-xl bg-card p-8 text-center shadow-[var(--shadow-border)]">
          <FileText className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No notes yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Run a demo call and end the session to generate notes.
          </p>
          <Button asChild className="mt-5">
            <Link to="/app">Start a session</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {meetings.map((m) => (
            <li key={m.id}>
              <Link
                to="/notes/$id"
                params={{ id: m.id }}
                className="flex items-center justify-between gap-4 rounded-xl bg-card p-5 shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-lift)]"
              >
                <div>
                  <p className="font-medium">{m.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(m.startedAt).toLocaleString()} ·{" "}
                    {formatDuration(m.durationSec)} · {m.transcript.length} lines
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
