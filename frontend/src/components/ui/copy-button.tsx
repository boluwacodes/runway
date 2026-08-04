"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label = "Copy", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const isIconOnly = label === "";

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={isIconOnly ? (copied ? "Copied to clipboard" : "Copy to clipboard") : undefined}
      className={cn("inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground", className)}
    >
      {copied ? (
        <Check size={13} className="text-accent" aria-hidden="true" />
      ) : (
        <Copy size={13} aria-hidden="true" />
      )}
      {!isIconOnly && (copied ? "Copied" : label)}
    </button>
  );
}
