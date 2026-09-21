import { CornerDownLeft, Eye, ImageIcon, LayoutGrid } from "lucide-react";
import { DEMO_PARTICIPANTS } from "@/lib/demo-meeting";
import { cn } from "@/lib/utils";

export function ProductMock() {
  return (
    <div className="relative">
      <div className="veil-desk rounded-2xl p-2 shadow-[var(--shadow-lift)] sm:p-3">
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

        <div className="pointer-events-none relative z-10 mx-auto mt-3 w-[min(100%,24rem)]">
          <div className="glass-panel mb-2 rounded-[22px] p-3">
            <p className="text-xs text-glass-muted">What should I say?</p>
            <p className="mt-1 text-sm text-glass-fg">
              “We’ll lock January capacity today, then map SSO as a go / no-go.”
            </p>
          </div>
          <div className="glass-panel overflow-hidden rounded-[22px]">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="flex-1 text-sm text-glass-muted">Ask or search anything</span>
              <span className="flex size-8 items-center justify-center rounded-lg bg-white/12 text-glass-fg">
                <CornerDownLeft className="size-3.5" />
              </span>
            </div>
            <div className="glass-deep flex items-center gap-1 px-2 py-1.5 text-glass-fg">
              <span className="flex size-8 items-center justify-center">
                <ImageIcon className="size-3.5" />
              </span>
              <span className="flex size-8 items-center justify-center">
                <Eye className="size-3.5" />
              </span>
              <span className="flex size-8 items-center justify-center">
                <LayoutGrid className="size-3.5" />
              </span>
              <span className="mx-1 h-4 w-px bg-white/15" />
              <Waveform />
              <span className="ml-auto pr-2 text-xs">History</span>
            </div>
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
          className="w-0.5 origin-bottom rounded-full bg-white/80"
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
