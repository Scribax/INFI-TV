import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface AbuseRecord {
  count: number;
  firstAt: number;
  blockedUntil: number;
}

/**
 * Detección de abuso y bloqueo temporal de activaciones (§37).
 * Store en memoria (una instancia); para multi-instancia se reemplaza por
 * Redis en la fase de deployment. Claves por IP y por appInstanceId.
 */
@Injectable()
export class ActivationAbuseService {
  private readonly logger = new Logger(ActivationAbuseService.name);
  private readonly records = new Map<string, AbuseRecord>();

  constructor(private readonly config: ConfigService) {}

  private maxFailures(): number {
    return this.config.get<number>("app.abuseMaxFailures") ?? 10;
  }

  private windowMs(): number {
    return this.config.get<number>("app.abuseWindowMs") ?? 900_000;
  }

  private blockMs(): number {
    return this.config.get<number>("app.abuseBlockMs") ?? 1_800_000;
  }

  isBlocked(key: string): boolean {
    const rec = this.records.get(key);
    if (rec === undefined) {
      return false;
    }
    const now = Date.now();
    if (rec.blockedUntil > now) {
      return true;
    }
    if (now - rec.firstAt > this.windowMs()) {
      this.records.delete(key);
    }
    return false;
  }

  recordFailure(key: string): void {
    const now = Date.now();
    const rec = this.records.get(key);
    if (rec === undefined || now - rec.firstAt > this.windowMs()) {
      this.records.set(key, { count: 1, firstAt: now, blockedUntil: 0 });
      return;
    }
    rec.count += 1;
    if (rec.count >= this.maxFailures()) {
      rec.blockedUntil = now + this.blockMs();
      this.logger.warn(
        `Abuso de activación detectado en ${key}: bloqueado ${this.blockMs()}ms`,
      );
    }
  }
}
