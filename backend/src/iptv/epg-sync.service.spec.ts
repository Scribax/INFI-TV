import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../common/prisma/prisma.service";
import { EpgSyncService } from "./epg-sync.service";

function fmtUtc(d: Date): string {
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(
    d.getUTCHours(),
  )}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())} +0000`;
}

describe("EpgSyncService", () => {
  let service: EpgSyncService;

  const prisma = {
    channel: { findMany: jest.fn() },
    ePGProgram: { deleteMany: jest.fn(), createMany: jest.fn() },
  };
  const config = { get: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    config.get.mockReturnValue("https://epg.example/guide.xml");
    global.fetch = jest.fn() as unknown as typeof fetch;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EpgSyncService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(EpgSyncService);
  });

  it("sync parsea, mapea por externalId y almacena", async () => {
    const now = Date.now();
    const start = fmtUtc(new Date(now - 30 * 60 * 1000));
    const stop = fmtUtc(new Date(now + 30 * 60 * 1000));
    const xml = `<tv><programme start="${start}" stop="${stop}" channel="Telefe.ar"><title>Noticias</title><desc>Hoy</desc></programme></tv>`;
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => xml,
    });
    prisma.channel.findMany.mockResolvedValue([
      { id: "chan-1", externalId: "Telefe.ar" },
    ]);
    prisma.ePGProgram.deleteMany.mockResolvedValue({ count: 0 });
    prisma.ePGProgram.createMany.mockResolvedValue({ count: 1 });

    const result = await service.sync();
    expect(result.stored).toBe(1);
    expect(result.mapped).toBe(1);
    expect(prisma.ePGProgram.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ channelId: "chan-1", title: "Noticias" })],
    });
  });

  it("no toca la DB si la fuente falla", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });
    await expect(service.sync()).rejects.toThrow("EPG");
    expect(prisma.ePGProgram.deleteMany).not.toHaveBeenCalled();
  });

  it("lanza si EPG_SOURCE_URL está vacía", async () => {
    config.get.mockReturnValue("");
    await expect(service.sync()).rejects.toThrow("EPG_SOURCE_URL");
  });
});
