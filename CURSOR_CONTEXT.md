# MAGIC FORMULAE – CURSOR CONTEXT

📌 Project Overview

Magic Formulae is a Next.js 14 (App Router) application with:
- Supabase authentication
- Profiles table (extended from auth.users)
- Subscriptions system
- Razorpay payments
- Webhook for payment capture
- Route protection & single-device login

---

📌 Database Schema (FINAL)

## profiles

Stores user metadata and the last session token for device-lock.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK, references auth.users) | user id |
| email | text | synced from auth |
| name | text | optional |
| phone | text | optional |
| profile_image | text | optional |
| role | text ("user", "admin") | default "user" |
| last_session_token | text | for single-device login |
| created_at | timestamptz | default now |
| updated_at | timestamptz | auto-updated |

➡ **RLS:** Users can only SELECT & UPDATE their own profile.

---

## payments

Stores Razorpay payment orders & results.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| razorpay_order_id | text UNIQUE | |
| razorpay_payment_id | text | |
| razorpay_signature | text | |
| plan | text ("1m", "6m", "12m") | |
| amount | int | |
| currency | text | default "INR" |
| status | text ("pending", "completed", "failed") | |
| user_id | UUID references profiles(id) | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

➡ **RLS:** Users can view only their own payments. Webhook uses service_role → bypasses RLS.

---

## subscriptions

Stores active user subscriptions.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID references profiles(id) | |
| plan | text ("1m", "6m", "12m") | |
| start_date | timestamptz | |
| end_date | timestamptz | |
| status | text | "active", "expired", "cancelled" |
| created_at | timestamptz | |
| updated_at | timestamptz | |

➡ **Unique constraint:** A user cannot have more than one active subscription.

---

## device_lock

Stores active device sessions.

| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID references profiles(id) | |
| session_token | text | |
| created_at | timestamptz | |

---

📌 Authentication Rules

- **Only one device/window allowed**
- `last_session_token` is checked via middleware
- If mismatch → auto logout and redirect to login

---

📌 Razorpay Flow

1. `/api/create-order` creates order → adds payment row (status=pending)
2. Razorpay popup completes payment
3. Razorpay webhook hits `/api/razorpay-webhook`
4. **Webhook:**
   - validates signature
   - updates payment row
   - activates subscription (upsert)

---

📌 Frontend Rules

- **Subscription page** must load:
  - active subscription info
  - expiry date
- **Calculator & Dashboard** are protected routes
- If subscription expired → redirect to `/subscribe`

---

📌 Code Generation Guidelines

When writing code, ensure:
- Use Supabase server client (`createServerClient`) in API routes
- Use Supabase browser client (`supabaseBrowser`) in client components
- Use service role client (`supabaseServiceRole`) for webhooks (bypasses RLS)
- Validate session tokens using `validateSession()` utility in protected API routes
- Include `x-session-token` header in all frontend fetch calls to protected routes
- Match exact column names from schema above
- Handle subscription expiry checks in middleware and UI
