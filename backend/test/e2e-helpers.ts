/**
 * Harness E2E: levanta la app contra una DB de test aislada
 * (`infitv_test`), nunca contra la de desarrollo.
 */
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { Client } from "pg";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { ResponseInterceptor } from "../src/common/interceptors/response.interceptor";
import { PasswordService } from "../src/auth/password.service";

export const TEST_DATABASE_URL =
  process.env["TEST_DATABASE_URL"] ??
  "postgresql://infitv:infitv@localhost:5433/infitv_test?schema=public";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string };
}

async function ensureTestDatabase(): Promise<void> {
  const url = new URL(TEST_DATABASE_URL);
  const dbName = url.pathname.replace(/^\//, "");
  url.pathname = "/postgres";
  const admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${dbName}"`);
  } catch (err: unknown) {
    // 42P04: la DB ya existe. 23505: dos workers jest la crearon a la vez.
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code !== "42P04" &&
      err.code !== "23505"
    ) {
      throw err;
    }
  } finally {
    await admin.end();
  }
  execSync("npx prisma migrate deploy", {
    cwd: join(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });
}

export interface E2EContext {
  app: INestApplication;
  api: request.Agent;
  prisma: PrismaService;
  passwords: PasswordService;
}

export async function setupE2EApp(): Promise<E2EContext> {
  process.env["DATABASE_URL"] = TEST_DATABASE_URL;
  process.env["JWT_SECRET"] = "e2e-jwt-secret-min-16-chars";
  process.env["ADMIN_JWT_SECRET"] = "e2e-admin-jwt-secret-min-16";
  process.env["CODE_PEPPER"] = "e2e-code-pepper-min-16-chars";
  await ensureTestDatabase();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.init();
  await app.listen(0);
  const url = await app.getUrl();

  return {
    app,
    api: request.agent(url),
    prisma: app.get(PrismaService),
    passwords: app.get(PasswordService),
  };
}
