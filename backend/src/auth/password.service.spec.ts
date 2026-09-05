import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const svc = new PasswordService();

  it("hashea y verifica correctamente", async () => {
    const hash = await svc.hash("contraseña-segura-01");
    expect(hash).not.toContain("contraseña-segura-01");
    await expect(svc.verify(hash, "contraseña-segura-01")).resolves.toBe(
      true,
    );
  });

  it("rechaza contraseña incorrecta", async () => {
    const hash = await svc.hash("contraseña-segura-01");
    await expect(svc.verify(hash, "otra-contraseña")).resolves.toBe(false);
  });

  it("un hash malformado nunca autentica", async () => {
    await expect(svc.verify("no-es-un-hash", "x")).resolves.toBe(false);
  });
});
