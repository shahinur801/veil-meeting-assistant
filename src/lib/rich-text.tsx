import { Fragment } from "react";

function inline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-medium text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

export function RichText({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  return (
    <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
      {lines.map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="h-1" />;
        const heading = t.match(/^#{1,3}\s+(.*)/);
        if (heading) {
          return (
            <p key={i} className="font-medium text-foreground">
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
