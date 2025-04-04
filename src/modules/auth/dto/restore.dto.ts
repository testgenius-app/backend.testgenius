import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RestoreDto {
  @ApiProperty({
    example: 'ali@example.com',
    description: 'Foydalanuvchining email manzili',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
