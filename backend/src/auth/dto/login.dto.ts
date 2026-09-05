import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "admin@infitv.local" })
  @IsEmail({}, { message: "Email inválido." })
  @MaxLength(254)
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8, { message: "Credenciales inválidas." })
  @MaxLength(128)
  password!: string;
}
