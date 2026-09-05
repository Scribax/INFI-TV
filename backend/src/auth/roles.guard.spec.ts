import { roleSatisfies } from "./roles.decorator";

describe("roleSatisfies (jerarquía SUPER_ADMIN > ADMIN > OPERATOR)", () => {
  it("sin roles requeridos permite todo", () => {
    expect(roleSatisfies("OPERATOR", [])).toBe(true);
  });

  it("SUPER_ADMIN pasa cualquier requerimiento", () => {
    expect(roleSatisfies("SUPER_ADMIN", ["OPERATOR"])).toBe(true);
    expect(roleSatisfies("SUPER_ADMIN", ["ADMIN"])).toBe(true);
    expect(roleSatisfies("SUPER_ADMIN", ["SUPER_ADMIN"])).toBe(true);
  });

  it("ADMIN no llega a SUPER_ADMIN", () => {
    expect(roleSatisfies("ADMIN", ["ADMIN"])).toBe(true);
    expect(roleSatisfies("ADMIN", ["OPERATOR"])).toBe(true);
    expect(roleSatisfies("ADMIN", ["SUPER_ADMIN"])).toBe(false);
  });

  it("OPERATOR solo nivel operador", () => {
    expect(roleSatisfies("OPERATOR", ["OPERATOR"])).toBe(true);
    expect(roleSatisfies("OPERATOR", ["ADMIN"])).toBe(false);
    expect(roleSatisfies("OPERATOR", ["ADMIN", "OPERATOR"])).toBe(true);
  });
});
