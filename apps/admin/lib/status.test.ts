import { describe, expect, it } from "vitest";
import {
  CODE_STATUS_LABEL,
  CUSTOMER_STATUS_LABEL,
  DEVICE_STATUS_LABEL,
  SESSION_STATUS_LABEL,
} from "./status";

describe("status labels", () => {
  it("cubre todos los estados de cliente", () => {
    expect(Object.keys(CUSTOMER_STATUS_LABEL).sort()).toEqual([
      "ACTIVE",
      "EXPIRED",
      "SUSPENDED",
    ]);
  });

  it("cubre todos los estados de código", () => {
    expect(Object.keys(CODE_STATUS_LABEL).sort()).toEqual([
      "ACTIVE",
      "EXPIRED",
      "PENDING",
      "REVOKED",
      "SUSPENDED",
    ]);
  });

  it("cubre dispositivos y sesiones", () => {
    expect(Object.keys(DEVICE_STATUS_LABEL).sort()).toEqual([
      "ACTIVE",
      "BLOCKED",
      "REVOKED",
    ]);
    expect(Object.keys(SESSION_STATUS_LABEL).sort()).toEqual([
      "ACTIVE",
      "EXPIRED",
      "REVOKED",
    ]);
  });
});
