import type {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

export function Table(props: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-raised/60">{children}</thead>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function Tr(props: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className="transition-colors hover:bg-raised/40" {...props} />
  );
}

export function Th(props: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted"
      {...props}
    />
  );
}

export function Td(props: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className="whitespace-nowrap px-4 py-3 text-ink" {...props} />;
}
