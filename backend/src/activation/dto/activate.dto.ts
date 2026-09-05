import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class ActivateDto {
  @ApiProperty({ example: "INFITV-7K4P-X92M" })
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  code!: string;

  @ApiProperty({ description: "UUID de instalación generado por la app" })
  @IsUUID()
  appInstanceId!: string;

  @ApiProperty({ example: "android" })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  platform!: string;

  @ApiProperty({ example: "1.0.0" })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  appVersion!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  osVersion?: string;
}

export class SessionTokenDto {
  @ApiProperty({ description: "Token de sesión opaco (64 hex chars)" })
  @IsString()
  @MaxLength(64)
  @MinLength(64)
  token!: string;
}
