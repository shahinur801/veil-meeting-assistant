import { createFileRoute } from "@tanstack/react-router";
import { SessionApp } from "@/components/session";

export const Route = createFileRoute("/app")({ component: AppPage });

function AppPage() {
  return <SessionApp />;
}
