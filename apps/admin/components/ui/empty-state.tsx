export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line bg-surface/50 px-6 py-12 text-center">
      <span className="text-2xl">📭</span>
      <p className="mt-1 text-sm font-medium text-ink">{title}</p>
      {hint !== undefined && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
