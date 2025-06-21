# Pack Module

A comprehensive coin pack management system for the TestGenius backend, providing role-based access control for pack creation, management, and user access.

## 🏗️ Architecture

The pack module follows a layered architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                      Pack Module                           │
├─────────────────────────────────────────────────────────────┤
│  Controller Layer (REST API)                               │
│  ├── PackController (Role-based access)                    │
│  └── Public & Admin endpoints                              │
├─────────────────────────────────────────────────────────────┤
│  Service Layer (Business Logic)                            │
│  ├── PackService                                           │
│  └── Validation & Business Rules                           │
├─────────────────────────────────────────────────────────────┤
│  Repository Layer (Data Access)                            │
│  └── PackRepository                                        │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (Database)                                     │
│  └── Prisma (PostgreSQL)                                   │
└─────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
src/modules/pack/
├── dto/
│   ├── create-pack.dto.ts           # Create pack DTO
│   ├── update-pack.dto.ts           # Update pack DTO
│   ├── get-packs.dto.ts             # Get packs with pagination
│   └── pack.response.dto.ts         # Response DTOs
├── pack.controller.ts                # REST API endpoints
├── pack.service.ts                   # Business logic
├── pack.repository.ts                # Data access layer
├── pack.module.ts                    # Module configuration
└── README.md                        # This file
```

## 🚀 Features

### Core Features
- ✅ **CRUD Operations**: Create, read, update, delete packs
- ✅ **Role-based Access**: Public read access, Admin write access
- ✅ **Pagination & Filtering**: Efficient pagination with multiple filters
- ✅ **Search**: Search packs by name
- ✅ **Sorting**: Sort by various fields
- ✅ **Statistics**: Pack analytics for admins
- ✅ **Special Packs**: Daily, free, and discounted packs

### Advanced Features
- ✅ **Type Safety**: Full TypeScript support with validation
- ✅ **Business Rules**: Validation for pack data integrity
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **Security**: JWT authentication and role-based authorization
- ✅ **Performance**: Optimized database queries
- ✅ **Documentation**: Complete API documentation with Swagger

## 📊 Database Schema

```sql
CREATE TABLE "packs" (
  "pack_id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "coinsCount" INTEGER NOT NULL DEFAULT 1,
  "discount_per_cent" INTEGER,
  "bonusCount" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "advantages" TEXT[] DEFAULT '{}',
  "disadvantages" TEXT[] DEFAULT '{}',
  "is_daily" BOOLEAN NOT NULL DEFAULT false,
  "is_free" BOOLEAN NOT NULL DEFAULT false
);
```

## 🔧 API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/packs` | Get paginated packs with filtering |
| `GET` | `/v1/packs/daily` | Get all daily packs |
| `GET` | `/v1/packs/free` | Get all free packs |
| `GET` | `/v1/packs/discounted` | Get all discounted packs |
| `GET` | `/v1/packs/:id` | Get specific pack by ID |

### Admin Endpoints (Admin Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/packs/stats` | Get pack statistics |
| `POST` | `/v1/packs` | Create new pack |
| `PATCH` | `/v1/packs/:id` | Update existing pack |
| `DELETE` | `/v1/packs/:id` | Delete pack |

## 🛠️ Usage Examples

### Creating a Pack (Admin)

```typescript
// Admin creates a new pack
const pack = await packService.createPack({
  name: 'Premium Pack',
  coinsCount: 500,
  discountPerCent: 20,
  bonusCount: 50,
  advantages: ['Best value', 'Premium support'],
  disadvantages: ['Limited time offer'],
  isDaily: false,
  isFree: false
});
```

### Getting Packs with Filtering

```typescript
// Get paginated packs with filters
const packs = await packService.getPacks({
  page: 1,
  limit: 10,
  isDaily: true,
  hasDiscount: true,
  search: 'premium',
  sortBy: 'coinsCount',
  sortOrder: 'desc'
});

// Get specific pack types
const dailyPacks = await packService.getDailyPacks();
const freePacks = await packService.getFreePacks();
const discountedPacks = await packService.getDiscountedPacks();
```

### Business Logic Examples

```typescript
// Calculate effective coins (base + bonus)
const effectiveCoins = packService.calculateEffectiveCoins(pack);
// Returns: 550 (500 base + 50 bonus)

// Calculate discount amount
const discountAmount = packService.calculateDiscountAmount(pack, 0.01);
// Returns: 1.1 (20% discount on 5.5 total value)
```

## 🔒 Security & Access Control

### Role-based Access
- **Public Access**: Read-only access to packs
- **Admin Access**: Full CRUD operations on packs
- **JWT Authentication**: Required for admin endpoints
- **Role Validation**: Admin role required for write operations

### Data Validation
- **Input Validation**: Comprehensive validation using class-validator
- **Business Rules**: Custom validation for pack integrity
- **Name Uniqueness**: Prevents duplicate pack names
- **Value Constraints**: Enforces reasonable limits on pack values

### Business Rules
1. **Discount Percentage**: Must be between 0-100%
2. **Coins Count**: Must be between 1-10,000
3. **Bonus Count**: Cannot be negative
4. **Free Packs**: Cannot have discounts
5. **Name Uniqueness**: Pack names must be unique
6. **Array Limits**: Advantages/disadvantages limited to 10 items each

## 📈 Performance

### Optimizations
- **Pagination**: Efficient database queries with LIMIT/OFFSET
- **Indexing**: Database indexes on frequently queried fields
- **Filtering**: Optimized WHERE clauses for different pack types
- **Connection Pooling**: Prisma connection pooling
- **Query Optimization**: Parallel queries for statistics

### Monitoring
- Comprehensive logging with different levels
- Performance metrics tracking
- Error monitoring and alerting

## 🧪 Testing

### Unit Tests
```bash
# Test service layer
npm run test pack.service.spec.ts

# Test repository layer
npm run test pack.repository.spec.ts
```

### Integration Tests
```bash
# Test API endpoints
npm run test:e2e pack.controller.spec.ts
```

## 🔄 Migration

The pack table is already defined in your Prisma schema. If you need to make changes:

```bash
# Generate migration
npx prisma migrate dev --name update_packs

# Apply migration
npx prisma migrate deploy
```

## 📝 Configuration

### Environment Variables
```env
# Pack settings (if needed)
PACK_MAX_COINS=10000
PACK_MAX_DISCOUNT=100
PACK_DEFAULT_PAGE_SIZE=10
```

### Module Configuration
```typescript
// app.module.ts
import { PackModule } from './modules/pack/pack.module';

@Module({
  imports: [
    PackModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## 🎯 Pack Types

### Regular Packs
- Standard coin packs with base coin count
- Optional discounts and bonuses
- Custom advantages and disadvantages

### Daily Packs
- Special limited-time offers
- Usually have discounts or bonuses
- Marked with `isDaily: true`

### Free Packs
- No-cost packs for users
- Cannot have discounts
- Marked with `isFree: true`

### Discounted Packs
- Packs with percentage discounts
- Calculated based on effective coin value
- Sorted by discount percentage

## 🤝 Integration with Other Modules

### Coin Module Integration
```typescript
// When user purchases a pack
const pack = await packService.getPackById(packId);
const effectiveCoins = packService.calculateEffectiveCoins(pack);
await coinService.addCoinsToUser(userId, effectiveCoins);
```

### Notification Module Integration
```typescript
// Notify user about new daily packs
await notificationService.createSystemNotification(
  userId,
  'New Daily Pack Available!',
  'Check out today\'s special offer with 20% discount!'
);
```

## 🐛 Troubleshooting

### Common Issues

1. **Pack Creation Fails**
   - Check name uniqueness
   - Validate business rules
   - Ensure admin role

2. **Filtering Not Working**
   - Verify query parameters
   - Check database indexes
   - Validate filter values

3. **Performance Issues**
   - Monitor database query performance
   - Check for missing indexes
   - Review pagination settings

### Debug Mode
```typescript
// Enable debug logging
const logger = new Logger('PackService');
logger.setLogLevels(['debug', 'log', 'warn', 'error']);
```

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Class Validator](https://github.com/typestack/class-validator)
- [Swagger Documentation](https://swagger.io/docs/)

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintainer**: TestGenius Team 