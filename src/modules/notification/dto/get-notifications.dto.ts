import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsEnum, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

/**
 * Notification status filter enum
 */
export enum NotificationStatus {
  ALL = 'all',
  READ = 'read',
  UNREAD = 'unread'
}

/**
 * DTO for getting notifications with pagination and filtering
 */
export class GetNotificationsDto {
    @ApiProperty({
        description: 'Page number for pagination',
        example: 1,
        minimum: 1,
        default: 1,
        required: false
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Page must be an integer' })
    @Min(1, { message: 'Page must be at least 1' })
    page?: number = 1;

    @ApiProperty({
        description: 'Number of notifications per page',
        example: 10,
        minimum: 1,
        maximum: 100,
        default: 10,
        required: false
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Limit must be an integer' })
    @Min(1, { message: 'Limit must be at least 1' })
    @Max(100, { message: 'Limit cannot exceed 100' })
    limit?: number = 10;

    @ApiProperty({
        description: 'Filter notifications by read status',
        example: NotificationStatus.UNREAD,
        enum: NotificationStatus,
        default: NotificationStatus.ALL,
        required: false
    })
    @IsOptional()
    @IsEnum(NotificationStatus, { message: 'Invalid status filter' })
    status?: NotificationStatus = NotificationStatus.ALL;

    @ApiProperty({
        description: 'Filter notifications by type',
        example: 'info',
        required: false
    })
    @IsOptional()
    type?: string;
} 