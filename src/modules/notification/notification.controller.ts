import { 
    Body, 
    Controller, 
    Get, 
    Param, 
    Post, 
    Query, 
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
    ValidationPipe
} from '@nestjs/common';
import { 
    ApiBearerAuth, 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiParam, 
    ApiQuery,
    ApiBody 
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { IUser } from 'src/core/types/iuser.type';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { CreateNotificationDto } from './dto/notification.create.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { 
    NotificationResponseDto, 
    PaginatedNotificationsResponseDto, 
    NotificationStatsResponseDto 
} from './dto/notification.response.dto';

/**
 * Controller for handling notification-related HTTP requests
 * @description Provides REST API endpoints for notification management
 */
@ApiTags('Notifications')
@Controller({ path: 'notifications', version: '1' })
@ApiBearerAuth('access-token')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    /**
     * Get paginated notifications for the authenticated user
     */
    @Get()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get user notifications',
        description: 'Retrieve paginated notifications for the authenticated user with filtering options'
    })
    @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
    @ApiQuery({ name: 'status', required: false, description: 'Filter by read status', enum: ['all', 'read', 'unread'] })
    @ApiQuery({ name: 'type', required: false, description: 'Filter by notification type' })
    @ApiResponse({
        status: 200,
        description: 'Notifications retrieved successfully',
        type: PaginatedNotificationsResponseDto
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getNotifications(
        @User() user: IUser,
        @Query(new ValidationPipe({ transform: true })) query: GetNotificationsDto
    ): Promise<PaginatedNotificationsResponseDto> {
        return this.notificationService.getNotifications(user, query);
    }

    /**
     * Get notification statistics for the authenticated user
     */
    @Get('stats')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get notification statistics',
        description: 'Retrieve notification statistics (total, read, unread) for the authenticated user'
    })
    @ApiResponse({
        status: 200,
        description: 'Statistics retrieved successfully',
        type: NotificationStatsResponseDto
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getNotificationStats(@User() user: IUser): Promise<NotificationStatsResponseDto> {
        return this.notificationService.getNotificationStats(user);
    }

    /**
     * Get a specific notification by ID
     */
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get notification by ID',
        description: 'Retrieve a specific notification and mark it as read'
    })
    @ApiParam({ name: 'id', description: 'Notification ID', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'Notification retrieved successfully',
        type: NotificationResponseDto
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Notification not found' })
    async getNotification(
        @User() user: IUser,
        @Param('id', ParseIntPipe) id: string
    ): Promise<NotificationResponseDto> {
        return this.notificationService.getNotification(user, id);
    }

    /**
     * Mark all notifications as read for the authenticated user
     */
    @Post('read-all')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Mark all notifications as read',
        description: 'Mark all unread notifications as read for the authenticated user'
    })
    @ApiResponse({
        status: 200,
        description: 'All notifications marked as read successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Marked 5 notifications as read' },
                count: { type: 'number', example: 5 }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async readAllNotifications(@User() user: IUser) {
        return this.notificationService.readAllNotifications(user);
    }

    /**
     * Create a notification (Admin only)
     */
    @Post()
    @UseGuards(AdminGuard)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create notification',
        description: 'Create a notification for specific user or all users (Admin only)'
    })
    @ApiBody({
        type: CreateNotificationDto,
        description: 'Notification data'
    })
    @ApiQuery({
        name: 'receiver',
        description: 'Target receiver type',
        enum: ['users', 'user'],
        example: 'user'
    })
    @ApiResponse({
        status: 201,
        description: 'Notification created successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Notification created successfully for 1 user' },
                count: { type: 'number', example: 1 }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
    async createNotification(
        @Body(new ValidationPipe({ transform: true })) notification: CreateNotificationDto,
        @Query('receiver') receiver: 'users' | 'user'
    ) {
        return this.notificationService.createNotification(notification, receiver);
    }

    /**
     * Create bulk notifications for multiple users (Admin only)
     */
    @Post('bulk')
    @UseGuards(AdminGuard)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create bulk notifications',
        description: 'Create notifications for multiple specific users (Admin only)'
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                userIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of user IDs to send notifications to'
                },
                notification: {
                    type: 'object',
                    description: 'Notification data',
                    $ref: '#/components/schemas/CreateNotificationDto'
                }
            },
            required: ['userIds', 'notification']
        }
    })
    @ApiResponse({
        status: 201,
        description: 'Bulk notifications created successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Created 10 notifications for 10 users' },
                count: { type: 'number', example: 10 }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
    async createBulkNotifications(
        @Body() body: { userIds: string[]; notification: CreateNotificationDto }
    ) {
        return this.notificationService.createBulkNotifications(body.userIds, body.notification);
    }

    /**
     * Cleanup old notifications (Admin only)
     */
    @Post('cleanup')
    @UseGuards(AdminGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Cleanup old notifications',
        description: 'Delete old read notifications (Admin only)'
    })
    @ApiQuery({
        name: 'daysOld',
        description: 'Delete notifications older than this many days',
        required: false,
        example: 30
    })
    @ApiResponse({
        status: 200,
        description: 'Cleanup completed successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Deleted 50 old notifications' },
                count: { type: 'number', example: 50 }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
    async cleanupOldNotifications(
        @Query('daysOld') daysOld: number = 30
    ) {
        return this.notificationService.deleteOldNotifications(daysOld);
    }
}
