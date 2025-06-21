# Notification Module

A comprehensive notification system for the TestGenius backend, providing both REST API and WebSocket real-time notifications.

## 🏗️ Architecture

The notification module follows a layered architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                    Notification Module                      │
├─────────────────────────────────────────────────────────────┤
│  Controller Layer (REST API)                               │
│  ├── NotificationController                                 │
│  └── WebSocket Gateway (Real-time)                         │
├─────────────────────────────────────────────────────────────┤
│  Service Layer (Business Logic)                            │
│  ├── NotificationService                                    │
│  └── NotificationGateway                                    │
├─────────────────────────────────────────────────────────────┤
│  Repository Layer (Data Access)                            │
│  └── NotificationRepository                                 │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (Database)                                     │
│  └── Prisma (PostgreSQL)                                   │
└─────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
src/modules/notification/
├── dto/
│   ├── notification.create.dto.ts      # Create notification DTO
│   ├── get-notifications.dto.ts        # Get notifications with pagination
│   └── notification.response.dto.ts    # Response DTOs
├── notification.controller.ts           # REST API endpoints
├── notification.service.ts              # Business logic
├── notification.repository.ts           # Data access layer
├── notification.module.ts               # Module configuration
└── README.md                           # This file

src/gateways/notification/
├── events/
│   └── notification.events.ts          # WebSocket events
├── guards/
│   └── ws-jwt.guard.ts                 # WebSocket JWT guard
├── notification.gateway.ts             # WebSocket gateway
└── notification.gateway.module.ts      # Gateway module
```

## 🚀 Features

### Core Features
- ✅ **CRUD Operations**: Create, read, update, delete notifications
- ✅ **Pagination**: Efficient pagination with filtering
- ✅ **Real-time Delivery**: WebSocket-based real-time notifications
- ✅ **User-specific**: Notifications tied to specific users
- ✅ **Admin Tools**: Bulk notification creation and management
- ✅ **Statistics**: Notification counts and analytics
- ✅ **Cleanup**: Automatic cleanup of old notifications

### Advanced Features
- ✅ **Type Safety**: Full TypeScript support with enums
- ✅ **Validation**: Comprehensive input validation
- ✅ **Error Handling**: Robust error handling and logging
- ✅ **Security**: JWT authentication and authorization
- ✅ **Performance**: Optimized database queries
- ✅ **Documentation**: Complete API documentation with Swagger

## 📊 Database Schema

```sql
CREATE TABLE "Notification" (
  "id" SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "data" JSONB,
  "channel" TEXT DEFAULT 'web',
  "priority" TEXT DEFAULT 'normal',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

## 🔧 API Endpoints

### REST API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/v1/notifications` | Get paginated notifications | ✅ |
| `GET` | `/v1/notifications/stats` | Get notification statistics | ✅ |
| `GET` | `/v1/notifications/:id` | Get specific notification | ✅ |
| `POST` | `/v1/notifications/read-all` | Mark all as read | ✅ |
| `POST` | `/v1/notifications` | Create notification | Admin |
| `POST` | `/v1/notifications/bulk` | Create bulk notifications | Admin |
| `POST` | `/v1/notifications/cleanup` | Cleanup old notifications | Admin |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `subscribe_to_notifications` | Client → Server | Subscribe to notifications |
| `mark_as_read` | Client → Server | Mark notification as read |
| `mark_all_as_read` | Client → Server | Mark all notifications as read |
| `new_notification` | Server → Client | New notification received |
| `notification_stats` | Server → Client | Updated notification stats |
| `notification_error` | Server → Client | Error occurred |

## 🛠️ Usage Examples

### Creating a Notification

```typescript
// Admin creates notification for all users
const notification = await notificationService.createNotification({
  type: NotificationType.INFO,
  title: 'System Maintenance',
  message: 'System will be down for maintenance on Sunday',
  priority: NotificationPriority.HIGH,
  channel: NotificationChannel.WEB
}, 'users');

// Create notification for specific user
const userNotification = await notificationService.createNotification({
  type: NotificationType.SUCCESS,
  title: 'Test Completed',
  message: 'Your test has been successfully generated',
  userId: 'user-id-here',
  data: { testId: 'test-123' }
}, 'user');
```

### Getting Notifications

```typescript
// Get paginated notifications with filters
const notifications = await notificationService.getNotifications(user, {
  page: 1,
  limit: 10,
  status: NotificationStatus.UNREAD,
  type: 'info'
});

// Get notification statistics
const stats = await notificationService.getNotificationStats(user);
// Returns: { total: 25, unread: 5, read: 20 }
```

### WebSocket Integration

```typescript
// Client-side connection
const socket = io('ws://localhost:3000/notifications', {
  auth: { accessToken: 'jwt-token-here' }
});

// Subscribe to notifications
socket.emit('subscribe_to_notifications');

// Listen for new notifications
socket.on('new_notification', (notification) => {
  console.log('New notification:', notification);
});

// Listen for stats updates
socket.on('notification_stats', (stats) => {
  console.log('Updated stats:', stats);
});
```

## 🔒 Security

### Authentication
- All endpoints require JWT authentication
- WebSocket connections validate JWT tokens
- Admin endpoints require admin role

### Authorization
- Users can only access their own notifications
- Admin can create notifications for any user
- Bulk operations restricted to admin users

### Data Validation
- Input validation using class-validator
- Type safety with TypeScript enums
- SQL injection protection via Prisma

## 📈 Performance

### Optimizations
- **Pagination**: Efficient database queries with LIMIT/OFFSET
- **Indexing**: Database indexes on frequently queried fields
- **Bulk Operations**: Efficient bulk notification creation
- **Connection Pooling**: Prisma connection pooling
- **Caching**: Consider Redis for high-traffic scenarios

### Monitoring
- Comprehensive logging with different levels
- Performance metrics tracking
- Error monitoring and alerting

## 🧪 Testing

### Unit Tests
```bash
# Test service layer
npm run test notification.service.spec.ts

# Test repository layer
npm run test notification.repository.spec.ts
```

### Integration Tests
```bash
# Test API endpoints
npm run test:e2e notification.controller.spec.ts

# Test WebSocket gateway
npm run test:e2e notification.gateway.spec.ts
```

## 🔄 Migration

To add the notification system to your database:

```bash
# Generate migration
npx prisma migrate dev --name add_notifications

# Apply migration
npx prisma migrate deploy
```

## 📝 Configuration

### Environment Variables
```env
# Notification settings
NOTIFICATION_CLEANUP_DAYS=30
NOTIFICATION_MAX_PER_USER=1000
NOTIFICATION_DEFAULT_CHANNEL=web
```

### Module Configuration
```typescript
// app.module.ts
import { NotificationModule } from './modules/notification/notification.module';
import { NotificationGatewayModule } from './gateways/notification/notification.gateway.module';

@Module({
  imports: [
    NotificationModule,
    NotificationGatewayModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## 🤝 Contributing

When contributing to the notification module:

1. **Follow the existing patterns** in the codebase
2. **Add comprehensive tests** for new features
3. **Update documentation** for API changes
4. **Use TypeScript** for type safety
5. **Follow NestJS best practices**

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Class Validator](https://github.com/typestack/class-validator)

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Fails**
   - Check JWT token validity
   - Verify CORS configuration
   - Check network connectivity

2. **Notifications Not Delivered**
   - Verify user is connected to WebSocket
   - Check notification creation logs
   - Validate notification data

3. **Performance Issues**
   - Monitor database query performance
   - Check for missing indexes
   - Review bulk operation efficiency

### Debug Mode
```typescript
// Enable debug logging
const logger = new Logger('NotificationService');
logger.setLogLevels(['debug', 'log', 'warn', 'error']);
```

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintainer**: TestGenius Team 