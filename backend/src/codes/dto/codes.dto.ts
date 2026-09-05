import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateCodesDto {
  @ApiProperty({ description: "Plan que otorga cada código" })
  @IsString()
  @MaxLength(64)
  planId!: string;

  @ApiPropertyOptional({
    default: 1,
    description: "1–500. El texto plano se devuelve SOLO en esta respuesta.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  quantity?: number;

  @ApiPropertyOptional({ description: "Por defecto, el del plan" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  deviceLimit?: number;

  @ApiPropertyOptional({ description: "Pre-asignar a un cliente (sigue PENDING)" })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  customerId?: string;

  @ApiPropertyOptional({
    description: "Validez del código sin activar. Null = sin límite.",
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class SuspendCodeDto {
  @ApiPropertyOptional({ example: "Posible reventa" })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  reason?: string;
}

export class UpdateCodeDto {
  @ApiProperty({ description: "Nuevo límite de dispositivos (1–10)" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  deviceLimit!: number;
}
