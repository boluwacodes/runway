import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      className={cn("flex items-center justify-center gap-2 p-8 text-sm text-muted", className)}
    >
      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      {label ?? "Loading…"}
    </div>
  );
}
