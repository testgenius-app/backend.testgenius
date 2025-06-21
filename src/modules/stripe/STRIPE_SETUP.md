# Stripe Setup Guide

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZA567BCD890EFG
STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZA567BCD890EFG
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

## Getting Your Stripe Keys

### 1. Create a Stripe Account
1. Go to [stripe.com](https://stripe.com)
2. Sign up for a free account
3. Complete your account setup

### 2. Get API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** and **Secret key**
3. For development, use the **test keys** (start with `pk_test_` and `sk_test_`)
4. For production, use the **live keys** (start with `pk_live_` and `sk_live_`)

### 3. Set Up Webhooks

#### Development (Using Stripe CLI)
```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: Download from https://github.com/stripe/stripe-cli/releases

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:4000/v1/stripe/webhook

# Copy the webhook secret from the output
```

#### Production
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/v1/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook secret

## Test Cards

Use these test card numbers for development:

| Card Number | Description |
|-------------|-------------|
| `4242424242424242` | Visa (successful payment) |
| `4000000000000002` | Visa (declined) |
| `4000000000009995` | Visa (insufficient funds) |
| `5555555555554444` | Mastercard (successful payment) |
| `2223003122003222` | Mastercard (successful payment) |

**Test Card Details:**
- **Expiry Date**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

## Testing the Integration

### 1. Create a Test Pack
```sql
INSERT INTO packs (pack_id, name, coins_count, price_in_cents, is_free, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Test Pack',
  50,
  999, -- $9.99
  false,
  NOW(),
  NOW()
);
```

### 2. Test Payment Flow
1. Create a payment intent: `POST /v1/stripe/create-payment-intent`
2. Use Stripe test card to complete payment
3. Confirm payment: `POST /v1/stripe/confirm-payment`
4. Check user coins increased
5. Verify transaction in database

### 3. Test Webhooks
```bash
# Send test webhook
stripe trigger payment_intent.succeeded
```

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Validate webhook signatures
- [ ] Store keys securely (not in code)
- [ ] Use environment variables
- [ ] Implement proper error handling
- [ ] Log all payment events
- [ ] Monitor webhook delivery
- [ ] Test with Stripe's test cards
- [ ] Validate user ownership
- [ ] Prevent duplicate payments

## Common Issues

### 1. Webhook Not Receiving Events
- Check webhook URL is accessible
- Verify webhook secret is correct
- Ensure endpoint returns 200 status
- Check Stripe dashboard for webhook failures

### 2. Payment Intent Creation Fails
- Verify Stripe secret key is correct
- Check pack exists and is not free
- Ensure user is authenticated
- Validate pack price is positive

### 3. Payment Confirmation Fails
- Verify payment intent belongs to user
- Check payment intent status is 'succeeded'
- Ensure payment not already processed
- Validate webhook signature

## Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Set up production webhook endpoint
- [ ] Configure proper error monitoring
- [ ] Set up payment analytics
- [ ] Implement fraud detection
- [ ] Configure backup webhook endpoints
- [ ] Set up automated reconciliation
- [ ] Test with real payment methods
- [ ] Monitor payment success rates
- [ ] Set up customer support process 