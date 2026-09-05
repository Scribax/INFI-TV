"use client";

import { Spinner } from "./spinner";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={busy ? undefined : onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm animate-fade-in rounded-xl border border-line bg-surface shadow-pop"
      >
        <div className="px-5 py-4">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <p className="mt-2 text-sm text-ink-muted">{message}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? <Spinner /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
