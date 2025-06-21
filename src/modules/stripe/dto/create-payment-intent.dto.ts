import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'ID of the pack to purchase',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  packId: string;
} 