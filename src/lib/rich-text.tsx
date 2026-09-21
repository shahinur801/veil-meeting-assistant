import { Fragment } from "react";
import { cn } from "@/lib/utils";

function inline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-medium text-current">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  return (
    <div className={cn("space-y-2 text-sm leading-relaxed", className)}>
      {lines.map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="h-1" />;
        const heading = t.match(/^#{1,3}\s+(.*)/);
        if (heading) {
          return (
            <p key={i} className="font-medium text-current">
              {inline(heading[1], `h-${i}`)}
            </p>
          );
        }
        const numbered = t.match(/^\d+\.\s+(.*)/);
        if (numbered) {
          return (
            <p key={i} className="pl-1">
              {inline(t, `n-${i}`)}
            </p>
          );
        }
        const bullet = t.match(/^[-*]\s+(.*)/);
        if (bullet) {
          return (
            <p key={i} className="pl-3">
              {inline(bullet[1], `b-${i}`)}
            </p>
          );
        }
        return <p key={i}>{inline(t, `p-${i}`)}</p>;
      })}
    </div>
  );
}
