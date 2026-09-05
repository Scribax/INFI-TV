import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

interface AlreadyWrapped {
  success: boolean;
}

function isAlreadyWrapped(value: unknown): value is AlreadyWrapped {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("success" in value)) {
    return false;
  }
  const success: unknown = value.success;
  return typeof success === "boolean";
}

/**
 * Envuelve respuestas exitosas en { success: true, data }.
 * Si el controlador ya devolvió el envelope, lo deja intacto.
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, { success: true; data: T } | T>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<{ success: true; data: T } | T> {
    return next.handle().pipe(
      map((data: T): { success: true; data: T } | T => {
        if (isAlreadyWrapped(data)) {
          return data;
        }
        const wrapped: { success: true; data: T } = { success: true, data };
        return wrapped;
      }),
    );
  }
}
