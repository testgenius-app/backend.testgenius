/**
 * WebSocket events for notification system
 * @description Defines all event names used in notification WebSocket communication
 */
export const NOTIFICATION_EVENTS = {
  // Client to Server events
  SUBSCRIBE_TO_NOTIFICATIONS: 'subscribe_to_notifications',
  MARK_AS_READ: 'mark_as_read',
  MARK_ALL_AS_READ: 'mark_all_as_read',

  // Server to Client events
  NEW_NOTIFICATION: 'new_notification',
  NOTIFICATION_STATS: 'notification_stats',
  NOTIFICATION_UPDATED: 'notification_updated',
  NOTIFICATION_DELETED: 'notification_deleted',
  
  // Error events
  ERROR: 'notification_error',
  
  // Connection events
  CONNECTED: 'notification_connected',
  DISCONNECTED: 'notification_disconnected',
} as const;

/**
 * Notification event types for TypeScript type safety
 */
export type NotificationEventType = typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS]; 