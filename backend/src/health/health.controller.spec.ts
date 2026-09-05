import { Test, TestingModule } from "@nestjs/testing";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { PrismaService } from "../common/prisma/prisma.service";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: { ping: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it("responde ok con database up", async () => {
    const res = (await controller.check()) as {
      status: string;
      database: string;
      uptimeSec: number;
    };
    expect(res.status).toBe("ok");
    expect(res.database).toBe("up");
    expect(typeof res.uptimeSec).toBe("number");
  });
});
