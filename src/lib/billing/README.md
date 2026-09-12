# KAYVEN Billing Architecture

Billing is provider-independent. RevenueCat, Stripe, or another provider can later update `subscriptions`; feature checks do not need to change.

## Local development override

To test paid entitlements locally, set these server-only variables in `.env.local`:

```text
KAYVEN_DEV_USER_ID=<authenticated Supabase user UUID>
KAYVEN_DEV_PLAN=pro
```

The override is honored only when `NODE_ENV` is not `production` and only for the exact authenticated user ID. It never accepts a plan from a request body and is disabled in production.

## Database setup

Apply the subscription and usage additions in `supabase-schema.sql` to Supabase. The schema creates:

- `subscriptions` for provider-independent subscription state
- `ai_usage` for monthly per-user AI request/token/cost totals
- `record_ai_usage(...)` for an authenticated, atomic usage increment

Subscription writes are intentionally not exposed through the application yet. A future provider webhook or trusted server integration should update `subscriptions`.

## AI usage behavior

- Local and deterministic responses do not consume AI quota.
- A successful external provider response consumes one request.
- Failed provider calls do not consume quota.
- Free, premium, and pro limits are configured in `src/lib/billing/plans.ts`.
- Missing billing data safely resolves to the free plan.

## Future provider environment variables

These server-side variables are required only when RevenueCat API/webhook integration is enabled:

```text
REVENUECAT_SECRET_API_KEY=
REVENUECAT_WEBHOOK_SECRET=
REVENUECAT_API_BASE_URL=https://api.revenuecat.com/v1
REVENUECAT_PREMIUM_ENTITLEMENT_ID=premium
REVENUECAT_PRO_ENTITLEMENT_ID=pro
REVENUECAT_PREMIUM_MONTHLY_PRODUCT_ID=
REVENUECAT_PREMIUM_YEARLY_PRODUCT_ID=
REVENUECAT_PRO_MONTHLY_PRODUCT_ID=
REVENUECAT_PRO_YEARLY_PRODUCT_ID=
SUPABASE_SERVICE_ROLE_KEY=
```

The browser may receive only these non-secret values:

```text
NEXT_PUBLIC_REVENUECAT_WEB_API_KEY=
NEXT_PUBLIC_REVENUECAT_PREMIUM_MONTHLY_PRODUCT_ID=
NEXT_PUBLIC_REVENUECAT_PREMIUM_YEARLY_PRODUCT_ID=
NEXT_PUBLIC_REVENUECAT_PRO_MONTHLY_PRODUCT_ID=
NEXT_PUBLIC_REVENUECAT_PRO_YEARLY_PRODUCT_ID=
```

Never put RevenueCat secrets or `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_*` variable.

## RevenueCat mapping

Product IDs are read from server environment variables and mapped only to `premium` or `pro`. Active entitlement priority is deterministic: `pro` wins over `premium`. Unknown products and entitlements resolve to Free.

## Webhook

Configure RevenueCat to send authorized events to:

```text
POST /api/webhooks/revenuecat
```

The endpoint verifies `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`, records `(provider, event_id)` for idempotency, and updates the Supabase subscription mirror through a service-role client. It does not expose provider payloads to clients.

## Web SDK behavior

The browser adapter uses the authenticated Supabase `user.id` as the RevenueCat App User ID. It initializes only in the browser, only with the public Web API key, and refreshes `/api/subscription` after customer state changes. It never writes to Supabase directly.

## Subscription synchronization

After a RevenueCat purchase or restore, the browser calls the authenticated `POST /api/subscription/refresh` endpoint. The server verifies the customer through the RevenueCat API and updates the Supabase mirror. The client then polls the mirror for a bounded period; it never grants access from RevenueCat customer info alone. If the webhook is delayed, the UI shows a syncing state rather than claiming activation.

Logout and user switching clear both RevenueCat client state and the shared `/api/subscription` cache. Subscription requests are deduplicated in the client cache.

Cancellation keeps access active through the verified current period and sets `cancel_at_period_end`. Expiration or an unverified provider state falls back conservatively to Free. Existing AI usage is never reset when a plan changes.

## Feature enforcement

The existing weekly AI progress analysis endpoint is protected by the server-side `advanced_progress` entitlement. The browser `FeatureGate` and `UpgradePrompt` provide UX only. Future advanced meal planning, workout intelligence, health intelligence, and advanced AI Coach entitlements remain marked Coming soon until those features are implemented.

## Subscription management

Subscription management is available at `/subscription/manage`. The page reads normalized state from `/api/subscription` and uses the RevenueCat Web SDK `CustomerInfo.managementURL` only when RevenueCat provides a real management destination. KAYVEN never constructs provider URLs or writes cancellation state from the browser.

If a provider management URL is unavailable, the page explains that management is handled by the billing provider and does not show a fake cancellation action. A confirmation panel appears before opening a verified management URL.

Restore and refresh actions are bounded, authenticated, and server-aware. A RevenueCat customer update is followed by `POST /api/subscription/refresh` and a refresh of the Supabase mirror. Access is not described as active until the server response confirms it.

Canceled subscriptions retain paid access through the verified `current_period_end` when `cancel_at_period_end` is true. Expired or inactive subscription states resolve to Free entitlements while preserving the normalized status for management messaging.

## Sandbox and production

Use separate RevenueCat projects/keys and product IDs for sandbox and production. No real purchase can be made from the current web UI. Mobile SDK purchase and restore flows are future work.

Apply the `subscriptions`, `ai_usage`, `billing_webhook_events`, RLS, indexes, constraints, and `record_ai_usage` function from `supabase-schema.sql` before enabling webhook processing.
