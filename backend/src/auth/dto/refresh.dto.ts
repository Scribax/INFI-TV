import { ApiProperty } from "@nestjs/swagger";
import { IsHexadecimal, IsString, Length } from "class-validator";

export class RefreshDto {
  @ApiProperty({ description: "Refresh token opaco (96 hex chars)" })
  @IsString()
  @IsHexadecimal()
  @Length(96, 96)
  refreshToken!: string;
}
