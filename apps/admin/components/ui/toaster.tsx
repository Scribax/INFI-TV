"use client";

import { useSyncExternalStore } from "react";
import { getToasts, subscribeToasts } from "@/lib/toast";

export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, () => []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto animate-fade-in rounded-lg border px-4 py-3 text-sm shadow-pop ${
            t.kind === "success"
              ? "border-ok/30 bg-surface text-ink"
              : "border-danger/40 bg-surface text-ink"
          }`}
        >
          <span className="mr-2">{t.kind === "success" ? "✅" : "⚠️"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
