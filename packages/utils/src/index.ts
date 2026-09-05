/**
 * Utilidades puras compartidas. Sin dependencias, sin secretos, sin I/O.
 * Todas las funciones son deterministas y testeables.
 */

/** Divide un array en chunks del tamaño indicado. */
export function chunkArray<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError("chunkArray: size debe ser un entero > 0");
  }
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export interface PaginationInput {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginationResult {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  offset: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Normaliza y calcula metadatos de paginación (1-indexed). */
export function buildPagination(input: PaginationInput): PaginationResult {
  const pageSize = Math.min(
    Math.max(Math.floor(input.pageSize) || 20, 1),
    100,
  );
  const total = Math.max(Math.floor(input.total) || 0, 0);
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const page = Math.min(Math.max(Math.floor(input.page) || 1, 1), totalPages);
  const offset = (page - 1) * pageSize;
  return {
    page,
    pageSize,
    total,
    totalPages,
    offset,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/** Compara versiones semver simples "1.2.3". Devuelve -1 | 0 | 1. */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const parse = (v: string): number[] =>
    v
      .trim()
      .split(".")
      .map((part) => {
        const n = Number.parseInt(part, 10);
        return Number.isNaN(n) ? 0 : n;
      });
  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

/** Normaliza texto para búsqueda (minúsculas, sin diacríticos, trim). */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Promise sleep — útil para reintentos con backoff (no usar en hot paths). */
export function sleep(ms: number): Promise<void> {
  if (!Number.isFinite(ms) || ms < 0) {
    throw new RangeError("sleep: ms debe ser >= 0");
  }
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
