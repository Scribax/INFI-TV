import { HttpException, HttpStatus } from "@nestjs/common";
import type { ArgumentsHost } from "@nestjs/common";
import { apiError } from "../errors/api-error";
import { HttpExceptionFilter } from "./http-exception.filter";

function runFilter(exception: unknown): {
  status: number;
  payload: unknown;
} {
  let capturedStatus = 0;
  let capturedPayload: unknown = null;
  const res = {
    status: (code: number): unknown => {
      capturedStatus = code;
      return { json: (body: unknown): void => {
        capturedPayload = body;
      } };
    },
  };
  const req = { method: "GET", url: "/x" };
  const host = {
    switchToHttp: (): unknown => ({
      getResponse: (): unknown => res,
      getRequest: (): unknown => req,
    }),
  } as unknown as ArgumentsHost;
  new HttpExceptionFilter().catch(exception, host);
  return { status: capturedStatus, payload: capturedPayload };
}

describe("HttpExceptionFilter", () => {
  it("respeta el código de dominio del lanzador", () => {
    const { status, payload } = runFilter(
      apiError("DEVICE_LIMIT_REACHED", "Límite.", HttpStatus.FORBIDDEN),
    );
    expect(status).toBe(403);
    expect(payload).toEqual({
      success: false,
      error: { code: "DEVICE_LIMIT_REACHED", message: "Límite." },
    });
  });

  it("mapea por status cuando no hay código propio", () => {
    const { payload } = runFilter(
      new HttpException("Nope.", HttpStatus.NOT_FOUND),
    );
    expect(payload).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Nope." },
    });
  });

  it("enmascara errores 500", () => {
    const { status, payload } = runFilter(new Error("secreto interno"));
    expect(status).toBe(500);
    expect(payload).toEqual({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." },
    });
  });
});
