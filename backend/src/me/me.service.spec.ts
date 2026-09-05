import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { MeService } from "./me.service";

describe("MeService", () => {
  let service: MeService;

  const prisma = {
    favorite: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    watchHistory: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    channel: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [MeService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(MeService);
  });

  it("lista favoritos desanidando el canal", async () => {
    prisma.favorite.findMany.mockResolvedValue([
      { channel: { id: "c1", name: "Telefe" } },
      { channel: { id: "c2", name: "TN" } },
    ]);
    const result = await service.listFavorites("cust-1");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: "c1", name: "Telefe" });
  });

  it("agrega favorito con upsert", async () => {
    prisma.channel.findUnique.mockResolvedValue({ id: "c1" });
    prisma.favorite.upsert.mockResolvedValue({});
    const result = await service.addFavorite("cust-1", "c1");
    expect(result).toEqual({ favorited: true });
    expect(prisma.favorite.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerId_channelId: { customerId: "cust-1", channelId: "c1" } },
      }),
    );
  });

  it("agregar favorito a un canal inexistente lanza 404", async () => {
    prisma.channel.findUnique.mockResolvedValue(null);
    await expect(service.addFavorite("cust-1", "missing")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("quita favorito con deleteMany", async () => {
    prisma.favorite.deleteMany.mockResolvedValue({ count: 1 });
    const result = await service.removeFavorite("cust-1", "c1");
    expect(result).toEqual({ favorited: false });
  });

  it("registra visualización actualizando watchedAt", async () => {
    prisma.channel.findUnique.mockResolvedValue({ id: "c1" });
    prisma.watchHistory.upsert.mockResolvedValue({});
    const result = await service.recordWatch("cust-1", "c1");
    expect(result).toEqual({ recorded: true });
    expect(prisma.watchHistory.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { watchedAt: expect.any(Date) },
      }),
    );
  });

  it("lista historial limitado a 20", async () => {
    prisma.watchHistory.findMany.mockResolvedValue([
      { channel: { id: "c1", name: "Telefe" }, watchedAt: new Date() },
    ]);
    const result = await service.listHistory("cust-1");
    expect(result).toHaveLength(1);
    expect(prisma.watchHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });
});
