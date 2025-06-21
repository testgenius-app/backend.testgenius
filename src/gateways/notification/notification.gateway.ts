import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { NotificationService } from 'src/modules/notification/notification.service';
import { JwtTokenService } from 'src/gateways/generate-test/jwt-token.service';
import { NOTIFICATION_EVENTS } from './events/notification.events';
import { WsJwtGuard } from './guards/ws-jwt.guard';

/**
 * WebSocket Gateway for real-time notifications
 * @description Handles real-time notification delivery to connected clients
 */
@WebSocketGateway({
  namespace: 'notifications',
  transports: ['websocket'],
  cors: {
    origin: ['*'],
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedUsers = new Map<string, Socket>();

  constructor(
    private readonly notificationService: NotificationService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  /**
   * Handle client connection
   * @param client - Connected socket client
   */
  async handleConnection(client: Socket) {
    try {
      const accessToken = client.handshake.auth.accessToken;

      if (!accessToken) {
        this.logger.warn('Client connected without access token');
        client.disconnect();
        return;
      }

      const user = await this.jwtTokenService.verifyToken(accessToken);

      if (!user) {
        this.logger.warn('Client connected with invalid token');
        client.disconnect();
        return;
      }

      // Store connected user
      this.connectedUsers.set(user.id, client);
      client.data.user = user;

      this.logger.log(`User ${user.id} connected to notification gateway`);
      
      // Send unread notification count
      const stats = await this.notificationService.getNotificationStats(user);
      client.emit(NOTIFICATION_EVENTS.NOTIFICATION_STATS, stats);
      
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`, error.stack);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   * @param client - Disconnected socket client
   */
  async handleDisconnect(client: Socket) {
    const user = client.data?.user;
    if (user) {
      this.connectedUsers.delete(user.id);
      this.logger.log(`User ${user.id} disconnected from notification gateway`);
    }
  }

  /**
   * Subscribe to notification updates
   * @param client - Socket client
   */
  @SubscribeMessage(NOTIFICATION_EVENTS.SUBSCRIBE_TO_NOTIFICATIONS)
  @UseGuards(WsJwtGuard)
  async handleSubscribeToNotifications(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    this.logger.log(`User ${user.id} subscribed to notifications`);
    
    // Send current unread notifications
    const stats = await this.notificationService.getNotificationStats(user);
    client.emit(NOTIFICATION_EVENTS.NOTIFICATION_STATS, stats);
  }

  /**
   * Mark notification as read
   * @param client - Socket client
   * @param data - Notification data
   */
  @SubscribeMessage(NOTIFICATION_EVENTS.MARK_AS_READ)
  @UseGuards(WsJwtGuard)
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string }
  ) {
    try {
      const user = client.data.user;
      const notification = await this.notificationService.getNotification(user, data.notificationId);
      
      // Update stats for the client
      const stats = await this.notificationService.getNotificationStats(user);
      client.emit(NOTIFICATION_EVENTS.NOTIFICATION_STATS, stats);
      
      this.logger.log(`User ${user.id} marked notification ${data.notificationId} as read`);
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error.message}`, error.stack);
      client.emit(NOTIFICATION_EVENTS.ERROR, error.message);
    }
  }

  /**
   * Mark all notifications as read
   * @param client - Socket client
   */
  @SubscribeMessage(NOTIFICATION_EVENTS.MARK_ALL_AS_READ)
  @UseGuards(WsJwtGuard)
  async handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user;
      await this.notificationService.readAllNotifications(user);
      
      // Update stats for the client
      const stats = await this.notificationService.getNotificationStats(user);
      client.emit(NOTIFICATION_EVENTS.NOTIFICATION_STATS, stats);
      
      this.logger.log(`User ${user.id} marked all notifications as read`);
    } catch (error) {
      this.logger.error(`Error marking all notifications as read: ${error.message}`, error.stack);
      client.emit(NOTIFICATION_EVENTS.ERROR, error.message);
    }
  }

  /**
   * Send notification to specific user
   * @param userId - Target user ID
   * @param notification - Notification data
   */
  async sendNotificationToUser(userId: string, notification: any) {
    const client = this.connectedUsers.get(userId);
    if (client) {
      client.emit(NOTIFICATION_EVENTS.NEW_NOTIFICATION, notification);
      this.logger.log(`Sent notification to user ${userId}`);
    }
  }

  /**
   * Send notification to all connected users
   * @param notification - Notification data
   */
  async sendNotificationToAll(notification: any) {
    this.server.emit(NOTIFICATION_EVENTS.NEW_NOTIFICATION, notification);
    this.logger.log(`Sent notification to all connected users`);
  }

  /**
   * Update notification stats for a user
   * @param userId - User ID
   */
  async updateUserStats(userId: string) {
    const client = this.connectedUsers.get(userId);
    if (client) {
      try {
        const stats = await this.notificationService.getNotificationStats({ id: userId } as any);
        client.emit(NOTIFICATION_EVENTS.NOTIFICATION_STATS, stats);
      } catch (error) {
        this.logger.error(`Error updating stats for user ${userId}: ${error.message}`, error.stack);
      }
    }
  }

  /**
   * Get connected users count
   * @returns Number of connected users
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected user IDs
   * @returns Array of connected user IDs
   */
  getConnectedUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
} 