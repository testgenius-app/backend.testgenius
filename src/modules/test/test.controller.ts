import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { TestService } from './test.service';
import { FilterDto } from './dto/filter.dto';
import { IUser } from 'src/core/types/iuser.type';
import { User } from 'src/common/decorators/user.decorator';
import { Test } from '@prisma/client';

@ApiTags('Test')
@Controller({ path: 'test', version: '1' })
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  async getTestsByOwnerId(
    @User() user: IUser,
    @Query() filterDto: FilterDto,
  ): Promise<{ tests: Test[]; count: number }> {
    return this.testService.getTestsByOwnerId(user, filterDto);
  }
}
