# Stripe Webhook Edge Function — Deploy Instructions

## Prerequisites
- Supabase project created and linked
- Stripe account with products + payment links set up

---

## Steps

### 1. Install the Supabase CLI
```bash
npm install -g supabase
# or
brew install supabase/tap/supabase
```

### 2. Link your project (first time only)
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Deploy the Edge Function
```bash
supabase functions deploy stripe-webhook
```

### 4. Set required secrets
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 5. Add the webhook endpoint in Stripe
1. Go to stripe.com → Developers → Webhooks → Add endpoint
2. Set the endpoint URL to your Edge Function URL:
   `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
3. Under **Events to send**, select:
   - `checkout.session.completed`
4. Copy the **Signing secret** (starts with `whsec_`) and set it as `STRIPE_WEBHOOK_SECRET` above.

---

## Verification
After deploying, make a test purchase and check:
- Stripe Dashboard → Webhooks → your endpoint → Recent deliveries (should show 200)
- Supabase → Table Editor → profiles (founder_tier should be updated)
