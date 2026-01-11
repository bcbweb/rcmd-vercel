# Stripe Subscription Setup Guide

This guide will help you set up Stripe subscriptions for RCMD's free and paid tiers.

## Prerequisites

1. A Stripe account (sign up at [stripe.com](https://stripe.com))
2. Access to your Stripe Dashboard
3. Your Supabase project set up

## Step 1: Create Products and Prices in Stripe

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** in the left sidebar
3. Click **+ Add product**

### Create Pro Plan (Monthly)

1. **Name**: `RCMD Pro (Monthly)`
2. **Description**: `Pro plan for RCMD - Monthly billing`
3. **Pricing model**: Standard pricing
4. **Price**: `$9.99`
5. **Billing period**: Monthly
6. **Currency**: USD
7. Click **Save product**
8. **Copy the Price ID** (starts with `price_...`) - you'll need this for `STRIPE_PRICE_ID_PRO_MONTHLY`

### Create Pro Plan (Yearly)

1. Click **+ Add another price** on the same product
2. **Price**: `$99.99`
3. **Billing period**: Yearly
4. **Currency**: USD
5. Click **Save**
6. **Copy the Price ID** (starts with `price_...`) - you'll need this for `STRIPE_PRICE_ID_PRO_YEARLY`

**Note**: You can also create separate products for monthly and yearly if preferred.

## Step 2: Set Up Webhooks

1. In Stripe Dashboard, go to **Developers** > **Webhooks**
2. Click **+ Add endpoint**
3. **Endpoint URL**: `https://yourdomain.com/api/stripe/webhook`
   - For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks:
     ```bash
     stripe listen --forward-to localhost:3000/api/stripe/webhook
     ```
4. **Description**: `RCMD Subscription Webhooks`
5. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click **Add endpoint**
7. **Copy the Signing secret** (starts with `whsec_...`) - you'll need this for `STRIPE_WEBHOOK_SECRET`

## Step 3: Configure Environment Variables

Add these environment variables to your `.env.local` file and your deployment environment (Vercel, etc.):

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... # Get from Stripe Dashboard > Developers > API keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Get from Stripe Dashboard > Developers > API keys

# Stripe Price IDs (from Step 1)
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...

# Stripe Webhook Secret (from Step 2)
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase Service Role Key (for webhooks to bypass RLS)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important**: 
- Use test keys (`sk_test_...`, `pk_test_...`) for development
- Use live keys (`sk_live_...`, `pk_live_...`) for production
- Never commit these keys to version control

## Step 4: Run Database Migration

Apply the subscription migration to your Supabase database:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually via Supabase Dashboard > SQL Editor
# Copy and run the contents of: supabase/migrations/20250110_create_subscriptions.sql
```

## Step 5: Update Plan Prices in Database (Optional)

If you want to customize the prices shown in the database (they're also pulled from Stripe), you can update the `subscription_plans` table:

```sql
UPDATE subscription_plans
SET 
  price_monthly = 999, -- $9.99 in cents
  price_yearly = 9999, -- $99.99 in cents
  stripe_price_id_monthly = 'price_...',
  stripe_price_id_yearly = 'price_...'
WHERE name = 'pro';
```

## Step 6: Test the Integration

### Test Checkout Flow

1. Start your development server: `bun run dev`
2. Navigate to `/pricing`
3. Click "Upgrade to Pro" on the Pro plan
4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code
5. Complete the checkout
6. Verify you're redirected back and subscription is created

### Test Webhooks (Local Development)

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe` (Mac) or see [Stripe CLI docs](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook signing secret shown and add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`
5. Test the checkout flow again - you should see webhook events in the terminal

### Test Customer Portal

1. After subscribing, go to `/protected/settings/subscription`
2. Click "Manage Subscription"
3. Verify you can access the Stripe Customer Portal
4. Test canceling/reactivating subscription

## Step 7: Go Live

When ready for production:

1. **Switch to live mode** in Stripe Dashboard
2. **Create live products and prices** (repeat Step 1 with live mode)
3. **Create production webhook endpoint** (repeat Step 2 with production URL)
4. **Update environment variables** in your production environment:
   - Replace test keys with live keys
   - Update price IDs to live price IDs
   - Update webhook secret to production webhook secret
5. **Test with real payment methods** (use your own card in test mode first)

## Troubleshooting

### Webhook Not Receiving Events

- Verify webhook URL is correct and accessible
- Check webhook signing secret matches
- Use Stripe CLI to test locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Check Stripe Dashboard > Webhooks > Events for delivery status

### Subscription Not Created After Checkout

- Check webhook logs in Stripe Dashboard
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check server logs for errors
- Ensure database migration was applied

### Customer Portal Not Opening

- Verify user has an active subscription with `stripe_customer_id`
- Check Stripe API key has correct permissions
- Ensure Stripe Customer Portal is enabled in Stripe Dashboard

## Security Best Practices

1. **Never expose secret keys** in client-side code
2. **Use environment variables** for all sensitive data
3. **Verify webhook signatures** (already implemented in webhook route)
4. **Use RLS policies** to protect user subscription data
5. **Monitor webhook events** in Stripe Dashboard for suspicious activity

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
