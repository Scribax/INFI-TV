import { describe, expect, it } from "vitest";
import { qs } from "./query";

describe("qs", () => {
  it("devuelve cadena vacía sin parámetros relevantes", () => {
    expect(qs({})).toBe("");
    expect(qs({ search: "" })).toBe("");
  });

  it("filtra undefined y null", () => {
    expect(qs({ page: 1, status: undefined, planId: null, search: "" })).toBe(
      "?page=1",
    );
  });

  it("construye query con múltiples parámetros", () => {
    expect(qs({ page: 2, status: "ACTIVE" })).toBe("?page=2&status=ACTIVE");
  });
});
