import { Pause } from "lucide-react";
import { DEMO_PARTICIPANTS } from "@/lib/demo-meeting";
import { cn } from "@/lib/utils";

export function ProductMock() {
  return (
    <div className="relative">
      <div className="rounded-2xl bg-call p-2 shadow-[var(--shadow-lift)] sm:p-3">
        <div className="mb-2 flex items-center justify-between rounded-lg bg-call-foreground/8 px-3 py-2 text-call-foreground">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="flex size-5 items-center justify-center rounded-full bg-destructive">
              <Pause className="size-2.5 fill-current" />
            </span>
            <Waveform />
            <span className="font-mono tabular-nums">00:17</span>
          </div>
          <div className="hidden items-center gap-3 text-xs text-call-muted sm:flex">
            <span>Ask AI</span>
            <span>Show / Hide</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {DEMO_PARTICIPANTS.map((p, i) => (
            <div
              key={p.name}
              className="relative aspect-tile overflow-hidden rounded-lg bg-call-foreground/8"
            >
              <div
                className={cn(
                  "absolute inset-0 opacity-80",
                  i === 0 && "bg-primary/30",
                  i === 1 && "bg-call-foreground/10",
                  i === 2 && "bg-muted-foreground/20",
                  i === 3 && "bg-primary/15",
                )}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-call-foreground/15 font-medium text-call-foreground sm:size-16">
                  {p.initials}
                </span>
              </div>
              <div className="absolute bottom-2 left-2 rounded-sm bg-call/70 px-2 py-0.5 text-xs text-call-foreground">
                {p.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute -bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80">
        <div className="pointer-events-auto rounded-xl bg-card/95 p-4 shadow-[var(--shadow-lift)] backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-label text-muted-foreground">
              Live insights
            </p>
            <span className="text-xs text-muted-foreground">Show transcript</span>
          </div>
          <p className="mt-3 text-sm font-medium">Meeting introduction</p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <li>Acme wants 40 → 120 seats by January 6.</li>
            <li>Okta SSO and EU residency are hard requirements.</li>
            <li>Budget approved at $84k / year.</li>
          </ul>
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">Actions</p>
            <p className="mt-1 text-sm">Suggest follow-up questions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Waveform() {
  return (
    <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-0.5 origin-bottom rounded-full bg-destructive"
          style={{
            height: "12px",
            animation: "veil-wave 1s ease-in-out infinite",
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </span>
  );
}
