import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-7", className)}
      aria-hidden="true"
    >
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16 7.5c-3.4 3.2-5 6.2-5 8.5s1.6 5.3 5 8.5c3.4-3.2 5-6.2 5-8.5s-1.6-5.3-5-8.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      <LogoMark />
      Veil
    </span>
  );
}
