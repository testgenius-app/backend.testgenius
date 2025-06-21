import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreatePackDto } from './dto/create-pack.dto';
import { UpdatePackDto } from './dto/update-pack.dto';
import { GetPacksDto } from './dto/get-packs.dto';

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
  async getPacks(query: GetPacksDto) {
    const { page = 1, limit = 10, isDaily, isFree, hasDiscount, search, sortBy = 'createdAt', sortOrder = 'desc', minPrice, maxPrice } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (isDaily !== undefined) {
      where.isDaily = isDaily;
    }

    if (isFree !== undefined) {
      where.isFree = isFree;
    }

    if (hasDiscount !== undefined) {
      if (hasDiscount) {
        where.discountPerCent = { not: null, gt: 0 };
      } else {
        where.OR = [
          { discountPerCent: null },
          { discountPerCent: 0 }
        ];
      }
    }

    // Price filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive' as const,
      };
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get packs with pagination
    const [packs, total] = await Promise.all([
      this.prisma.pack.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.pack.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      packs,
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
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

      this.logger.log(`Created pack: ${pack.id} - ${pack.name} - Price: ${pack.price} cents`);
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
      this.logger.error(`Failed to update pack ${id}: ${error.message}`, error.stack);
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
      this.logger.error(`Failed to delete pack ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get pack statistics
   * @returns Pack statistics
   */
  async getPackStats() {
    try {
      const [total, dailyPacks, freePacks, discountedPacks] = await Promise.all([
        this.prisma.pack.count(),
        this.prisma.pack.count({ where: { isDaily: true } }),
        this.prisma.pack.count({ where: { isFree: true } }),
        this.prisma.pack.count({ 
          where: { 
            discountPerCent: { not: null, gt: 0 } 
          } 
        }),
      ]);

      return {
        total,
        dailyPacks,
        freePacks,
        discountedPacks,
      };
    } catch (error) {
      this.logger.error(`Failed to get pack stats: ${error.message}`, error.stack);
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
        discountPerCent: { not: null, gt: 0 } 
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
} 