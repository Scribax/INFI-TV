import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { ApiErrorCode } from "@infitv/types";
import { Request, Response } from "express";

function statusToCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return "VALIDATION_ERROR";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 429:
      return "RATE_LIMITED";
    default:
      return status >= 500 ? "INTERNAL_ERROR" : "VALIDATION_ERROR";
  }
}

function safeMessage(exception: unknown, fallback: string): string {
  if (exception instanceof HttpException) {
    const res: unknown = exception.getResponse();
    if (typeof res === "string") {
      return res;
    }
    if (typeof res === "object" && res !== null && "message" in res) {
      const m: unknown = res.message;
      if (typeof m === "string") {
        return m;
      }
      if (Array.isArray(m)) {
        const parts: unknown[] = m;
        return parts.map((part) => String(part)).join("; ");
      }
    }
    return exception.message;
  }
  return fallback;
}

/**
 * Código de dominio si el lanzador trajo { error: { code, message } }
 * (ver apiError()). Solo acepta strings: nada de stacks ni objetos.
 */
function customError(
  exception: HttpException,
): { code: string; message: string } | null {
  const res: unknown = exception.getResponse();
  if (typeof res !== "object" || res === null || !("error" in res)) {
    return null;
  }
  const err: unknown = res.error;
  if (typeof err !== "object" || err === null) {
    return null;
  }
  if (!("code" in err) || !("message" in err)) {
    return null;
  }
  const { code, message } = err;
  if (typeof code !== "string" || typeof message !== "string") {
    return null;
  }
  return { code, message };
}

/**
 * Formato de error consistente: { success: false, error: { code, message } }.
 * Nunca expone stack traces ni secretos al cliente. El detalle va a logs.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} -> ${status} ${
          exception instanceof Error ? exception.message : String(exception)
        }`,
      );
    } else {
      this.logger.warn(`${req.method} ${req.url} -> ${status}`);
    }

    const custom =
      exception instanceof HttpException ? customError(exception) : null;

    res.status(status).json({
      success: false,
      error: {
        code: custom?.code ?? statusToCode(status),
        message:
          status >= 500
            ? "Error interno del servidor."
            : (custom?.message ?? safeMessage(exception, "Solicitud inválida.")),
      },
    });
  }
}
