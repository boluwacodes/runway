import { cn } from "@/lib/cn";

type BadgeTone = "green" | "gold" | "rose" | "blue" | "muted";

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: "bg-accent/10 text-accent",
  gold: "bg-accent-gold/10 text-accent-gold",
  rose: "bg-accent-rose/10 text-accent-rose",
  blue: "bg-accent-blue/10 text-accent-blue",
  muted: "bg-border/60 text-muted",
};

export function Badge({
  tone = "muted",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 text-xs font-medium", TONE_CLASSES[tone], className)}>
      {children}
    </span>
  );
}
