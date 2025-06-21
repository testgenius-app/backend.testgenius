# Stripe Payment Integration

## Overview
This module integrates Stripe payment processing for purchasing coin packs in the TestGenius application. Users can buy packs using various payment methods supported by Stripe.

## Features

### 🔐 **Secure Payment Processing**
- Stripe Payment Intents for secure payment handling
- Webhook integration for real-time payment status updates
- Comprehensive error handling and validation

### 💰 **Pack Purchase System**
- Create payment intents for pack purchases
- Automatic coin distribution upon successful payment
- Transaction history tracking
- Multi-language notifications

### 📊 **Payment Management**
- Payment history with pagination
- Transaction status tracking
- Activity logging for all payment events
- Real-time notifications for payment events

## API Endpoints

### Authentication Required Endpoints

#### 1. Create Payment Intent
```http
POST /v1/stripe/create-payment-intent
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "packId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:**
```json
{
  "clientSecret": "pi_1234567890abcdef_secret_1234567890abcdef",
  "paymentIntentId": "pi_1234567890abcdef",
  "amount": 999,
  "currency": "usd",
  "pack": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Premium Pack",
    "coinsCount": 100,
    "price": 999
  }
}
```

#### 2. Confirm Payment
```http
POST /v1/stripe/confirm-payment
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "paymentIntentId": "pi_1234567890abcdef"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "pack": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Premium Pack",
    "coinsCount": 100
  },
  "coinsAdded": 100,
  "totalCoins": 150,
  "transactionId": "transaction_uuid"
}
```

#### 3. Get Payment History
```http
GET /v1/stripe/payment-history?page=1&limit=10
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "transactions": [
    {
      "id": "transaction_uuid",
      "amount": 999,
      "currency": "usd",
      "status": "COMPLETED",
      "createdAt": "2024-01-01T00:00:00Z",
      "pack": {
        "id": "pack_uuid",
        "name": "Premium Pack",
        "coinsCount": 100
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 5,
    "limit": 10,
    "total": 50
  }
}
```

### Public Endpoints

#### 1. Get Stripe Public Key
```http
GET /v1/stripe/public-key
```

**Response:**
```json
{
  "publicKey": "pk_test_1234567890abcdef"
}
```

#### 2. Stripe Webhook
```http
POST /v1/stripe/webhook
Stripe-Signature: <webhook_signature>
Content-Type: application/json

{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890abcdef",
      "status": "succeeded",
      "metadata": {
        "userId": "user_uuid",
        "packId": "pack_uuid"
      }
    }
  }
}
```

## Database Schema

### PaymentTransaction Model
```prisma
model PaymentTransaction {
  id                    String   @id @default(uuid())
  userId                String
  packId                String
  paymentIntentId       String   @unique
  stripePaymentIntentId String   @unique
  amount                Int      // Amount in cents
  currency              String   @default("usd")
  status                PaymentStatus @default(PENDING)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  pack                  Pack     @relation(fields: [packId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([packId])
  @@index([status])
  @@index([createdAt])
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
  REFUNDED
}
```

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_1234567890abcdef
STRIPE_PUBLISHABLE_KEY=pk_test_1234567890abcdef
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef
```

## Client-Side Integration

### 1. Initialize Stripe
```javascript
// Get public key from your backend
const response = await fetch('/v1/stripe/public-key');
const { publicKey } = await response.json();

const stripe = Stripe(publicKey);
```

### 2. Create Payment Intent
```javascript
const createPaymentIntent = async (packId) => {
  const response = await fetch('/v1/stripe/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ packId }),
  });
  
  return response.json();
};
```

### 3. Process Payment
```javascript
const processPayment = async (packId) => {
  try {
    // Create payment intent
    const { clientSecret, paymentIntentId } = await createPaymentIntent(packId);
    
    // Confirm payment with Stripe
    const { error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: 'User Name',
        },
      },
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Confirm payment with backend
    const confirmResponse = await fetch('/v1/stripe/confirm-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ paymentIntentId }),
    });
    
    const result = await confirmResponse.json();
    console.log('Payment successful:', result);
    
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

## Webhook Setup

### 1. Stripe CLI (Development)
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:4000/v1/stripe/webhook

# This will provide you with a webhook secret
```

### 2. Production Webhook
1. Go to your Stripe Dashboard
2. Navigate to Developers > Webhooks
3. Add endpoint: `https://yourdomain.com/v1/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook secret to your environment variables

## Security Features

### 🔒 **Payment Security**
- Stripe Payment Intents for secure payment processing
- Webhook signature verification
- User ownership validation
- Duplicate payment prevention

### 🛡️ **Data Protection**
- Encrypted payment data (handled by Stripe)
- Secure token-based authentication
- Input validation and sanitization
- Comprehensive error handling

### 📝 **Audit Trail**
- Complete payment transaction logging
- Activity tracking for all payment events
- User notification system
- Detailed error logging

## Error Handling

### Common Error Scenarios
1. **Invalid Pack ID**: 404 Not Found
2. **Insufficient Funds**: 400 Bad Request
3. **Payment Already Processed**: 400 Bad Request
4. **Invalid Payment Intent**: 404 Not Found
5. **Webhook Signature Invalid**: 400 Bad Request

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Payment already processed",
  "error": "Bad Request"
}
```

## Testing

### Test Cards
Use Stripe's test cards for development:
- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **Insufficient Funds**: `4000000000009995`

### Test Environment
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Monitoring

### Logs to Monitor
- Payment intent creation
- Payment confirmation
- Webhook processing
- Error occurrences
- Transaction status changes

### Key Metrics
- Payment success rate
- Average transaction value
- Failed payment reasons
- Webhook delivery success rate

## Future Enhancements

### Planned Features
- [ ] Subscription-based packs
- [ ] Refund processing
- [ ] Multiple currency support
- [ ] Payment method management
- [ ] Advanced analytics dashboard
- [ ] Automated reconciliation
- [ ] Tax calculation
- [ ] Invoice generation

### Integration Possibilities
- [ ] Apple Pay / Google Pay
- [ ] Local payment methods
- [ ] Cryptocurrency payments
- [ ] Buy now, pay later options
- [ ] Corporate billing
- [ ] Bulk purchase discounts 