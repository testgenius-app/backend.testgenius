import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { JwtTokenService } from 'src/gateways/generate-test/jwt-token.service';

/**
 * Notification Gateway Module
 * @description Organizes WebSocket components for real-time notifications
 */
@Module({
  imports: [NotificationModule],
  providers: [NotificationGateway, WsJwtGuard, JwtTokenService],
  exports: [NotificationGateway],
})
export class NotificationGatewayModule {} 