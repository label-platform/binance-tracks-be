import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber } from "class-validator";
import { EarningSocketDto } from "./earning-socket.dto";

export class EarningDto {
  @ApiProperty({
    isArray: true,
    type: EarningSocketDto
  })
  @IsArray()
  @Type(() => EarningSocketDto)
  data: EarningSocketDto[];
}
