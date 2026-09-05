import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";
import { PrismaService } from "../common/prisma/prisma.service";
import { StatsService } from "./stats.service";

describe("StatsService", () => {
  let service: StatsService;

  const prisma = {
    customer: { count: jest.fn(), findFirst: jest.fn() },
    activationCode: { count: jest.fn() },
    device: { count: jest.fn() },
    session: { count: jest.fn() },
    watchHistory: { count: jest.fn() },
    channel: { count: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(StatsService);
  });

  it("agrega contadores por estado, totales y telemetría", async () => {
    prisma.customer.count.mockImplementation(
      async (args?: { where?: { status?: string } }) => {
        const s = args?.where?.status;
        if (s === "ACTIVE") return 5;
        if (s === "EXPIRED") return 2;
        if (s === "SUSPENDED") return 1;
        return 8;
      },
    );
    prisma.activationCode.count.mockImplementation(
      async (args?: { where?: { status?: string } }) => {
        const s = args?.where?.status;
        if (s === "PENDING") return 4;
        if (s === "ACTIVE") return 3;
        if (s === "REVOKED") return 2;
        return 10;
      },
    );
    prisma.device.count.mockImplementation(
      async (args?: { where?: { status?: string } }) => {
        const s = args?.where?.status;
        if (s === "ACTIVE") return 6;
        if (s === "BLOCKED") return 1;
        return 7;
      },
    );
    prisma.session.count.mockResolvedValue(4);
    prisma.watchHistory.count.mockResolvedValue(120);
    prisma.channel.count.mockImplementation(
      async (args?: {
        where?: { streamStatus?: string | { in: string[] } };
      }) => {
        const s = args?.where?.streamStatus;
        if (s === "ONLINE") return 9000;
        if (s === "OFFLINE") return 500;
        if (s !== undefined && typeof s === "object" && "in" in s) return 700;
        return 9910;
      },
    );
    prisma.customer.findFirst.mockResolvedValue({
      lastSeenAt: new Date("2026-09-05T12:00:00.000Z"),
    });

    const stats = await service.getStats();

    expect(stats.customers).toEqual({
      total: 8,
      active: 5,
      expired: 2,
      suspended: 1,
    });
    expect(stats.codes).toEqual({
      total: 10,
      pending: 4,
      active: 3,
      revoked: 2,
    });
    expect(stats.devices).toEqual({ total: 7, active: 6, blocked: 1 });
    expect(stats.sessions).toEqual({ active: 4 });
    expect(stats.activations).toEqual({ total: 3 });
    expect(stats.playback).toEqual({ plays: 120, errors: 700 });
    expect(stats.channels).toEqual({ total: 9910, online: 9000, offline: 500 });
    expect(stats.lastSeenAt).toBe("2026-09-05T12:00:00.000Z");
  });
});
