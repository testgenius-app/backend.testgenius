import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { IPagination, TestService } from './services/test.service';
import { FilterDto } from './dto/filter.dto';
import { IUser } from 'src/core/types/iuser.type';
import { User } from 'src/common/decorators/user.decorator';
import { Test } from '@prisma/client';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { DownloadDto } from './dto/download.dto';
import { Response } from 'express';

@ApiTags('Test')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'test', version: '1' })
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get()
  @ApiOperation({
    summary: 'Get tests by owner ID',
    description: 'Retrieves all tests belonging to the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns tests and count',
    type: Object,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTestsByOwnerId(
    @User() user: IUser,
    @Query() filterDto: FilterDto,
  ): Promise<{ tests: Test[]; pagination: IPagination }> {
    return this.testService.getTestsByOwnerId(user, filterDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get test by ID',
    description: 'Retrieves a specific test by its ID',
  })
  @ApiResponse({ status: 200, description: 'Returns the test' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Test not found' })
  async getTestById(
    @User() user: IUser,
    @Query('id') id: string,
  ): Promise<Test> {
    return this.testService.getTestById(id, user);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new test',
    description: 'Creates a new test for the authenticated user',
  })
  @ApiResponse({ status: 201, description: 'Test created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createTest(
    @User() user: IUser,
    @Body() body: CreateTestDto,
  ): Promise<any> {
    return this.testService.create(user, body);
  }

  @Post('download')
  @ApiOperation({
    summary: 'Download test',
    description: 'Downloads test file based on provided criteria',
  })
  @ApiResponse({ status: 200, description: 'Returns test file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Test not found' })
  async downloadTest(
    @User() user: IUser,
    @Query() query: DownloadDto,
    @Res() res: Response,
  ): Promise<any> {
    return this.testService.downloadTest(user, query, res);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update test',
    description: 'Updates an existing test by its ID',
  })
  @ApiParam({ name: 'id', description: 'ID of the test to update' })
  @ApiResponse({ status: 200, description: 'Test updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Test not found' })
  async updateTest(
    @User() user: IUser,
    @Param('id') id: string,
    @Body() body: UpdateTestDto,
  ): Promise<Test> {
    return this.testService.updateTest(id, user, body);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete test',
    description: 'Deletes a test by its ID',
  })
  @ApiParam({ name: 'id', description: 'ID of the test to delete' })
  @ApiResponse({ status: 200, description: 'Test deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Test not found' })
  async deleteTest(
    @User() user: IUser,
    @Param('id') id: string,
  ): Promise<Test> {
    return this.testService.deleteTest(id, user);
  }
}
