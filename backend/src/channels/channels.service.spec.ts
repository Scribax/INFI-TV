import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { PrismaService } from "../common/prisma/prisma.service";
import { ChannelsService } from "./channels.service";

describe("ChannelsService", () => {
  let service: ChannelsService;

  const prisma = {
    channel: { count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    country: { findMany: jest.fn() },
    category: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChannelsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ChannelsService);
  });

  it("lista solo canales activos y no ocultos, paginado", async () => {
    prisma.channel.count.mockResolvedValue(9910);
    prisma.channel.findMany.mockResolvedValue([
      {
        id: "c1",
        name: "Telefe",
        logoUrl: null,
        streamUrl: "https://x/t.m3u8",
        countryCode: "AR",
        categories: [{ slug: "general", name: "General" }],
        language: null,
        isActive: true,
        streamStatus: "UNKNOWN",
      },
    ]);

    const result = await service.list({ page: 1, pageSize: 20 });

    expect(result.total).toBe(9910);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("Telefe");
    const where = prisma.channel.findMany.mock.calls[0][0].where;
    expect(where.isActive).toBe(true);
    expect(where.isHidden).toBe(false);
  });

  it("aplica filtro por país (normalizado a mayúsculas)", async () => {
    prisma.channel.count.mockResolvedValue(10);
    prisma.channel.findMany.mockResolvedValue([]);

    await service.list({ country: "ar" });

    const where = prisma.channel.findMany.mock.calls[0][0].where;
    expect(where.countryCode).toBe("AR");
  });

  it("aplica filtro por categoría", async () => {
    prisma.channel.count.mockResolvedValue(5);
    prisma.channel.findMany.mockResolvedValue([]);

    await service.list({ category: "news" });

    const where = prisma.channel.findMany.mock.calls[0][0].where;
    expect(where.categories).toEqual({ some: { slug: "news" } });
  });

  it("aplica búsqueda por nombre", async () => {
    prisma.channel.count.mockResolvedValue(3);
    prisma.channel.findMany.mockResolvedValue([]);

    await service.list({ search: "telefe" });

    const where = prisma.channel.findMany.mock.calls[0][0].where;
    expect(where.name).toEqual({ contains: "telefe", mode: "insensitive" });
  });

  it("get lanza 404 si el canal no existe", async () => {
    prisma.channel.findFirst.mockResolvedValue(null);
    await expect(service.get("missing")).rejects.toThrow("Canal no encontrado.");
  });

  it("get devuelve el canal", async () => {
    prisma.channel.findFirst.mockResolvedValue({
      id: "c1",
      name: "Telefe",
      logoUrl: null,
      streamUrl: "https://x/t.m3u8",
      countryCode: "AR",
      categories: [],
      language: null,
      isActive: true,
      streamStatus: "UNKNOWN",
    });
    const channel = await service.get("c1");
    expect(channel.name).toBe("Telefe");
  });

  it("lista países y categorías", async () => {
    prisma.country.findMany.mockResolvedValue([{ code: "AR", name: "Argentina", flag: "🇦🇷" }]);
    prisma.category.findMany.mockResolvedValue([{ id: "cat1", slug: "news", name: "News" }]);

    const countries = await service.listCountries();
    const categories = await service.listCategories();

    expect(countries).toHaveLength(1);
    expect(countries[0].code).toBe("AR");
    expect(categories[0].slug).toBe("news");
  });
});
