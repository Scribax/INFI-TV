import { TokenService, parseExpiryToMs } from "./token.service";

describe("parseExpiryToMs", () => {
  it("convierte unidades soportadas", () => {
    expect(parseExpiryToMs("30s")).toBe(30_000);
    expect(parseExpiryToMs("15m")).toBe(900_000);
    expect(parseExpiryToMs("12h")).toBe(43_200_000);
    expect(parseExpiryToMs("7d")).toBe(604_800_000);
  });

  it("rechaza formatos inválidos", () => {
    expect(() => parseExpiryToMs("nunca")).toThrow(/Expiración inválida/);
    expect(() => parseExpiryToMs("15x")).toThrow(/Expiración inválida/);
    expect(() => parseExpiryToMs("")).toThrow(/Expiración inválida/);
  });
});

describe("TokenService.hashToken", () => {
  it("es determinista y no expone el token", () => {
    const pair = { token: "abc123", tokenHash: TokenService.hashToken("abc123") };
    expect(pair.tokenHash).toBe(TokenService.hashToken("abc123"));
    expect(pair.tokenHash).not.toContain("abc123");
    expect(pair.tokenHash).toHaveLength(64);
  });
});
