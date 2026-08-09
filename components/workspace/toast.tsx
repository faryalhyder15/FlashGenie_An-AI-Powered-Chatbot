"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastItem {
  id: number;
  message: string;
  variant: "success" | "error";
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isError = toast.variant === "error";

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg card-shadow animate-in slide-in-from-top-2 fade-in duration-200",
        isError
          ? "bg-destructive/5 border-destructive/30 text-destructive"
          : "bg-card border-border text-foreground"
      )}
    >
      {isError ? (
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
      )}
      <p className="flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
