import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateCustomerDto {
  @ApiProperty({ example: "Kiosco Don Pepe" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName!: string;

  @ApiPropertyOptional({ description: "Si se omite, el cliente queda sin vencimiento (gestión manual)" })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  planId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  displayName?: string;

  @ApiPropertyOptional({
    description: "Cambiar de plan no modifica el vencimiento (usar renovar)",
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  planId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class SuspendCustomerDto {
  @ApiPropertyOptional({ example: "Falta de pago" })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  reason?: string;
}

export class RenewCustomerDto {
  @ApiPropertyOptional({
    description: "Por defecto se usa el plan actual del cliente",
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  planId?: string;
}
