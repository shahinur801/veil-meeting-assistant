import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  Copy,
  EyeOff,
  Laptop,
  Mic,
  Monitor,
  Server,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const MAC_SETUP = [
  "brew install git node",
  "git clone https://github.com/shahinur801/veil-meeting-assistant.git",
  "cd veil-meeting-assistant",
  "npm install",
  "npm run dev",
];

const LINUX_SETUP = [
  "sudo apt update && sudo apt install -y git curl",
  "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -",
  "sudo apt install -y nodejs",
  "git clone https://github.com/shahinur801/veil-meeting-assistant.git",
  "cd veil-meeting-assistant",
  "npm install",
  "npm run dev",
];

const WIN_SETUP = [
  "winget install Git.Git OpenJS.NodeJS.LTS Google.Chrome",
  "git clone https://github.com/shahinur801/veil-meeting-assistant.git",
  "cd veil-meeting-assistant",
  "npm install",
  "npm run dev",
];

export function InstallPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Veil home">
            <Logo />
          </Link>
          <Button asChild size="sm">
            <Link to="/app">
              Open the app
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-medium uppercase tracking-kicker text-muted-foreground">
          Install
        </p>
        <h1 className="mt-3 font-display text-5xl tracking-tight">
          Run Veil on your Mac, or inside a virtual machine.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Same functions as the live app: transcription, what to say, follow-ups,
          fact check, who you are talking to, recap, notes, follow-up email, and
          a private overlay. Chrome or Edge required for the microphone.
        </p>

        <ol className="mt-10 space-y-3">
          {[
            "Use it here — no install.",
            "Install on this Mac.",
            "Install in a virtual machine (UTM, Parallels, VMware, VirtualBox).",
          ].map((step, i) => (
            <li key={step} className="flex gap-3 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs text-background">
                {i + 1}
              </span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>

        <section className="mt-14 rounded-2xl bg-card p-6 shadow-[var(--shadow-border)]">
          <Laptop className="size-5 text-muted-foreground" />
          <h2 className="mt-3 font-display text-3xl tracking-tight">
            Fastest: use it here
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The preview already runs Veil. Open the app, start a demo call, or
            listen with your microphone. Nothing to install.
          </p>
          <Button asChild className="mt-5">
            <Link to="/app">
              Open the app
              <ArrowRight />
            </Link>
          </Button>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-3xl tracking-tight">
            Local Mac
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            For a private copy on this computer. macOS Catalina or later, Apple
            Silicon or Intel, Chrome or Edge, about 500 MB of disk.
          </p>
          <ol className="mt-6 space-y-5 text-sm leading-relaxed">
            <li>
              <p className="font-medium">1. Install Homebrew if you do not have it</p>
              <p className="mt-1 text-muted-foreground">
                Paste this in Terminal, then follow the prompts.
              </p>
              <Command
                lines={[
                  '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
                ]}
              />
            </li>
            <li>
              <p className="font-medium">2. Clone Veil and start it</p>
              <Command lines={MAC_SETUP} />
            </li>
            <li>
              <p className="font-medium">3. Open Chrome</p>
              <p className="mt-1 text-muted-foreground">
                Go to <span className="font-mono text-foreground">http://localhost:8080</span>.
                Allow the microphone. In Settings, paste a{" "}
                <a
                  className="underline underline-offset-4"
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google Gemini API key
                </a>{" "}
                so assist runs on your machine.
              </p>
            </li>
            <li>
              <p className="font-medium">4. Use it on a real call</p>
              <p className="mt-1 text-muted-foreground">
                Join Zoom, Meet, or Teams as usual. In Veil, press{" "}
                <strong>Listen with microphone</strong>. Keep Veil in its own
                window. Share only the meeting window — never the Veil window.
                Hide the overlay with <span className="font-mono">⌘\\</span>{" "}
                before you share.
              </p>
            </li>
          </ol>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-3xl tracking-tight">
            Virtual machine
          </h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Use a VM when you want Veil and the meeting isolated from the rest of
            the Mac — UTM (free, Apple Silicon), Parallels, VMware Fusion, or
            VirtualBox.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Server,
                title: "Create the guest",
                body: "Give it 4 GB RAM, 2 CPUs, 20 GB disk. Ubuntu 22.04, Windows 11, or a macOS guest in UTM.",
              },
              {
                icon: Mic,
                title: "Pass the microphone",
                body: "In the VM settings, enable microphone / USB audio. In the guest, allow Chrome to use it.",
              },
              {
                icon: Monitor,
                title: "Install Chrome + Node",
                body: "Same app as on the Mac. Pick the guest OS commands below.",
              },
            ].map((card) => (
              <article
                key={card.title}
                className="rounded-xl bg-card p-5 shadow-[var(--shadow-border)]"
              >
                <card.icon className="size-4 text-muted-foreground" />
                <h3 className="mt-3 font-medium">{card.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {card.body}
                </p>
              </article>
            ))}
          </div>

          <h3 className="mt-8 font-medium">UTM on Apple Silicon (recommended)</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>
              Download{" "}
              <a
                className="text-foreground underline underline-offset-4"
                href="https://mac.getutm.app/"
                target="_blank"
                rel="noreferrer"
              >
                UTM
              </a>{" "}
              and create a Linux VM from Ubuntu Server or Desktop 22.04.
            </li>
            <li>In VM settings: enable Clipboard sharing and the microphone.</li>
            <li>Start the guest, then run the Linux commands.</li>
          </ol>
          <Command lines={LINUX_SETUP} />

          <h3 className="mt-8 font-medium">Windows guest (Parallels / VMware / VirtualBox)</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Install Windows 11 x64. Enable shared clipboard and microphone. In an
            Administrator PowerShell:
          </p>
          <Command lines={WIN_SETUP} />

          <h3 className="mt-8 font-medium">After it starts</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            In the guest Chrome, open{" "}
            <span className="font-mono text-foreground">http://localhost:8080</span>.
            Join the meeting from inside the VM. Share the meeting window only.
            Veil never joins as a bot, so it will not appear on the guest list.
          </p>
        </section>

        <section className="mt-14 rounded-2xl bg-call p-6 text-call-foreground">
          <EyeOff className="size-5 text-call-muted" />
          <h2 className="mt-3 font-display text-3xl tracking-tight">
            Stay off the shared screen
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-call-foreground/85">
            <li>Veil never joins Zoom / Meet / Teams as a participant.</li>
            <li>
              Hide the overlay with <span className="font-mono">⌘\\</span> or
              Ctrl+\\ before you share.
            </li>
            <li>
              Share the meeting window, not Chrome and not the whole desktop.
            </li>
            <li>
              On a VM: run both the meeting and Veil in the guest, then share
              only the meeting app.
            </li>
          </ul>
        </section>

        <p className="mt-10 text-sm text-muted-foreground">
          Source:{" "}
          <a
            className="underline underline-offset-4 hover:text-foreground"
            href="https://github.com/shahinur801/veil-meeting-assistant"
            target="_blank"
            rel="noreferrer"
          >
            github.com/shahinur801/veil-meeting-assistant
          </a>
        </p>
      </main>
    </div>
  );
}

function Command({ lines }: { lines: string[] }) {
  const [copied, setCopied] = useState(false);
  const text = lines.join("\n");
  return (
    <div className="relative mt-3 overflow-hidden rounded-xl bg-call text-call-foreground">
      <button
        type="button"
        className="absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-md text-call-muted hover:bg-call-foreground/8 hover:text-call-foreground"
        aria-label="Copy"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast.success("Copied.");
          window.setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
      <pre className="overflow-x-auto p-4 pr-12 font-mono text-xs leading-relaxed sm:text-sm">
        {text}
      </pre>
    </div>
  );
}
