import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { IUser } from "src/core/types/iuser.type";
import { CreateNotificationDto } from "./dto/notification.create.dto";
import { GetNotificationsDto, NotificationStatus } from "./dto/get-notifications.dto";

/**
 * Repository for handling notification database operations
 * @description Provides methods for CRUD operations on notifications
 */
@Injectable()
export class NotificationRepository {
    private readonly logger = new Logger(NotificationRepository.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Get paginated notifications for a user with filtering
     * @param user - The authenticated user
     * @param query - Query parameters for pagination and filtering
     * @returns Paginated notifications
     */
    async getNotifications(user: IUser, query: GetNotificationsDto) {
        const { page = 1, limit = 10, status = NotificationStatus.ALL, type } = query;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {
            userId: user.id,
        };

        if (status !== NotificationStatus.ALL) {
            where.isRead = status === NotificationStatus.READ;
        }

        if (type) {
            where.type = type;
        }

        // Get notifications with pagination
        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.notification.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            notifications,
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }

    /**
     * Get a single notification by ID
     * @param user - The authenticated user
     * @param id - Notification ID
     * @returns The notification if found and belongs to user
     */
    async getNotification(user: IUser, id: string) {
        const notification = await this.prisma.notification.findFirst({
            where: {
                id: parseInt(id),
                userId: user.id,
            },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        return notification;
    }

    /**
     * Mark a notification as read
     * @param user - The authenticated user
     * @param id - Notification ID
     * @returns Updated notification
     */
    async readNotification(user: IUser, id: string) {
        const notification = await this.prisma.notification.findFirst({
            where: {
                id: parseInt(id),
                userId: user.id,
            },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        if (notification.isRead) {
            return notification; // Already read
        }

        return this.prisma.notification.update({
            where: {
                id: parseInt(id),
            },
            data: {
                isRead: true,
            },
        });
    }

    /**
     * Mark all notifications as read for a user
     * @param user - The authenticated user
     * @returns Update result
     */
    async readAllNotifications(user: IUser) {
        const result = await this.prisma.notification.updateMany({
            where: {
                userId: user.id,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        this.logger.log(`Marked ${result.count} notifications as read for user ${user.id}`);
        return result;
    }

    /**
     * Create a notification for a specific user
     * @param notification - Notification data
     * @param userId - Target user ID
     * @returns Created notification
     */
    async createNotificationForUser(notification: CreateNotificationDto, userId: string) {
        return this.prisma.notification.create({
            data: {
                userId,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                channel: notification.channel || 'web',
                priority: notification.priority || 'normal',
            },
        });
    }

    /**
     * Create notifications for multiple users (bulk operation)
     * @param notification - Notification data
     * @param userIds - Array of user IDs
     * @returns Number of notifications created
     */
    async createNotificationsForUsers(notification: CreateNotificationDto, userIds: string[]) {
        const notifications = userIds.map(userId => ({
            userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            channel: notification.channel || 'web',
            priority: notification.priority || 'normal',
        }));

        const result = await this.prisma.notification.createMany({
            data: notifications,
        });

        this.logger.log(`Created ${result.count} notifications for ${userIds.length} users`);
        return result;
    }

    /**
     * Create notification for all users or specific user
     * @param notification - Notification data
     * @param receiver - 'users' for all users, 'user' for specific user
     * @returns Creation result
     */
    async createNotification(notification: CreateNotificationDto, receiver: 'users' | 'user') {
        try {
            if (receiver === 'users') {
                // Get all user IDs
                const users = await this.prisma.user.findMany({
                    select: { id: true },
                });
                
                const userIds = users.map(user => user.id);
                
                if (userIds.length === 0) {
                    this.logger.warn('No users found to send notifications to');
                    return { message: 'No users found', count: 0 };
                }

                const result = await this.createNotificationsForUsers(notification, userIds);
                return {
                    message: `Notification created successfully for ${result.count} users`,
                    count: result.count,
                };
            } else {
                if (!notification.userId) {
                    throw new Error('User ID is required when receiver is "user"');
                }

                const createdNotification = await this.createNotificationForUser(notification, notification.userId);
                return {
                    message: 'Notification created successfully',
                    notification: createdNotification,
                };
            }
        } catch (error) {
            this.logger.error(`Failed to create notification: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Get notification statistics for a user
     * @param user - The authenticated user
     * @returns Notification statistics
     */
    async getNotificationStats(user: IUser) {
        const [total, unread] = await Promise.all([
            this.prisma.notification.count({
                where: { userId: user.id },
            }),
            this.prisma.notification.count({
                where: { 
                    userId: user.id,
                    isRead: false,
                },
            }),
        ]);

        return {
            total,
            unread,
            read: total - unread,
        };
    }

    /**
     * Delete old notifications (cleanup utility)
     * @param daysOld - Number of days old to consider for deletion
     * @returns Number of deleted notifications
     */
    async deleteOldNotifications(daysOld: number = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.prisma.notification.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
                isRead: true, // Only delete read notifications
            },
        });

        this.logger.log(`Deleted ${result.count} old notifications older than ${daysOld} days`);
        return result;
    }
}