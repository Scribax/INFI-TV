import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AdminRole } from "@prisma/client";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateAdminDto {
  @ApiProperty({ example: "operador@infitv.local" })
  @IsEmail({}, { message: "Email inválido." })
  @MaxLength(254)
  email!: string;

  @ApiProperty({ minLength: 12, maxLength: 128 })
  @IsString()
  @MinLength(12, { message: "La contraseña debe tener al menos 12 caracteres." })
  @MaxLength(128)
  password!: string;

  @ApiProperty({ enum: AdminRole, default: AdminRole.OPERATOR })
  @IsEnum(AdminRole)
  role!: AdminRole;
}

export class UpdateAdminDto {
  @ApiPropertyOptional({ enum: AdminRole })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty({ minLength: 12, maxLength: 128 })
  @IsString()
  @MinLength(12, { message: "La contraseña debe tener al menos 12 caracteres." })
  @MaxLength(128)
  newPassword!: string;

  @ApiPropertyOptional({
    description: "Obligatoria cuando el admin cambia su propia contraseña",
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  currentPassword?: string;
}
