import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateOnlineTestDto {
  @ApiProperty({
    description: 'The id of the test',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  testId: string;

  @ApiProperty({
    description: 'The id of the temp code',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  tempCodeId: string;
}
