# Daily Coins Feature

## Overview
The daily coins feature automatically distributes coins to verified users every day at midnight. This feature is implemented using NestJS cron jobs and is fully configurable.

## Implementation Details

### Files Created/Modified:
1. `src/modules/scheduler/services/daily-coins.service.ts` - Main service for daily coins distribution
2. `src/modules/scheduler/scheduler.controller.ts` - Controller for manual triggering
3. `src/modules/scheduler/scheduler.module.ts` - Updated to include new services

### Features:
- **Automatic Distribution**: Runs every day at midnight (00:00 UTC)
- **Verified Users Only**: Only distributes coins to users with `isVerified: true`
- **Configurable Amount**: Daily coins amount is configurable via environment variable
- **Manual Trigger**: Admin endpoint to manually trigger distribution
- **Error Handling**: Comprehensive error handling and logging
- **Transaction Safety**: Individual user updates to prevent partial failures

### Configuration:
Add the following environment variable to your `.env` file:
```env
DAILY_COINS_AMOUNT=10
```
Default value is 10 coins if not specified.

### API Endpoints:

#### Manual Trigger (Admin Only)
```
POST /scheduler/trigger-daily-coins
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "success": true,
  "message": "Daily coins distribution completed. Updated 5 out of 5 users",
  "updatedCount": 5
}
```

### Database Schema:
The feature uses the existing `coins` field in the `users` table:
```sql
coins INTEGER NOT NULL
```

### Logging:
The service provides detailed logging for:
- Start of distribution process
- Individual user coin distribution
- Completion summary
- Error cases

### Security:
- Manual trigger endpoint requires ADMIN role
- Only verified users receive daily coins
- Individual error handling prevents one user's failure from affecting others

### Monitoring:
Monitor the application logs for:
- `DailyCoinsService` log entries
- Distribution success/failure messages
- User-specific distribution logs

## Usage Examples:

### Environment Setup:
```env
# .env file
DAILY_COINS_AMOUNT=15
```

### Manual Trigger via API:
```bash
curl -X POST http://localhost:4000/scheduler/trigger-daily-coins \
  -H "Authorization: Bearer <admin_token>"
```

### Checking User Coins:
```sql
SELECT id, email, coins, is_verified 
FROM users 
WHERE is_verified = true;
```

## Future Enhancements:
- Streak bonuses for consecutive daily logins
- Different coin amounts based on user tier/role
- Weekly/monthly bonus distributions
- Integration with activity tracking
- Email notifications for coin distribution 