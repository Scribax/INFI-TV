import {
  CODE_ALPHABET,
  buildPrefix,
  generatePlainCode,
  hashCode,
  isCodeEffectivelyUsable,
  isValidCodeFormat,
  normalizeCode,
} from "./code-generator";

describe("code-generator", () => {
  it("genera formato INFITV-XXXX-XXXX sin caracteres ambiguos", () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generatePlainCode();
      expect(code).toMatch(/^INFITV-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(isValidCodeFormat(code)).toBe(true);
      const flat = code.replace(/-/g, "").replace("INFITV", "");
      expect(flat).toHaveLength(8);
      for (const ch of flat) {
        expect(CODE_ALPHABET).toContain(ch);
      }
      expect(flat).not.toMatch(/[OI01L]/);
    }
  });

  it("1000 códigos sin colisiones", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      seen.add(generatePlainCode());
    }
    expect(seen.size).toBe(1000);
  });

  it("normaliza minúsculas, espacios y guiones", () => {
    expect(normalizeCode("infitv 7k4p-x92m")).toBe("INFITV7K4PX92M");
  });

  it("hash con pepper es determinista y distinto sin pepper", () => {
    const a = hashCode("INFITV-AAAA-BBBB", "pepper-1");
    expect(a).toBe(hashCode("infitv-aaaa-bbbb", "pepper-1"));
    expect(a).not.toBe(hashCode("INFITV-AAAA-BBBB", "pepper-2"));
    expect(a).toHaveLength(64);
  });

  it("prefijo expone solo 2 símbolos", () => {
    expect(buildPrefix("INFITV-7K4P-X92M")).toBe("INFITV-7K");
  });

  it("isCodeEffectivelyUsable: matriz", () => {
    const now = new Date("2026-09-05T12:00:00.000Z");
    const future = new Date("2026-10-05T00:00:00.000Z");
    const past = new Date("2026-08-05T00:00:00.000Z");
    expect(isCodeEffectivelyUsable({ status: "PENDING", expiresAt: null }, now)).toBe(true);
    expect(isCodeEffectivelyUsable({ status: "ACTIVE", expiresAt: future }, now)).toBe(true);
    expect(isCodeEffectivelyUsable({ status: "ACTIVE", expiresAt: past }, now)).toBe(false);
    expect(isCodeEffectivelyUsable({ status: "SUSPENDED", expiresAt: null }, now)).toBe(false);
    expect(isCodeEffectivelyUsable({ status: "REVOKED", expiresAt: null }, now)).toBe(false);
    expect(isCodeEffectivelyUsable({ status: "EXPIRED", expiresAt: future }, now)).toBe(false);
  });
});
