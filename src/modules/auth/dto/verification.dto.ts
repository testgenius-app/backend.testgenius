import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerificationDto {
  @ApiProperty({ example: '123456', description: 'Verification code' })
  @IsNotEmpty()
  @IsString()
  code: string;
  @ApiProperty({ example: '123456', description: 'Verification token' })
  @IsNotEmpty()
  @IsString()
  token: string;
}
