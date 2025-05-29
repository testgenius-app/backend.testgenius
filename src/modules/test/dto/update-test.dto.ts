import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty } from 'class-validator';
import { IsBoolean} from 'class-validator';
import { IsOptional } from 'class-validator';

export class UpdateTestDto{
  @ApiProperty()
  @IsString()
  @IsOptional()
  title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  subject: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  gradeLevel: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
