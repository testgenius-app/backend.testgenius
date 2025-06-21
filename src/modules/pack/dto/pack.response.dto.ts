import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for a single pack
 */
export class PackResponseDto {
  @ApiProperty({
    description: 'Unique pack identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Name of the pack',
    example: 'Starter Pack'
  })
  name: string;

  @ApiProperty({
    description: 'Price in cents (divide by 100 to get dollars). Example: 999 cents = $9.99',
    example: 999
  })
  price: number;

  @ApiProperty({
    description: 'Number of coins in the pack',
    example: 100
  })
  coinsCount: number;

  @ApiProperty({
    description: 'Discount percentage',
    example: 20,
    required: false
  })
  discountPerCent?: number;

  @ApiProperty({
    description: 'Bonus coins included',
    example: 10,
    required: false
  })
  bonusCount?: number;

  @ApiProperty({
    description: 'List of advantages',
    example: ['Best value for money', 'Instant delivery'],
    type: [String]
  })
  advantages: string[];

  @ApiProperty({
    description: 'List of disadvantages',
    example: ['Limited time offer'],
    type: [String]
  })
  disadvantages: string[];

  @ApiProperty({
    description: 'Whether this is a daily pack',
    example: false
  })
  isDaily: boolean;

  @ApiProperty({
    description: 'Whether this pack is free',
    example: false
  })
  isFree: boolean;

  @ApiProperty({
    description: 'When the pack was created',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the pack was last updated',
    example: '2024-01-15T10:30:00Z'
  })
  updatedAt: Date;
}

/**
 * Response DTO for paginated packs
 */
export class PaginatedPacksResponseDto {
  @ApiProperty({
    description: 'Array of packs',
    type: [PackResponseDto]
  })
  packs: PackResponseDto[];

  @ApiProperty({
    description: 'Current page number',
    example: 1
  })
  page: number;

  @ApiProperty({
    description: 'Number of packs per page',
    example: 10
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of packs',
    example: 25
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there are more pages',
    example: true
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there are previous pages',
    example: false
  })
  hasPrev: boolean;
}

/**
 * Response DTO for pack statistics
 */
export class PackStatsResponseDto {
  @ApiProperty({
    description: 'Total number of packs',
    example: 25
  })
  total: number;

  @ApiProperty({
    description: 'Number of daily packs',
    example: 5
  })
  dailyPacks: number;

  @ApiProperty({
    description: 'Number of free packs',
    example: 2
  })
  freePacks: number;

  @ApiProperty({
    description: 'Number of discounted packs',
    example: 8
  })
  discountedPacks: number;
} 