import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsInt, Min, Max, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * DTO for getting packs with pagination and filtering
 */
export class GetPacksDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Number of packs per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @ApiProperty({
    description: 'Filter by daily packs only',
    example: false,
    required: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Is daily must be a boolean' })
  isDaily?: boolean;

  @ApiProperty({
    description: 'Filter by free packs only',
    example: false,
    required: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Is free must be a boolean' })
  isFree?: boolean;

  @ApiProperty({
    description: 'Filter by discounted packs only',
    example: false,
    required: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Has discount must be a boolean' })
  hasDiscount?: boolean;

  @ApiProperty({
    description: 'Filter by maximum price in dollars',
    example: 10.99,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Max price must be a number' })
  @Min(0, { message: 'Max price cannot be negative' })
  @Transform(({ value }) => Math.round(parseFloat(value) * 100))
  maxPrice?: number;

  @ApiProperty({
    description: 'Filter by minimum price in dollars',
    example: 1.99,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Min price must be a number' })
  @Min(0, { message: 'Min price cannot be negative' })
  @Transform(({ value }) => Math.round(parseFloat(value) * 100))
  minPrice?: number;

  @ApiProperty({
    description: 'Search by pack name',
    example: 'starter',
    required: false
  })
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Sort by field',
    example: 'coinsCount',
    enum: ['name', 'price', 'coinsCount', 'discountPerCent', 'createdAt', 'updatedAt'],
    required: false
  })
  @IsOptional()
  sortBy?: 'name' | 'price' | 'coinsCount' | 'discountPerCent' | 'createdAt' | 'updatedAt';

  @ApiProperty({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
} 