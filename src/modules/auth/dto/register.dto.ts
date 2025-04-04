import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Ali', description: 'Foydalanuvchining ismi' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiPropertyOptional({
    example: 'Valiyev',
    description: 'Foydalanuvchining familiyasi (ixtiyoriy)',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

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
