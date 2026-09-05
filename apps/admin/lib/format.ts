const dateFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const moneyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
});

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(iso: string | null | undefined): string {
  const d = parse(iso);
  return d === null ? "—" : dateFmt.format(d);
}

export function formatDateTime(iso: string | null | undefined): string {
  const d = parse(iso);
  return d === null ? "—" : dateTimeFmt.format(d);
}

/** Precio interno en centavos → "ARS" sin decimales. */
export function formatMoney(cents: number): string {
  return moneyFmt.format(cents / 100);
}
