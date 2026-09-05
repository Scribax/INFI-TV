import {
  baseId,
  countryCodeFromId,
  dedupeChannels,
  parseDisplayName,
  parseM3u,
  qualityRank,
} from "./m3u-parser";

describe("m3u-parser", () => {
  it("parsea un M3U con varias entradas", () => {
    const m3u = [
      "#EXTM3U",
      '#EXTINF:-1 tvg-id="Telefe.ar@HD" tvg-logo="https://logo.png" group-title="General",Telefe',
      "https://stream.example/telefe.m3u8",
      '#EXTINF:-1 tvg-id="TN.ar@SD" tvg-logo="https://tn.png" group-title="News",Todo Noticias',
      "https://stream.example/tn.m3u8",
    ].join("\n");

    const channels = parseM3u(m3u);

    expect(channels).toHaveLength(2);
    expect(channels[0]).toMatchObject({
      externalId: "Telefe.ar",
      name: "Telefe",
      logoUrl: "https://logo.png",
      streamUrl: "https://stream.example/telefe.m3u8",
      countryCode: "AR",
      categories: ["General"],
    });
    expect(channels[1].countryCode).toBe("AR");
  });

  it("ignora líneas #EXTVLCOPT entre EXTINF y la URL", () => {
    const m3u = [
      "#EXTM3U",
      '#EXTINF:-1 tvg-id="X.us@SD" group-title="General",Canal X',
      '#EXTVLCOPT:http-user-agent=Mozilla/5.0',
      "https://stream.example/x.m3u8",
    ].join("\n");

    const channels = parseM3u(m3u);
    expect(channels).toHaveLength(1);
    expect(channels[0].streamUrl).toBe("https://stream.example/x.m3u8");
  });

  it("parseDisplayName ignora comas dentro de comillas", () => {
    const line =
      '#EXTINF:-1 tvg-id="X.us@SD" http-user-agent="Mozilla/5.0 (KHTML, like Gecko) Chrome" group-title="General",Mi Canal';
    expect(parseDisplayName(line)).toBe("Mi Canal");
  });

  it("baseId quita el sufijo de calidad", () => {
    expect(baseId("Telefe.ar@HD")).toBe("Telefe.ar");
    expect(baseId("X.us@FHD")).toBe("X.us");
  });

  it("countryCodeFromId extrae el ISO-2 y lo normaliza a mayúsculas", () => {
    expect(countryCodeFromId("Telefe.ar@HD")).toBe("AR");
    expect(countryCodeFromId("BBC.uk")).toBe("UK");
    expect(countryCodeFromId("SinPais")).toBeNull();
  });

  it("qualityRank ordena FHD > HD > SD", () => {
    expect(qualityRank("X@FHD", "")).toBeGreaterThan(qualityRank("X@HD", ""));
    expect(qualityRank("X@HD", "")).toBeGreaterThan(qualityRank("X@SD", ""));
  });

  it("dedupeChannels conserva la mejor calidad por externalId", () => {
    const m3u = [
      "#EXTM3U",
      '#EXTINF:-1 tvg-id="Canal.ar@SD" group-title="General",Canal',
      "https://x/sd.m3u8",
      '#EXTINF:-1 tvg-id="Canal.ar@HD" group-title="General",Canal',
      "https://x/hd.m3u8",
    ].join("\n");

    const deduped = dedupeChannels(parseM3u(m3u));
    expect(deduped).toHaveLength(1);
    expect(deduped[0].streamUrl).toBe("https://x/hd.m3u8");
  });

  it("categorías múltiples se separan por ;", () => {
    const m3u = [
      "#EXTM3U",
      '#EXTINF:-1 tvg-id="X.us@SD" group-title="Entertainment;Family;General",Canal',
      "https://x/x.m3u8",
    ].join("\n");
    const channels = parseM3u(m3u);
    expect(channels[0].categories).toEqual(["Entertainment", "Family", "General"]);
  });
});
