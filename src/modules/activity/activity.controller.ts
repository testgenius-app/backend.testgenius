import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/auth.guard';
import { ActivityService } from './activity.service';
import { GetActivitiesDto } from './dto/get-activities.dto';
import { Activity, EntityType } from '@prisma/client';
import { User } from 'src/common/decorators/user.decorator';
import { IUser } from 'src/core/types/iuser.type';

@ApiTags('Activities')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'activities', version: '1' })
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('recent')
  @ApiOperation({ summary: 'Get recent activities' })
  @ApiResponse({
    status: 200,
    description: 'Returns recent activities',
  })
  async getRecentActivities(
    @User() user: IUser,
    @Query() query: GetActivitiesDto,
  ): Promise<Activity[]> {
    return this.activityService.getUserActivities(user.id, {
      entityType: query.entityType,
      limit: query.limit,
    });
  }

  @Get('entity/:entityId')
  @ApiOperation({ summary: 'Get activities for a specific entity' })
  @ApiResponse({
    status: 200,
    description: 'Returns activities for the specified entity',
  })
  async getEntityActivities(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    @Query('limit') limit: number = 10,
  ): Promise<Activity[]> {
    return this.activityService.getEntityActivities(
      entityId,
      entityType as EntityType,
      limit,
    );
  }
}
