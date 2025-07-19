import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { PackService } from './pack.service';
import { CreatePackDto } from './dto/create-pack.dto';
import { UpdatePackDto } from './dto/update-pack.dto';
import { PackResponseDto, PackStatsResponseDto } from './dto/pack.response.dto';
import { AdminGuard } from 'src/common/guards/admin.guard';

/**
 * Controller for handling pack-related HTTP requests
 * @description Provides REST API endpoints for pack management with role-based access
 */
@ApiTags('Packs')
@Controller({ path: 'packs', version: '1' })
@ApiBearerAuth('access-token')
export class PackController {
  constructor(private readonly packService: PackService) {}

  /**
   * Get paginated packs with filtering (Public access)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get packs',
    description:
      'Retrieve paginated packs with filtering options (public access)',
  })
  @ApiResponse({
    status: 200,
    description: 'Packs retrieved successfully',
  })
  async getPacks() {
    return this.packService.getPacks();
  }

  /**
   * Get pack statistics (Admin only)
   */
  @Get('stats')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get pack statistics',
    description: 'Retrieve pack statistics (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: PackStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getPackStats(): Promise<PackStatsResponseDto> {
    return this.packService.getPackStats();
  }

  /**
   * Get daily packs (Public access)
   */
  @Get('daily')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get daily packs',
    description: 'Retrieve all daily packs (public access)',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily packs retrieved successfully',
    type: [PackResponseDto],
  })
  async getDailyPacks(): Promise<PackResponseDto[]> {
    return this.packService.getDailyPacks();
  }

  /**
   * Get free packs (Public access)
   */
  @Get('free')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get free packs',
    description: 'Retrieve all free packs (public access)',
  })
  @ApiResponse({
    status: 200,
    description: 'Free packs retrieved successfully',
    type: [PackResponseDto],
  })
  async getFreePacks(): Promise<PackResponseDto[]> {
    return this.packService.getFreePacks();
  }

  /**
   * Get discounted packs (Public access)
   */
  @Get('discounted')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get discounted packs',
    description: 'Retrieve all discounted packs (public access)',
  })
  @ApiResponse({
    status: 200,
    description: 'Discounted packs retrieved successfully',
    type: [PackResponseDto],
  })
  async getDiscountedPacks(): Promise<PackResponseDto[]> {
    return this.packService.getDiscountedPacks();
  }

  /**
   * Get a specific pack by ID (Public access)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get pack by ID',
    description: 'Retrieve a specific pack by ID (public access)',
  })
  @ApiParam({
    name: 'id',
    description: 'Pack ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Pack retrieved successfully',
    type: PackResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pack not found' })
  async getPackById(@Param('id') id: string): Promise<PackResponseDto> {
    return this.packService.getPackById(id);
  }

  /**
   * Create a new pack (Admin only)
   */
  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create pack',
    description: 'Create a new coin pack (Admin only)',
  })
  @ApiBody({
    type: CreatePackDto,
    description: 'Pack data',
  })
  @ApiResponse({
    status: 201,
    description: 'Pack created successfully',
    type: PackResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Pack name already exists',
  })
  async createPack(
    @Body(new ValidationPipe({ transform: true })) createPackDto: CreatePackDto,
  ): Promise<PackResponseDto> {
    return this.packService.createPack(createPackDto);
  }

  /**
   * Update a pack (Admin only)
   */
  @Patch(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update pack',
    description: 'Update an existing pack (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Pack ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdatePackDto,
    description: 'Update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Pack updated successfully',
    type: PackResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Pack not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Pack name already exists',
  })
  async updatePack(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) updatePackDto: UpdatePackDto,
  ): Promise<PackResponseDto> {
    return this.packService.updatePack(id, updatePackDto);
  }

  /**
   * Delete a pack (Admin only)
   */
  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete pack',
    description: 'Delete a pack (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Pack ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Pack deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Pack deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Pack not found' })
  async deletePack(@Param('id') id: string) {
    return this.packService.deletePack(id);
  }
}
