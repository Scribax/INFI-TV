import { HttpException, HttpStatus } from "@nestjs/common";
import type { ApiErrorCode } from "@infitv/types";

/**
 * Error de dominio con código estable para la API.
 * El filtro global respeta { code, message } y solo mapea por status
 * cuando el error no trae código propio.
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  status: HttpStatus,
): HttpException {
  return new HttpException({ error: { code, message } }, status);
}

export const INVALID_CODE = (): HttpException =>
  apiError(
    "INVALID_ACTIVATION_CODE",
    "Código inválido o no disponible.",
    HttpStatus.UNAUTHORIZED,
  );

export const DEVICE_LIMIT = (): HttpException =>
  apiError(
    "DEVICE_LIMIT_REACHED",
    "Este código ya alcanzó el límite de dispositivos.",
    HttpStatus.FORBIDDEN,
  );
