import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { PackRepository } from './pack.repository';
import { CreatePackDto } from './dto/create-pack.dto';
import { UpdatePackDto } from './dto/update-pack.dto';
import { GetPacksDto } from './dto/get-packs.dto';
import { PackResponseDto, PaginatedPacksResponseDto, PackStatsResponseDto } from './dto/pack.response.dto';

/**
 * Service for handling pack business logic
 * @description Provides high-level operations for pack management
 */
@Injectable()
export class PackService {
  private readonly logger = new Logger(PackService.name);

  constructor(private readonly packRepository: PackRepository) {}

  /**
   * Get paginated packs with filtering
   * @param query - Query parameters for pagination and filtering
   * @returns Paginated packs
   */
  async getPacks(query: GetPacksDto): Promise<PaginatedPacksResponseDto> {
    try {
      this.logger.debug(`Getting packs with query: ${JSON.stringify(query)}`);
      
      const result = await this.packRepository.getPacks(query);
      
      this.logger.debug(`Found ${result.total} packs`);
      return result as PaginatedPacksResponseDto;
    } catch (error) {
      this.logger.error(`Failed to get packs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a single pack by ID
   * @param id - Pack ID
   * @returns The pack
   */
  async getPackById(id: string): Promise<PackResponseDto> {
    try {
      this.logger.debug(`Getting pack by ID: ${id}`);
      
      const pack = await this.packRepository.getPackById(id);
      
      this.logger.debug(`Found pack: ${pack.name}`);
      return pack as PackResponseDto;
    } catch (error) {
      this.logger.error(`Failed to get pack ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new pack (Admin only)
   * @param createPackDto - Pack data
   * @returns Created pack
   */
  async createPack(createPackDto: CreatePackDto): Promise<PackResponseDto> {
    try {
      this.logger.debug(`Creating pack: ${createPackDto.name}`);

      // Validate pack name uniqueness
      const nameExists = await this.packRepository.isPackNameExists(createPackDto.name);
      if (nameExists) {
        throw new ConflictException('Pack name already exists');
      }

      // Validate business rules
      this.validatePackData(createPackDto);

      const pack = await this.packRepository.createPack(createPackDto);
      
      this.logger.log(`Created pack: ${pack.id} - ${pack.name}`);
      return pack as PackResponseDto;
    } catch (error) {
      this.logger.error(`Failed to create pack: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a pack (Admin only)
   * @param id - Pack ID
   * @param updatePackDto - Update data
   * @returns Updated pack
   */
  async updatePack(id: string, updatePackDto: UpdatePackDto): Promise<PackResponseDto> {
    try {
      this.logger.debug(`Updating pack ${id}: ${JSON.stringify(updatePackDto)}`);

      // Check if pack exists
      await this.packRepository.getPackById(id);

      // Validate pack name uniqueness if name is being updated
      if (updatePackDto.name) {
        const nameExists = await this.packRepository.isPackNameExists(updatePackDto.name, id);
        if (nameExists) {
          throw new ConflictException('Pack name already exists');
        }
      }

      // Validate business rules
      this.validatePackData(updatePackDto);

      const pack = await this.packRepository.updatePack(id, updatePackDto);
      
      this.logger.log(`Updated pack: ${pack.id} - ${pack.name}`);
      return pack as PackResponseDto;
    } catch (error) {
      this.logger.error(`Failed to update pack ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a pack (Admin only)
   * @param id - Pack ID
   * @returns Deletion result
   */
  async deletePack(id: string) {
    try {
      this.logger.debug(`Deleting pack: ${id}`);

      // Check if pack exists
      await this.packRepository.getPackById(id);

      const result = await this.packRepository.deletePack(id);
      
      this.logger.log(`Deleted pack: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete pack ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get pack statistics
   * @returns Pack statistics
   */
  async getPackStats(): Promise<PackStatsResponseDto> {
    try {
      this.logger.debug('Getting pack statistics');
      
      const stats = await this.packRepository.getPackStats();
      
      this.logger.debug(`Pack stats: ${JSON.stringify(stats)}`);
      return stats;
    } catch (error) {
      this.logger.error(`Failed to get pack stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get daily packs (for users)
   * @returns Array of daily packs
   */
  async getDailyPacks(): Promise<PackResponseDto[]> {
    try {
      this.logger.debug('Getting daily packs');
      
      const packs = await this.packRepository.getDailyPacks();
      
      this.logger.debug(`Found ${packs.length} daily packs`);
      return packs as PackResponseDto[];
    } catch (error) {
      this.logger.error(`Failed to get daily packs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get free packs (for users)
   * @returns Array of free packs
   */
  async getFreePacks(): Promise<PackResponseDto[]> {
    try {
      this.logger.debug('Getting free packs');
      
      const packs = await this.packRepository.getFreePacks();
      
      this.logger.debug(`Found ${packs.length} free packs`);
      return packs as PackResponseDto[];
    } catch (error) {
      this.logger.error(`Failed to get free packs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get discounted packs (for users)
   * @returns Array of discounted packs
   */
  async getDiscountedPacks(): Promise<PackResponseDto[]> {
    try {
      this.logger.debug('Getting discounted packs');
      
      const packs = await this.packRepository.getDiscountedPacks();
      
      this.logger.debug(`Found ${packs.length} discounted packs`);
      return packs as PackResponseDto[];
    } catch (error) {
      this.logger.error(`Failed to get discounted packs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate pack data according to business rules
   * @param packData - Pack data to validate
   */
  private validatePackData(packData: CreatePackDto | UpdatePackDto) {
    // Validate price (in cents)
    if (packData.price !== undefined) {
      if (packData.price < 0) {
        throw new BadRequestException('Price cannot be negative');
      }
      if (packData.price > 99999) { // $999.99 in cents
        throw new BadRequestException('Price cannot exceed $999.99');
      }
    }

    // Validate discount percentage
    if (packData.discountPerCent !== undefined) {
      if (packData.discountPerCent < 0 || packData.discountPerCent > 100) {
        throw new BadRequestException('Discount percentage must be between 0 and 100');
      }
    }

    // Validate bonus count
    if (packData.bonusCount !== undefined) {
      if (packData.bonusCount < 0) {
        throw new BadRequestException('Bonus count cannot be negative');
      }
    }

    // Validate coins count
    if (packData.coinsCount !== undefined) {
      if (packData.coinsCount < 1) {
        throw new BadRequestException('Coins count must be at least 1');
      }
      if (packData.coinsCount > 10000) {
        throw new BadRequestException('Coins count cannot exceed 10000');
      }
    }

    // Validate arrays
    if (packData.advantages !== undefined) {
      if (packData.advantages.length > 10) {
        throw new BadRequestException('Advantages cannot exceed 10 items');
      }
    }

    if (packData.disadvantages !== undefined) {
      if (packData.disadvantages.length > 10) {
        throw new BadRequestException('Disadvantages cannot exceed 10 items');
      }
    }

    // Business rule: Free packs should have price = 0
    if (packData.isFree && packData.price !== undefined && packData.price > 0) {
      throw new BadRequestException('Free packs must have price = 0');
    }

    // Business rule: Free packs should not have discounts
    if (packData.isFree && packData.discountPerCent && packData.discountPerCent > 0) {
      throw new BadRequestException('Free packs cannot have discounts');
    }

    // Business rule: Daily packs should have some advantage
    if (packData.isDaily && (!packData.discountPerCent || packData.discountPerCent === 0)) {
      this.logger.warn('Daily pack created without discount - consider adding value');
    }

    // Business rule: Price should be reasonable for coin count
    if (packData.price !== undefined && packData.coinsCount !== undefined) {
      const pricePerCoin = packData.price / packData.coinsCount;
      if (pricePerCoin > 100) { // More than $1 per coin
        this.logger.warn(`High price per coin: ${pricePerCoin} cents per coin`);
      }
    }
  }

  /**
   * Calculate effective coin value of a pack
   * @param pack - Pack data
   * @returns Effective coin value
   */
  calculateEffectiveCoins(pack: PackResponseDto): number {
    const baseCoins = pack.coinsCount;
    const bonusCoins = pack.bonusCount || 0;
    return baseCoins + bonusCoins;
  }

  /**
   * Calculate discount amount
   * @param pack - Pack data
   * @param basePrice - Base price per coin
   * @returns Discount amount
   */
  calculateDiscountAmount(pack: PackResponseDto, basePrice: number): number {
    if (!pack.discountPerCent || pack.discountPerCent === 0) {
      return 0;
    }

    const totalCoins = this.calculateEffectiveCoins(pack);
    const totalPrice = totalCoins * basePrice;
    return (totalPrice * pack.discountPerCent) / 100;
  }

  /**
   * Convert dollars to cents
   * @param dollars - Price in dollars
   * @returns Price in cents
   */
  convertDollarsToCents(dollars: number): number {
    return Math.round(dollars * 100);
  }

  /**
   * Convert cents to dollars
   * @param cents - Price in cents
   * @returns Price in dollars
   */
  convertCentsToDollars(cents: number): number {
    return cents / 100;
  }

  /**
   * Format price for display
   * @param cents - Price in cents
   * @returns Formatted price string
   */
  formatPrice(cents: number): string {
    const dollars = this.convertCentsToDollars(cents);
    return `$${dollars.toFixed(2)}`;
  }

  /**
   * Calculate price per coin
   * @param pack - Pack data
   * @returns Price per coin in cents
   */
  calculatePricePerCoin(pack: PackResponseDto): number {
    const effectiveCoins = this.calculateEffectiveCoins(pack);
    return effectiveCoins > 0 ? pack.price / effectiveCoins : 0;
  }

  /**
   * Calculate discounted price
   * @param pack - Pack data
   * @returns Discounted price in cents
   */
  calculateDiscountedPrice(pack: PackResponseDto): number {
    if (!pack.discountPerCent || pack.discountPerCent === 0) {
      return pack.price;
    }
    
    const discountAmount = (pack.price * pack.discountPerCent) / 100;
    return pack.price - discountAmount;
  }
}
