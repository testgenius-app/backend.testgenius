import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { TestService } from './test.service';
import { FilterDto } from './dto/filter.dto';
import { IUser } from 'src/core/types/iuser.type';
import { User } from 'src/common/decorators/user.decorator';
import { Test } from '@prisma/client';
import { CreateTestDto } from './dto/create-test.dto';
import { DownloadDto } from './dto/download.dto';

@ApiTags('Test')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'test', version: '1' })
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get()
  async getTestsByOwnerId(
    @User() user: IUser,
    @Query() filterDto: FilterDto,
  ): Promise<{ tests: Test[]; count: number }> {
    return this.testService.getTestsByOwnerId(user, filterDto);
  }

  @Post()
  async createTest(
    @User() user: IUser,
    @Body() body: CreateTestDto,
  ): Promise<any> {
    return this.testService.create(user, body);
  }

  @Post('download')
  async downloadTest(
    @User() user: IUser,
    @Query() query: DownloadDto,
  ): Promise<any> {
    return this.testService.downloadTest(user, query);
  }
}
