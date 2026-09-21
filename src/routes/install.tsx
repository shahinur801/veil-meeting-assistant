import { createFileRoute } from "@tanstack/react-router";
import { InstallPage } from "@/components/install";

export const Route = createFileRoute("/install")({ component: Install });

function Install() {
  return <InstallPage />;
}
