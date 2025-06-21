import { ApiProperty } from "@nestjs/swagger";
import { NotificationType, NotificationChannel, NotificationPriority } from "./notification.create.dto";

/**
 * Response DTO for a single notification
 */
export class NotificationResponseDto {
    @ApiProperty({
        description: 'Unique notification identifier',
        example: 1
    })
    id: number;

    @ApiProperty({
        description: 'User ID who received the notification',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    userId: string;

    @ApiProperty({
        description: 'Type of notification',
        example: NotificationType.INFO,
        enum: NotificationType
    })
    type: NotificationType;

    @ApiProperty({
        description: 'Notification title',
        example: 'New message received'
    })
    title: string;

    @ApiProperty({
        description: 'Notification message',
        example: 'You have received a new message from John Doe'
    })
    message: string;

    @ApiProperty({
        description: 'Whether the notification has been read',
        example: false
    })
    isRead: boolean;

    @ApiProperty({
        description: 'Additional metadata',
        example: { userId: '123', action: 'message' },
        required: false
    })
    data?: Record<string, any>;

    @ApiProperty({
        description: 'Delivery channel',
        example: NotificationChannel.WEB,
        enum: NotificationChannel
    })
    channel: NotificationChannel;

    @ApiProperty({
        description: 'Priority level',
        example: NotificationPriority.NORMAL,
        enum: NotificationPriority
    })
    priority: NotificationPriority;

    @ApiProperty({
        description: 'When the notification was created',
        example: '2024-01-15T10:30:00Z'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'When the notification was last updated',
        example: '2024-01-15T10:30:00Z'
    })
    updatedAt: Date;
}

/**
 * Response DTO for paginated notifications
 */
export class PaginatedNotificationsResponseDto {
    @ApiProperty({
        description: 'Array of notifications',
        type: [NotificationResponseDto]
    })
    notifications: NotificationResponseDto[];

    @ApiProperty({
        description: 'Current page number',
        example: 1
    })
    page: number;

    @ApiProperty({
        description: 'Number of notifications per page',
        example: 10
    })
    limit: number;

    @ApiProperty({
        description: 'Total number of notifications',
        example: 25
    })
    total: number;

    @ApiProperty({
        description: 'Total number of pages',
        example: 3
    })
    totalPages: number;

    @ApiProperty({
        description: 'Whether there are more pages',
        example: true
    })
    hasNext: boolean;

    @ApiProperty({
        description: 'Whether there are previous pages',
        example: false
    })
    hasPrev: boolean;
}

/**
 * Response DTO for notification statistics
 */
export class NotificationStatsResponseDto {
    @ApiProperty({
        description: 'Total number of notifications',
        example: 25
    })
    total: number;

    @ApiProperty({
        description: 'Number of unread notifications',
        example: 5
    })
    unread: number;

    @ApiProperty({
        description: 'Number of read notifications',
        example: 20
    })
    read: number;
} 