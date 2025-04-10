import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateQuestionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  options?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  answers: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  acceptableAnswers?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  answerKeywords?: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  expectedResponseFormat: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  score?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  explanation: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  labelLocationX?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  labelLocationY?: number;
}

// Task DTO
class CreateTaskDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ type: [CreateQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}

// Section DTO
class CreateSectionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  instruction: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  contextText?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  contextImage?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  contextAudio?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  contextVideo?: string;

  @ApiProperty({ type: [CreateTaskDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskDto)
  tasks: CreateTaskDto[];
}

// Main Test DTO
export class CreateTestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  gradeLevel: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty()
  @IsNumber()
  sectionCount: number;

  @ApiProperty({ type: [CreateSectionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSectionDto)
  sections: CreateSectionDto[];

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
