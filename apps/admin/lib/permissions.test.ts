import { describe, expect, it } from "vitest";
import { canWrite, isSuper } from "./permissions";

describe("permissions", () => {
  it("canWrite: solo SUPER_ADMIN y ADMIN pueden mutar", () => {
    expect(canWrite("SUPER_ADMIN")).toBe(true);
    expect(canWrite("ADMIN")).toBe(true);
    expect(canWrite("OPERATOR")).toBe(false);
    expect(canWrite(undefined)).toBe(false);
  });

  it("isSuper: solo SUPER_ADMIN", () => {
    expect(isSuper("SUPER_ADMIN")).toBe(true);
    expect(isSuper("ADMIN")).toBe(false);
    expect(isSuper(undefined)).toBe(false);
  });
});
