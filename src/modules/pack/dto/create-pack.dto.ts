import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsInt, 
  IsOptional, 
  IsBoolean, 
  IsArray, 
  Min, 
  Max, 
  IsUUID,
  ArrayMinSize,
  ArrayMaxSize,
  IsNotEmpty,
  IsNumber
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for creating coin packs
 * @description Used by admins to create new coin packs for users to purchase
 */
export class CreatePackDto {
  @ApiProperty({
    description: 'Name of the pack',
    example: 'Starter Pack',
    minLength: 1,
    maxLength: 100
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    description: 'Price in dollars (will be converted to cents)',
    example: 9.99,
    minimum: 0,
    maximum: 999.99
  })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  @ApiProperty({
    description: 'Number of coins in the pack',
    example: 100,
    minimum: 1,
    maximum: 10000
  })
  @IsInt({ message: 'Coins count must be an integer' })
  @Min(1, { message: 'Coins count must be at least 1' })
  @Max(10000, { message: 'Coins count cannot exceed 10000' })
  coinsCount: number;

  @ApiProperty({
    description: 'Discount percentage (0-100)',
    example: 20,
    minimum: 0,
    maximum: 100,
    required: false
  })
  @IsOptional()
  @IsInt({ message: 'Discount percentage must be an integer' })
  @Min(0, { message: 'Discount percentage cannot be negative' })
  @Max(100, { message: 'Discount percentage cannot exceed 100' })
  discountPerCent?: number;

  @ApiProperty({
    description: 'Bonus coins included in the pack',
    example: 10,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsInt({ message: 'Bonus count must be an integer' })
  @Min(0, { message: 'Bonus count cannot be negative' })
  bonusCount?: number;

  @ApiProperty({
    description: 'List of advantages/benefits of this pack',
    example: ['Best value for money', 'Instant delivery', 'Premium support'],
    type: [String],
    minItems: 0,
    maxItems: 10
  })
  @IsOptional()
  @IsArray({ message: 'Advantages must be an array' })
  @ArrayMaxSize(10, { message: 'Advantages cannot exceed 10 items' })
  @IsString({ each: true, message: 'Each advantage must be a string' })
  advantages?: string[];

  @ApiProperty({
    description: 'List of limitations/disadvantages of this pack',
    example: ['Limited time offer', 'One-time purchase only'],
    type: [String],
    minItems: 0,
    maxItems: 10
  })
  @IsOptional()
  @IsArray({ message: 'Disadvantages must be an array' })
  @ArrayMaxSize(10, { message: 'Disadvantages cannot exceed 10 items' })
  @IsString({ each: true, message: 'Each disadvantage must be a string' })
  disadvantages?: string[];

  @ApiProperty({
    description: 'Whether this is a daily pack (special daily offer)',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Is daily must be a boolean' })
  isDaily?: boolean;

  @ApiProperty({
    description: 'Whether this pack is free (no cost)',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: 'Is free must be a boolean' })
  isFree?: boolean;
}
