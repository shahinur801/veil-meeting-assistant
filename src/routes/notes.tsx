import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/notes")({ component: NotesLayout });

function NotesLayout() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Home">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/install" className="text-sm text-muted-foreground hover:text-foreground">
              Install
            </Link>
            <Button asChild size="sm">
              <Link to="/app">Open the app</Link>
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
