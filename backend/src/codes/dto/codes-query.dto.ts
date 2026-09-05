import { ApiPropertyOptional } from "@nestjs/swagger";
import { ActivationCodeStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CodesQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ description: "Busca por prefijo visible" })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  search?: string;

  @ApiPropertyOptional({ enum: ActivationCodeStatus })
  @IsOptional()
  @IsEnum(ActivationCodeStatus)
  status?: ActivationCodeStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  planId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  customerId?: string;
}
