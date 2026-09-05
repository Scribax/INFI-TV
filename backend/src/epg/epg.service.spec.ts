import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { PrismaService } from "../common/prisma/prisma.service";
import { EpgService } from "./epg.service";

describe("EpgService", () => {
  let service: EpgService;

  const prisma = { ePGProgram: { findMany: jest.fn() } };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [EpgService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(EpgService);
  });

  it("forChannel filtra por endsAt > from y limita", async () => {
    prisma.ePGProgram.findMany.mockResolvedValue([]);
    const from = new Date();
    await service.forChannel("chan-1", from, 12);
    expect(prisma.ePGProgram.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { channelId: "chan-1", endsAt: { gt: from } },
        take: 12,
      }),
    );
  });

  it("now filtra la ventana activa", async () => {
    prisma.ePGProgram.findMany.mockResolvedValue([]);
    await service.now(50);
    expect(prisma.ePGProgram.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          startsAt: { lte: expect.any(Date) },
          endsAt: { gt: expect.any(Date) },
        },
      }),
    );
  });
});
