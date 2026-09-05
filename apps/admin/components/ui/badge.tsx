import { toneClass } from "@/lib/status";
import type { Tone } from "@/lib/status";

export function Badge({
  tone,
  children,
}: {
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${toneClass(tone)}`}
    >
      {children}
    </span>
  );
}
