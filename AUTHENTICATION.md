# Authentication & Authorization System

This document describes the complete authentication and authorization system implemented in the Magic Formulae application.

## Overview

The system implements:
- ✅ Email/password authentication via Supabase Auth
- ✅ Single-device login security (session token validation)
- ✅ Protected routes with middleware
- ✅ Subscription-based route protection
- ✅ Auto-refresh session (handled by Supabase)
- ✅ Password reset functionality

## Architecture

### 1. Database Schema

#### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  last_session_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  plan TEXT NOT NULL CHECK (plan IN ('1m', '6m', '12m')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

See `supabase-schema.sql` for complete schema including triggers and RLS policies.

### 2. Supabase Clients

#### Server Client (`app/lib/supabaseServer.ts`)
- Used in Server Components and API routes
- Handles cookies for session management
- Functions:
  - `createServerClient()` - For Server Components/API routes
  - `createMiddlewareClient(request)` - For middleware
  - `getServerUser()` - Get current user
  - `getServerSession()` - Get current session

#### Browser Client (`app/lib/supabaseBrowser.ts`)
- Used in Client Components
- Automatically handles browser storage
- Auto-refreshes tokens

### 3. Single Device Login

**How it works:**
1. On login, generate unique `session_token` using `crypto.randomUUID()`
2. Store token in:
   - `profiles.last_session_token` (database)
   - `localStorage.session_token` (browser)
3. Every request includes token in `x-session-token` header (via `useSessionToken` hook)
4. Middleware validates token matches database
5. If mismatch → auto-logout and redirect to login

**Implementation:**
- `app/hooks/useSessionToken.ts` - Intercepts fetch requests to inject header
- Middleware validates token on protected routes
- Auto-logout on token mismatch

### 4. Route Protection

#### Middleware (`app/middleware.ts`)

**Public Routes:**
- `/`
- `/login`
- `/signup`
- `/forgot-password`

**Protected Routes (require authentication):**
- `/dashboard`
- `/calculator`
- `/profile`
- `/subscribe`

**Subscription Required:**
- `/calculator` - Requires active subscription

**Protection Flow:**
1. Check if route is public → allow
2. Check if route is protected → require auth
3. Validate Supabase session
4. Validate session token (single device)
5. Check subscription requirement if needed

### 5. Authentication Pages

#### Login (`app/(auth)/login/page.tsx`)
- Email/password form
- Calls `/api/auth/login`
- Stores session token in localStorage
- Redirects to dashboard or intended page

#### Signup (`app/(auth)/signup/page.tsx`)
- Creates user account with Supabase Auth
- Auto-creates profile via database trigger
- Generates and stores session token
- Redirects to dashboard

#### Forgot Password (`app/(auth)/forgot-password/page.tsx`)
- Sends password reset email via Supabase
- Redirects to reset page on email link click

### 6. API Routes

#### POST `/api/auth/login`
- Validates email/password
- Creates Supabase session
- Generates session token
- Updates profile with token
- Returns user data + token

#### POST `/api/auth/logout`
- Invalidates session token in database
- Signs out from Supabase
- Clears browser session

### 7. Subscription Helper (`app/lib/subscription.ts`)

Functions:
- `isUserSubscribed(userId, supabaseClient?)` - Check if user has active subscription
- `getUserSubscription(userId)` - Get subscription details

## Setup Instructions

### 1. Database Setup

Run the SQL schema in your Supabase SQL Editor:

```bash
# Execute the contents of supabase-schema.sql
```

This creates:
- `profiles` table with RLS policies
- `subscriptions` table with RLS policies
- Triggers for auto-creating profiles
- Triggers for auto-updating timestamps

### 2. Environment Variables

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase Configuration

1. Enable Email Auth in Supabase Dashboard
2. Configure email templates (optional)
3. Set up redirect URLs:
   - Site URL: `http://localhost:3000` (development)
   - Redirect URLs: `http://localhost:3000/**`

## Usage

### Protecting a Route

Routes are automatically protected if they're in the `protectedRoutes` array in `middleware.ts`.

### Requiring Subscription

Add route to `subscriptionRequiredRoutes` in `middleware.ts`:

```typescript
const subscriptionRequiredRoutes = ["/calculator", "/new-premium-route"];
```

### Getting Current User (Server)

```typescript
import { getServerUser } from "@/app/lib/supabaseServer";

const user = await getServerUser();
if (!user) {
  // Not authenticated
}
```

### Getting Current User (Client)

```typescript
"use client";
import { supabaseBrowser } from "@/app/lib/supabaseBrowser";

const { data: { user } } = await supabaseBrowser.auth.getUser();
```

### Checking Subscription (Server)

```typescript
import { isUserSubscribed } from "@/app/lib/subscription";

const hasSubscription = await isUserSubscribed(userId);
```

## Security Features

1. **Single Device Login**: Only one active session per user
2. **Token Validation**: Every request validates session token
3. **Route Protection**: Middleware-level protection
4. **RLS Policies**: Database-level row security
5. **Auto Logout**: Automatic logout on token mismatch
6. **Secure Storage**: Tokens stored securely in database

## Error Handling

### Login Errors
- Invalid credentials → 401 with error message
- Server error → 500 with generic message

### Middleware Errors
- No session → Redirect to `/login?redirect=<path>`
- Token mismatch → Redirect to `/login?error=session_mismatch`
- Profile not found → Redirect to `/login?error=profile_not_found`
- Subscription required → Redirect to `/subscribe?error=subscription_required`

## Testing

### Test Single Device Login
1. Login on Device A → should work
2. Login on Device B → should work
3. Make request on Device A → should auto-logout (token mismatch)
4. Device A redirected to login with error message

### Test Protected Routes
1. Visit `/dashboard` without login → redirected to `/login`
2. Login → redirected to `/dashboard`
3. Try `/calculator` without subscription → redirected to `/subscribe`

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` has required variables
- Restart dev server after adding variables

### "Profile not found" error
- Check if database trigger is created
- Manually create profile if needed

### Token mismatch on every request
- Check if `useSessionToken` hook is initialized (via `SessionTokenProvider`)
- Check browser console for localStorage errors
- Ensure token is being set on login

## File Structure

```
app/
├── (auth)/
│   ├── login/page.tsx          # Login page
│   ├── signup/page.tsx         # Signup page
│   └── forgot-password/page.tsx # Password reset
├── api/
│   └── auth/
│       ├── login/route.ts      # Login API
│       └── logout/route.ts     # Logout API
├── lib/
│   ├── supabaseServer.ts       # Server Supabase client
│   ├── supabaseBrowser.ts      # Browser Supabase client
│   └── subscription.ts         # Subscription helpers
├── hooks/
│   └── useSessionToken.ts      # Session token hook
├── components/
│   └── SessionTokenProvider.tsx # Token provider
└── middleware.ts                # Route protection
```
