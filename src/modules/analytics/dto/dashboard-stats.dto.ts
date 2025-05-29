import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardStatsDto {
  @ApiPropertyOptional({
    description: 'Start date for the analysis (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the analysis (YYYY-MM-DD)',
    example: '2024-03-15',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Number of latest tests to return',
    example: 5,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limitLatestTests?: number = 5;
} 