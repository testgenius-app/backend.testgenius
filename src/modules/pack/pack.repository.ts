import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreatePackDto } from './dto/create-pack.dto';
import { UpdatePackDto } from './dto/update-pack.dto';

/**
 * Repository for handling pack database operations
 * @description Provides methods for CRUD operations on packs
 */
@Injectable()
export class PackRepository {
  private readonly logger = new Logger(PackRepository.name);

  constructor(private readonly prisma: PrismaService) {}
  /**
   * Get paginated packs with filtering
   * @param query - Query parameters for pagination and filtering
   * @returns Paginated packs
   */

  async getPacks() {
    const packs = await this.prisma.pack.findMany({
      orderBy: { price: 'asc' },
    });
    if (packs.length > 0) {
      return packs.map((pack) => {
        return {
          ...pack,
          price: this.convertCentsToDollars(pack.price),
        };
      });
    }
    return [];
  }

  /**
   * Get a single pack by ID
   * @param id - Pack ID
   * @returns The pack if found
   */
  async getPackById(id: string) {
    const pack = await this.prisma.pack.findUnique({
      where: { id },
    });

    if (!pack) {
      throw new NotFoundException('Pack not found');
    }

    pack.price = this.convertCentsToDollars(pack.price);

    return pack;
  }

  /**
   * Create a new pack
   * @param createPackDto - Pack data
   * @returns Created pack
   */
  async createPack(createPackDto: CreatePackDto) {
    try {
      const pack = await this.prisma.pack.create({
        data: {
          name: createPackDto.name,
          price: createPackDto.price,
          coinsCount: createPackDto.coinsCount,
          discountPerCent: createPackDto.discountPerCent,
          bonusCount: createPackDto.bonusCount || 0,
          advantages: createPackDto.advantages || [],
          disadvantages: createPackDto.disadvantages || [],
          isDaily: createPackDto.isDaily || false,
          isFree: createPackDto.isFree || false,
        },
      });

      this.logger.log(
        `Created pack: ${pack.id} - ${pack.name} - Price: ${pack.price} cents`,
      );
      return pack;
    } catch (error) {
      this.logger.error(`Failed to create pack: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a pack
   * @param id - Pack ID
   * @param updatePackDto - Update data
   * @returns Updated pack
   */
  async updatePack(id: string, updatePackDto: UpdatePackDto) {
    try {
      // Check if pack exists
      await this.getPackById(id);

      const pack = await this.prisma.pack.update({
        where: { id },
        data: updatePackDto,
      });

      this.logger.log(`Updated pack: ${pack.id} - ${pack.name}`);
      return pack;
    } catch (error) {
      this.logger.error(
        `Failed to update pack ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete a pack
   * @param id - Pack ID
   * @returns Deletion result
   */
  async deletePack(id: string) {
    try {
      // Check if pack exists
      await this.getPackById(id);

      await this.prisma.pack.delete({
        where: { id },
      });

      this.logger.log(`Deleted pack: ${id}`);
      return { message: 'Pack deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete pack ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get pack statistics
   * @returns Pack statistics
   */
  async getPackStats() {
    try {
      const [total, dailyPacks, freePacks, discountedPacks] = await Promise.all(
        [
          this.prisma.pack.count(),
          this.prisma.pack.count({ where: { isDaily: true } }),
          this.prisma.pack.count({ where: { isFree: true } }),
          this.prisma.pack.count({
            where: {
              discountPerCent: { not: null, gt: 0 },
            },
          }),
        ],
      );

      return {
        total,
        dailyPacks,
        freePacks,
        discountedPacks,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get pack stats: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get daily packs
   * @returns Array of daily packs
   */
  async getDailyPacks() {
    return this.prisma.pack.findMany({
      where: { isDaily: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get free packs
   * @returns Array of free packs
   */
  async getFreePacks() {
    return this.prisma.pack.findMany({
      where: { isFree: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get discounted packs
   * @returns Array of discounted packs
   */
  async getDiscountedPacks() {
    return this.prisma.pack.findMany({
      where: {
        discountPerCent: { not: null, gt: 0 },
      },
      orderBy: { discountPerCent: 'desc' },
    });
  }

  /**
   * Check if pack name already exists
   * @param name - Pack name
   * @param excludeId - Pack ID to exclude from check
   * @returns True if name exists
   */
  async isPackNameExists(name: string, excludeId?: string): Promise<boolean> {
    const where: any = { name };

    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const count = await this.prisma.pack.count({ where });
    return count > 0;
  }

  convertDollarsToCents(dollars: number): number {
    dollars = parseFloat(dollars.toFixed(2));
    console.log(`Converting dollars to cents: ${dollars}`);
    if (isNaN(dollars)) {
      throw new Error('Invalid price format');
    }
    if (dollars < 0) {
      throw new Error('Price cannot be negative');
    }
    if (dollars > 999.99) {
      throw new Error('Price cannot exceed $999.99');
    }
    return Math.round(dollars * 100);
  }

  convertCentsToDollars(cents: number): number {
    if (isNaN(cents)) {
      throw new Error('Invalid price format');
    }
    if (cents < 0) {
      throw new Error('Price cannot be negative');
    }
    return parseFloat((cents / 100).toFixed(2));
  }
}
