/** Construye query string ignorando valores vacíos/nulos. */
export function qs(params: object): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      q.set(key, String(value));
    }
  }
  const s = q.toString();
  return s === "" ? "" : `?${s}`;
}
