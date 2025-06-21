import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { IUser } from 'src/core/types/iuser.type';
import { CreateNotificationDto, NotificationType, NotificationChannel, NotificationPriority } from './dto/notification.create.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { NotificationResponseDto, PaginatedNotificationsResponseDto, NotificationStatsResponseDto } from './dto/notification.response.dto';

/**
 * Service for handling notification business logic
 * @description Provides high-level operations for notification management
 */
@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(private readonly notificationRepository: NotificationRepository) {}

    /**
     * Get paginated notifications for a user
     * @param user - The authenticated user
     * @param query - Query parameters for pagination and filtering
     * @returns Paginated notifications
     */
    async getNotifications(user: IUser, query: GetNotificationsDto): Promise<PaginatedNotificationsResponseDto> {
        try {
            this.logger.debug(`Getting notifications for user ${user.id} with query: ${JSON.stringify(query)}`);
            
            const result = await this.notificationRepository.getNotifications(user, query);
            
            this.logger.debug(`Found ${result.total} notifications for user ${user.id}`);
            return result as PaginatedNotificationsResponseDto;
        } catch (error) {
            this.logger.error(`Failed to get notifications for user ${user.id}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Get a single notification by ID and mark it as read
     * @param user - The authenticated user
     * @param id - Notification ID
     * @returns The notification
     */
    async getNotification(user: IUser, id: string): Promise<NotificationResponseDto> {
        try {
            this.logger.debug(`Getting notification ${id} for user ${user.id}`);
            
            const notification = await this.notificationRepository.getNotification(user, id);
            
            // Mark as read if not already read
            if (!notification.isRead) {
                await this.notificationRepository.readNotification(user, id);
                notification.isRead = true;
                this.logger.debug(`Marked notification ${id} as read for user ${user.id}`);
            }
            
            return notification as NotificationResponseDto;
        } catch (error) {
            this.logger.error(`Failed to get notification ${id} for user ${user.id}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Mark all notifications as read for a user
     * @param user - The authenticated user
     * @returns Update result
     */
    async readAllNotifications(user: IUser) {
        try {
            this.logger.debug(`Marking all notifications as read for user ${user.id}`);
            
            const result = await this.notificationRepository.readAllNotifications(user);
            
            this.logger.log(`Marked ${result.count} notifications as read for user ${user.id}`);
            return {
                message: `Marked ${result.count} notifications as read`,
                count: result.count,
            };
        } catch (error) {
            this.logger.error(`Failed to mark notifications as read for user ${user.id}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Create a notification for a specific user
     * @param user - The user to create notification for
     * @param notificationData - Notification data
     * @returns Created notification
     */
    async createNotificationForUser(user: IUser, notificationData: CreateNotificationDto): Promise<NotificationResponseDto> {
        try {
            this.logger.debug(`Creating notification for user ${user.id}: ${notificationData.title}`);
            
            const notification = await this.notificationRepository.createNotificationForUser(notificationData, user.id);
            
            this.logger.log(`Created notification ${notification.id} for user ${user.id}`);
            return notification as NotificationResponseDto;
        } catch (error) {
            this.logger.error(`Failed to create notification for user ${user.id}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Create notification for all users or specific user (admin only)
     * @param notificationData - Notification data
     * @param receiver - 'users' for all users, 'user' for specific user
     * @returns Creation result
     */
    async createNotification(notificationData: CreateNotificationDto, receiver: 'users' | 'user') {
        try {
            this.logger.debug(`Creating notification for ${receiver}: ${notificationData.title}`);
            
            // Validate required fields
            if (receiver === 'user' && !notificationData.userId) {
                throw new BadRequestException('User ID is required when receiver is "user"');
            }
            
            const result = await this.notificationRepository.createNotification(notificationData, receiver);
            
            this.logger.log(`Created notification for ${receiver}: ${JSON.stringify(result)}`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to create notification for ${receiver}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Get notification statistics for a user
     * @param user - The authenticated user
     * @returns Notification statistics
     */
    async getNotificationStats(user: IUser): Promise<NotificationStatsResponseDto> {
        try {
            this.logger.debug(`Getting notification stats for user ${user.id}`);
            
            const stats = await this.notificationRepository.getNotificationStats(user);
            
            this.logger.debug(`Notification stats for user ${user.id}: ${JSON.stringify(stats)}`);
            return stats;
        } catch (error) {
            this.logger.error(`Failed to get notification stats for user ${user.id}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Delete old notifications (cleanup utility)
     * @param daysOld - Number of days old to consider for deletion
     * @returns Number of deleted notifications
     */
    async deleteOldNotifications(daysOld: number = 30) {
        try {
            this.logger.debug(`Deleting notifications older than ${daysOld} days`);
            
            const result = await this.notificationRepository.deleteOldNotifications(daysOld);
            
            this.logger.log(`Deleted ${result.count} old notifications`);
            return {
                message: `Deleted ${result.count} old notifications`,
                count: result.count,
            };
        } catch (error) {
            this.logger.error(`Failed to delete old notifications: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Create system notification (internal use)
     * @param userId - Target user ID
     * @param title - Notification title
     * @param message - Notification message
     * @param data - Additional data
     * @returns Created notification
     */
    async createSystemNotification(
        userId: string,
        title: string,
        message: string,
        data?: Record<string, any>
    ): Promise<NotificationResponseDto> {
        const notificationData: CreateNotificationDto = {
            type: NotificationType.SYSTEM,
            title,
            message,
            data,
            channel: NotificationChannel.WEB,
            priority: NotificationPriority.NORMAL,
        };

        return this.createNotificationForUser({ id: userId } as IUser, notificationData);
    }

    /**
     * Create bulk notifications for multiple users
     * @param userIds - Array of user IDs
     * @param notificationData - Notification data
     * @returns Creation result
     */
    async createBulkNotifications(userIds: string[], notificationData: CreateNotificationDto) {
        try {
            this.logger.debug(`Creating bulk notifications for ${userIds.length} users: ${notificationData.title}`);
            
            if (userIds.length === 0) {
                throw new BadRequestException('No user IDs provided');
            }
            
            const result = await this.notificationRepository.createNotificationsForUsers(notificationData, userIds);
            
            this.logger.log(`Created ${result.count} bulk notifications for ${userIds.length} users`);
            return {
                message: `Created ${result.count} notifications for ${userIds.length} users`,
                count: result.count,
            };
        } catch (error) {
            this.logger.error(`Failed to create bulk notifications: ${error.message}`, error.stack);
            throw error;
        }
    }
}
