import { CallHandler, ExecutionContext } from "@nestjs/common";
import { of } from "rxjs";
import { ResponseInterceptor } from "./response.interceptor";

function runThrough(value: unknown): Promise<unknown> {
  const next: CallHandler<unknown> = {
    handle: () => of(value),
  };
  const ctx = {} as ExecutionContext;
  return new Promise((resolve, reject) => {
    new ResponseInterceptor().intercept(ctx, next).subscribe({
      next: (v: unknown) => {
        resolve(v);
      },
      error: (e: unknown) => {
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    });
  });
}

describe("ResponseInterceptor", () => {
  it("envuelve datos planos", async () => {
    await expect(runThrough({ a: 1 })).resolves.toEqual({
      success: true,
      data: { a: 1 },
    });
  });

  it("no re-envuelve si ya tiene success", async () => {
    const wrapped = { success: true, data: { a: 1 } };
    await expect(runThrough(wrapped)).resolves.toBe(wrapped);
  });
});
