import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'ali@example.com',
    description: 'Foydalanuvchining email manzili',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPassword123',
    description: 'Foydalanuvchi paroli',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
