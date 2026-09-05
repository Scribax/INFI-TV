import type { ConfigService } from "@nestjs/config";
import { ActivationAbuseService } from "./activation-abuse.service";

describe("ActivationAbuseService", () => {
  let service: ActivationAbuseService;

  const config = { get: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    config.get.mockImplementation((key: string) => {
      if (key === "app.abuseMaxFailures") return 3;
      if (key === "app.abuseWindowMs") return 60_000;
      if (key === "app.abuseBlockMs") return 60_000;
      return undefined;
    });
    service = new ActivationAbuseService(config as unknown as ConfigService);
  });

  it("no bloquea con menos fallos que el umbral", () => {
    service.recordFailure("ip:1");
    service.recordFailure("ip:1");
    expect(service.isBlocked("ip:1")).toBe(false);
  });

  it("bloquea tras alcanzar el umbral", () => {
    service.recordFailure("ip:2");
    service.recordFailure("ip:2");
    service.recordFailure("ip:2");
    expect(service.isBlocked("ip:2")).toBe(true);
  });

  it("resetea la ventana al pasar el tiempo", () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(0);
      service.recordFailure("ip:3");
      service.recordFailure("ip:3");
      jest.setSystemTime(61_000); // > windowMs
      expect(service.isBlocked("ip:3")).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it("las claves son independientes", () => {
    service.recordFailure("ip:4");
    service.recordFailure("device:abc");
    expect(service.isBlocked("ip:4")).toBe(false);
    expect(service.isBlocked("device:abc")).toBe(false);
  });
});
