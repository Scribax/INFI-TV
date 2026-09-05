import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";

/**
 * Hashing de contraseñas administrativas con argon2id.
 * Toda la lógica de hashing pasa por aquí para poder
 * rotar de algoritmo sin tocar los servicios.
 */
@Injectable()
export class PasswordService {
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain);
  }

  /**
   * Un hash malformado nunca autentica y nunca filtra detalle.
   */
  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}
