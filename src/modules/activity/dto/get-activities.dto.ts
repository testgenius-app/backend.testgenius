import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { EntityType } from '@prisma/client';
import { Type } from 'class-transformer';

export class GetActivitiesDto {
  @ApiProperty({
    enum: EntityType,
    required: false,
    description: 'Filter activities by entity type',
  })
  @IsOptional()
  @IsEnum(EntityType)
  entityType?: EntityType;

  @ApiProperty({
    required: false,
    description: 'Number of activities to return',
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
