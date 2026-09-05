import { parseXmltv, parseXmltvTime, unescapeXml } from "./xmltv-parser";

describe("parseXmltvTime", () => {
  it("parsea con offset negativo a UTC", () => {
    expect(parseXmltvTime("20260905120000 -0300")).toBe(
      Date.UTC(2026, 8, 5, 15, 0, 0),
    );
  });

  it("parsea sin offset como UTC", () => {
    expect(parseXmltvTime("20260905120000")).toBe(
      Date.UTC(2026, 8, 5, 12, 0, 0),
    );
  });

  it("rechaza formato inválido", () => {
    expect(parseXmltvTime("no-es-fecha")).toBeNull();
  });
});

describe("unescapeXml", () => {
  it("desescapa entidades comunes", () => {
    expect(unescapeXml("A &amp; B &lt;3 &quot;x&quot;")).toBe('A & B <3 "x"');
  });
});

describe("parseXmltv", () => {
  const xml = `<?xml version="1.0"?>
<tv>
  <channel id="Telefe.ar"><display-name>Telefe</display-name></channel>
  <programme start="20260905120000 -0300" stop="20260905130000 -0300" channel="Telefe.ar">
    <title lang="es">Noticias</title>
    <desc lang="es">Resumen del día</desc>
  </programme>
  <programme stop="20260905140000 -0300" start="20260905130000 -0300" channel="Telefe.ar">
    <title lang="es">Película</title>
  </programme>
  <programme start="20260905140000 -0300" stop="20260905130000 -0300" channel="Roto.ar">
    <title>Fin antes que inicio</title>
  </programme>
</tv>`;

  it("parsea programmes válidos y omite los inválidos", () => {
    const entries = parseXmltv(xml);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      channelId: "Telefe.ar",
      title: "Noticias",
      description: "Resumen del día",
      startsAt: new Date(Date.UTC(2026, 8, 5, 15, 0, 0)).toISOString(),
    });
    expect(entries[1].title).toBe("Película");
    expect(entries[1].description).toBeNull();
  });
});
