import { buildAppConfig } from "./configuration";

describe("buildAppConfig", () => {
  it("usa valores por defecto sensatos", () => {
    const cfg = buildAppConfig({});
    expect(cfg.port).toBe(3000);
    expect(cfg.corsOrigins).toEqual(["http://localhost:3001"]);
    expect(cfg.throttleTtlMs).toBe(60000);
    expect(cfg.throttleLimit).toBe(100);
  });

  it("parsea CORS_ORIGINS con múltiples orígenes", () => {
    const cfg = buildAppConfig({
      CORS_ORIGINS: "https://admin.infitv.tv, https://infitv.tv",
    });
    expect(cfg.corsOrigins).toEqual([
      "https://admin.infitv.tv",
      "https://infitv.tv",
    ]);
  });

  it("rechaza puertos inválidos", () => {
    expect(() => buildAppConfig({ PORT: "nope" })).toThrow(/PORT/);
    expect(() => buildAppConfig({ PORT: "99999" })).toThrow(/PORT/);
  });

  it("rechaza throttle inválido", () => {
    expect(() => buildAppConfig({ THROTTLE_LIMIT: "0" })).toThrow(
      /THROTTLE_LIMIT/,
    );
  });
});
