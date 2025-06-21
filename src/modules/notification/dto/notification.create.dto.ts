import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsObject, IsEnum, IsUUID } from "class-validator";

/**
 * Notification types enum
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SYSTEM = 'system'
}

/**
 * Notification channels enum
 */
export enum NotificationChannel {
  WEB = 'web',
  EMAIL = 'email',
  PUSH = 'push'
}

/**
 * Notification priority levels enum
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high'
}

/**
 * DTO for creating notifications
 * @description Used by admins to create notifications for users
 */
export class CreateNotificationDto {
    @ApiProperty({
        description: 'Type of notification',
        example: NotificationType.INFO,
        enum: NotificationType,
        required: true
    })
    @IsEnum(NotificationType, { message: 'Invalid notification type' })
    type: NotificationType;

    @ApiProperty({
        description: 'Short title for the notification',
        example: 'New message received',
        minLength: 1,
        maxLength: 100
    })
    @IsString({ message: 'Title must be a string' })
    title: string;

    @ApiProperty({
        description: 'Detailed message content',
        example: 'You have received a new message from John Doe',
        minLength: 1,
        maxLength: 500
    })
    @IsString({ message: 'Message must be a string' })
    message: string;

    @ApiProperty({
        description: 'Additional metadata for the notification (e.g., links, IDs)',
        example: { 
            userId: '123e4567-e89b-12d3-a456-426614174000',
            action: 'message',
            redirectUrl: '/messages/123'
        },
        required: false
    })
    @IsOptional()
    @IsObject({ message: 'Data must be an object' })
    data?: Record<string, any>;

    @ApiProperty({
        description: 'Delivery channel for the notification',
        example: NotificationChannel.WEB,
        enum: NotificationChannel,
        default: NotificationChannel.WEB,
        required: false
    })
    @IsOptional()
    @IsEnum(NotificationChannel, { message: 'Invalid notification channel' })
    channel?: NotificationChannel;

    @ApiProperty({
        description: 'Priority level of the notification',
        example: NotificationPriority.NORMAL,
        enum: NotificationPriority,
        default: NotificationPriority.NORMAL,
        required: false
    })
    @IsOptional()
    @IsEnum(NotificationPriority, { message: 'Invalid notification priority' })
    priority?: NotificationPriority;

    @ApiProperty({
        description: 'Target user ID (required when receiver is "user")',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false
    })
    @IsOptional()
    @IsUUID('4', { message: 'Invalid user ID format' })
    userId?: string;
}