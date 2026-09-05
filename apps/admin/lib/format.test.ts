import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatMoney } from "./format";

describe("format", () => {
  it("formatDate devuelve guion para valores vacíos o inválidos", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
    expect(formatDate("no-es-fecha")).toBe("—");
  });

  it("formatDate formatea dd/mm/yyyy", () => {
    expect(formatDate("2026-10-05T12:00:00.000Z")).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("formatDateTime incluye hora", () => {
    expect(formatDateTime("2026-10-05T12:00:00.000Z")).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("formatMoney convierte centavos a pesos con separador de miles", () => {
    expect(formatMoney(150000)).toContain("1.500");
    expect(formatMoney(0)).toContain("0");
  });
});
