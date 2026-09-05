import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../common/prisma/prisma.service";
import { IptvSyncService } from "./iptv-sync.service";

const SAMPLE_M3U = [
  "#EXTM3U",
  '#EXTINF:-1 tvg-id="Telefe.ar@HD" tvg-logo="https://logo.png" group-title="General",Telefe',
  "https://stream.example/telefe.m3u8",
  '#EXTINF:-1 tvg-id="TN.ar@SD" group-title="News",Todo Noticias',
  "https://stream.example/tn.m3u8",
  '#EXTINF:-1 tvg-id="CNN.us@HD" group-title="News",CNN',
  "https://stream.example/cnn.m3u8",
].join("\n");

describe("IptvSyncService", () => {
  let service: IptvSyncService;

  const prisma = {
    country: { upsert: jest.fn().mockResolvedValue({}) },
    category: {
      upsert: jest
        .fn()
        .mockImplementation(async ({ create }: { create: { slug: string } }) => ({
          id: create.slug,
        })),
    },
    channel: { upsert: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn().mockImplementation(async (ops: unknown[]) => {
      for (const op of ops) await op;
      return [];
    }),
  };
  const config = { get: jest.fn().mockReturnValue(undefined) };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => SAMPLE_M3U,
    } as unknown as Response);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IptvSyncService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    service = module.get(IptvSyncService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sincroniza países, categorías y canales", async () => {
    const result = await service.sync();

    expect(result.parsed).toBe(3);
    expect(result.countries).toBe(2); // AR y US
    expect(result.categories).toBe(2); // General y News

    expect(prisma.country.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.category.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.channel.upsert).toHaveBeenCalledTimes(3);
  });

  it("no toca la DB si la fuente falla", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);

    await expect(service.sync()).rejects.toThrow(/HTTP 500/);
    expect(prisma.country.upsert).not.toHaveBeenCalled();
    expect(prisma.channel.upsert).not.toHaveBeenCalled();
  });

  it("registra auditoría cuando hay actor", async () => {
    await service.sync({ id: "admin-1", email: "a@b.c", role: "ADMIN" }, "127.0.0.1");
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin.synced_iptv",
        actorId: "admin-1",
        ip: "127.0.0.1",
      }),
    );
  });
});
