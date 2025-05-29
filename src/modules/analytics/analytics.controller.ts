import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AnalyticsService } from './analytics.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@ApiTags('Analytics')
@Controller({ path: 'analytics', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns dashboard statistics including test creation, participation, completion rates, and activity data',
  })
  async getDashboardStats(@Query() dto: DashboardStatsDto) {
    return this.analyticsService.getDashboardStats(dto);
  }
} 