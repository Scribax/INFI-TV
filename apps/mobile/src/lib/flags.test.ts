import { describe, expect, it } from "@jest/globals";
import { categoryLabel, flagEmoji } from "./flags";

describe("flagEmoji", () => {
  it("devuelve la bandera por ISO-2", () => {
    expect(flagEmoji("AR")).toBe("🇦🇷");
    expect(flagEmoji("US")).toBe("🇺🇸");
  });

  it("es insensible a mayúsculas/minúsculas", () => {
    expect(flagEmoji("ar")).toBe("🇦🇷");
  });

  it("devuelve vacío para códigos inválidos", () => {
    expect(flagEmoji("ARG")).toBe("");
    expect(flagEmoji("A1")).toBe("");
    expect(flagEmoji("")).toBe("");
  });
});

describe("categoryLabel", () => {
  it("traduce categorías conocidas", () => {
    expect(categoryLabel("news")).toBe("Noticias");
    expect(categoryLabel("sports")).toBe("Deportes");
    expect(categoryLabel("movies")).toBe("Películas");
  });

  it("devuelve el slug cuando no hay traducción", () => {
    expect(categoryLabel("desconocida")).toBe("desconocida");
  });
});
