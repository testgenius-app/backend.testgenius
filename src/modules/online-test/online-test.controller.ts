import { Controller, UseGuards, Get, Param, Query } from '@nestjs/common';
import { OnlineTestService } from './online-test.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';

@ApiTags('Online Test')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'online-test', version: '1' })
export class OnlineTestController {
  constructor(private readonly onlineTestService: OnlineTestService) {}

  @Get()
  @ApiOperation({ summary: 'Get all online tests' })
  @ApiResponse({ status: 200, description: 'Returns a list of all online tests without their results' })
  async getAllOnlineTests() {
    return this.onlineTestService._getAllOnlineTests();
  }

  @Get(':testId')
  @ApiOperation({ summary: 'Get online test by test ID' })
  @ApiParam({ name: 'testId', description: 'ID of the test' })
  @ApiQuery({ name: 'includeAnswers', required: false, type: Boolean, description: 'Whether to include answers in the response' })
  @ApiResponse({ status: 200, description: 'Returns the online test' })
  async getOnlineTest(
    @Param('testId') testId: string,
    @Query('includeAnswers') includeAnswers?: boolean,
  ) {
    return this.onlineTestService._getOnlineTestByTestId(testId, includeAnswers);
  }

  @Get('temp-code/:tempCodeId')
  @ApiOperation({ summary: 'Get online test by temporary code ID' })
  @ApiParam({ name: 'tempCodeId', description: 'Temporary code ID of the test' })
  @ApiResponse({ status: 200, description: 'Returns the online test' })
  async getOnlineTestByTempCode(@Param('tempCodeId') tempCodeId: string) {
    return this.onlineTestService._getOnlineTestByTempCodeId(tempCodeId);
  }

  @Get(':onlineTestId/results')
  @ApiOperation({ summary: 'Get online test results' })
  @ApiParam({ name: 'onlineTestId', description: 'ID of the online test' })
  @ApiResponse({ status: 200, description: 'Returns the online test results' })
  async getOnlineTestResults(@Param('onlineTestId') onlineTestId: string) {
    return this.onlineTestService._getOnlineTestResults(onlineTestId);
  }
}
