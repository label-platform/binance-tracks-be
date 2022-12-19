import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLoginSessionDto {
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  userId: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MmNlZGM1ZjFiZTIyY2RiNTkwMjJkNWUiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImNyZWF0ZWRBdCI6IjIwMjItMDctMTNUMTQ6NTM6MTkuNDg5WiIsInVwZGF0ZWRBdCI6IjIwMjItMDctMTNUMTc6MDM6MTYuMjIyWiIsIl9fdiI6MCwidXNlcm5hbWUiOiJBZHJpZW5OZ3V5ZW4iLCJpZCI6IjYyY2VkYzVmMWJlMjJjZGI1OTAyMmQ1ZSIsImlhdCI6MTY1NzczNTkyOSwiZXhwIjoxNjU3NzM2ODI5fQ.eA4Kf4xw_vMAyZluCtW9mtcg73ylMJmsjacPsEi5CMA',
  })
  accessToken: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MmNlZGM1ZjFiZTIyY2RiNTkwMjJkNWUiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImNyZWF0ZWRBdCI6IjIwMjItMDctMTNUMTQ6NTM6MTkuNDg5WiIsInVwZGF0ZWRBdCI6IjIwMjItMDctMTNUMTc6MDM6MTYuMjIyWiIsIl9fdiI6MCwidXNlcm5hbWUiOiJBZHJpZW5OZ3V5ZW4iLCJpZCI6IjYyY2VkYzVmMWJlMjJjZGI1OTAyMmQ1ZSIsImlhdCI6MTY1NzczNTkyOSwiZXhwIjoxNjU3NzM2ODI5fQ.eA4Kf4xw_vMAyZluCtW9mtcg73ylMJmsjacPsEi5CMA',
  })
  refreshToken: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
  })
  device: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: '::ffff:127.0.0.1',
  })
  ip: string;
}
