# Magic Formulae – Powered by Sure Profit India

A Next.js application for calculating trading formulae with secure subscription access. This application provides powerful formula calculations, user authentication, profile management, and subscription features. The application features a professional dark theme matching the Magic Formulae brand with bright green accents and modern UI components.

## Features

- **Formula Calculator**: Calculate pivot points, support/resistance levels (R1-R4, S1-S4) using Classic and Camarilla formulas. Switch between formula types with tab navigation. Enter Open, High, Low, and Close (OHLC) values to generate trading levels.
- **User Authentication**: Complete authentication system with Supabase Auth including email/password login, signup, password reset, and single-device login security
- **Dashboard**: User dashboard with subscription status, trial tracking, and quick navigation
- **Profile Management**: Update profile information (name and password), upload profile picture, and manage account settings with real-time data sync. Email and phone number changes require admin approval via request system.
- **Route Protection**: Middleware-based route protection with session validation and subscription-based access control
- **Single-Device Login**: Security feature that automatically logs out users from other devices when logging in from a new device
- **Subscription Plans**: Multiple subscription tiers with pricing and feature comparison
- **Trial System**: Free trial system with localStorage-based tracking (3 free calculations)
- **Responsive Design**: Modern, dark-themed UI matching Magic Formulae design with consistent styling across all pages
- **Navigation Bar**: Fixed navigation with brand logo, menu items, and call-to-action buttons
- **Scalable Architecture**: Modular components and utilities for easy maintenance and extension

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **Fonts**: Geist Sans & Geist Mono
- **Design System**: Custom theme matching Magic Formulae brand
- **Payment Gateway**: Razorpay
- **Database**: Supabase (PostgreSQL)

## Project Structure

```
formulae-app/
├── app/
│   ├── (auth)/            # Authentication route group
│   │   ├── login/         # Login page with Supabase Auth
│   │   ├── signup/        # Signup page with profile creation
│   │   └── forgot-password/ # Password reset page
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication API routes
│   │   │   ├── login/     # Login endpoint (legacy, now uses client-side)
│   │   │   ├── logout/    # Logout endpoint
│   │   │   └── update-session-token/ # Session token management
│   │   ├── create-order/  # Razorpay order creation endpoint
│   │   ├── verify-payment/ # Payment verification endpoint
│   │   └── razorpay-webhook/ # Webhook handler for payment events
│   ├── components/        # Shared reusable components
│   │   ├── PageContainer.tsx  # Page layout wrapper with dark theme
│   │   ├── Card.tsx          # Card component with dark variant
│   │   ├── Button.tsx        # Button component with multiple variants
│   │   ├── Input.tsx         # Form inputs with labels, helper text, and error states
│   │   ├── SectionTitle.tsx  # Consistent section headers
│   │   ├── FormulaTabs.tsx  # Tab switcher for Classic/Camarilla formula types
│   │   ├── Navigation.tsx    # Fixed navigation bar with branding
│   │   └── SessionTokenProvider.tsx # Session token management provider
│   ├── hooks/             # Custom React hooks
│   │   └── useSessionToken.ts # Session token synchronization hook
│   ├── lib/               # Utility functions and constants
│   │   ├── theme.ts       # Theme constants (dark theme, colors)
│   │   ├── utils.ts       # Helper functions (localStorage, SSR safe)
│   │   ├── supabase.ts    # Legacy Supabase client (for payment routes)
│   │   ├── supabaseBrowser.ts # Client-side Supabase client
│   │   ├── supabaseServer.ts # Server-side Supabase client
│   │   └── subscription.ts # Subscription checking utilities
│   ├── calculator/        # Calculator page and formula utilities
│   │   ├── page.tsx       # Main calculator interface with formula tabs
│   │   └── formulaUtils.ts # Classic and Camarilla pivot point calculations
│   ├── dashboard/         # Dashboard page with user data
│   ├── profile/           # Profile management page
│   ├── subscribe/         # Subscription plans page
│   ├── middleware.ts      # Route protection middleware
│   ├── layout.tsx         # Root layout with Navigation and SessionTokenProvider
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles (dark theme, grid pattern)
├── supabase-schema.sql    # Complete database schema
├── migrate-profiles-table.sql # Migration for existing profiles table
├── complete-db-schema.sql # Complete database setup script
├── AUTHENTICATION.md      # Complete authentication system documentation
├── package.json
├── tailwind.config.js     # Tailwind config with custom colors
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd formulae-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

**Required Dependencies:**
- `razorpay` - Payment gateway integration
- `@supabase/supabase-js` - Supabase client for authentication and database operations
- `next` - Next.js framework (App Router)
- `react` & `react-dom` - React library
- `typescript` - TypeScript support

These are automatically installed when you run `npm install` (they're listed in `package.json`).

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Set up environment variables (see [Environment Variables](#environment-variables) section below).

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Razorpay Configuration (REQUIRED)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Developer Mode (Optional - bypasses trial limits for testing)
NEXT_PUBLIC_DEV_MODE=true
```

**Required Environment Variables:**
- `RAZORPAY_KEY_ID` - Razorpay API key ID
- `RAZORPAY_KEY_SECRET` - Razorpay API key secret
- `RAZORPAY_WEBHOOK_SECRET` - Razorpay webhook secret (for webhook signature verification)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Public Razorpay key ID (for frontend checkout)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for webhooks to bypass RLS)

**Note**: 
- Get your Razorpay credentials from [Razorpay Dashboard](https://dashboard.razorpay.com/)
- Get your Supabase credentials from your [Supabase Project Settings](https://app.supabase.com/)
- The webhook secret is generated when you create a webhook endpoint in Razorpay Dashboard
- The service role key can be found in Supabase Project Settings → API → service_role key (keep this secret!)

**Webhook Configuration:**
- Configure Razorpay webhook URL: `https://formulae-app.vercel.app/api/razorpay-webhook`
- Enable the `payment.captured` event in Razorpay webhook settings
- Copy the webhook secret and set it as `RAZORPAY_WEBHOOK_SECRET` in your environment variables

## Architecture

### Components

The application uses a component-based architecture with shared reusable components:

- **PageContainer**: Consistent page layout wrapper with dark background, optional max-width, and centering
- **Card**: Reusable card component with variants, interactive hover option, and consistent padding
- **Button**: Styled button component with multiple variants (primary, secondary, outline, ghost, warning, purple, danger, success), link support via href prop, and optional fullWidth prop for full-width buttons
- **Input**: Labeled input with helper text, optional badge, disabled/error styling, and full-width defaults
- **SectionTitle**: Standardized section headers with optional eyebrow, description, alignment, and sizing
- **FormulaTabs**: Tab switcher component for selecting between Classic and Camarilla formula calculation methods
- **Navigation**: Fixed top navigation bar with Magic Formulae branding, menu items, and call-to-action buttons

### Theme System

Design tokens live in `app/lib/theme.ts` and centralize the dark UI palette:
- **Colors**: Backgrounds (`base`, `surface`, `card`), text (`primary`, `secondary`, `muted`), borders, and accents (primary green, purple secondary, warning, danger, info).
- **Spacing**: Scale from `xs (4px)` to `4xl (48px)` for consistent layout rhythm.
- **Radii**: `xs` through `xl` plus `pill` for chips and badges.
- **Typography**: Font sizes from `xs (12px)` to `4xl (36px)` and weights from `regular` to `bold`.
- **Shadows**: Sm/Md/Lg plus a green `glow` for accent emphasis.

### Calculator Formulas

The calculator supports two pivot point calculation methods:

- **Classic Pivot Points**: Traditional pivot point formula using (H + L + C) / 3 as the pivot, with support and resistance levels calculated based on the pivot and price range
- **Camarilla Pivot Points**: Alternative formula using close price and range multipliers (1.1/12, 1.1/6, 1.1/4, 1.1/2) to calculate R1-R4 and S1-S4 levels

Both formulas are implemented in `app/calculator/formulaUtils.ts` and can be switched via the FormulaTabs component.

### Utilities

The `app/lib/utils.ts` file provides SSR-safe utility functions:

- **`isClient()`**: Checks if code is running on the client-side (browser)
- **`getLocalStorageItem(key)`**: Safely reads from localStorage with error handling
- **`setLocalStorageItem(key, value)`**: Safely writes to localStorage with error handling
- **`removeLocalStorageItem(key)`**: Safely removes items from localStorage with error handling
- **`enableDeveloperMode()`**: Enables developer mode to bypass trial limits (for testing)
- **`disableDeveloperMode()`**: Disables developer mode
- **`isDeveloperMode()`**: Checks if developer mode is currently enabled

All functions include proper error handling and SSR checks to prevent hydration mismatches and runtime errors.

### Developer Mode

Developers can bypass the 3-trial limit for testing purposes:

**Option 1: Environment Variable**
Set `NEXT_PUBLIC_DEV_MODE=true` in your `.env.local` file.

**Option 2: Browser Console**
Open browser console and run:
```javascript
localStorage.setItem("dev_mode", "true");
```
Then refresh the page.

When developer mode is enabled:
- Unlimited calculations (no trial deduction)
- All values are visible (no blurring)
- Shows "🛠️ Developer Mode: Unlimited Calculations" message
- Trial counter is hidden

### Authentication System

The application uses Supabase Auth for complete user authentication with the following features:

- **Email/Password Authentication**: Secure login and signup
- **Password Reset**: Email-based password recovery
- **Single-Device Login**: Automatic logout from other devices when logging in from a new device
- **Session Token Validation**: Middleware validates session tokens on every protected route
- **Route Protection**: Automatic redirect to login for unauthenticated users
- **Subscription Guards**: Routes can require active subscriptions

**Key Files:**
- `app/middleware.ts` - Route protection and session validation
- `app/(auth)/login/page.tsx` - Login page
- `app/(auth)/signup/page.tsx` - Signup page with profile creation
- `app/hooks/useSessionToken.ts` - Session token synchronization
- `app/lib/supabaseBrowser.ts` - Client-side Supabase client
- `app/lib/supabaseServer.ts` - Server-side Supabase client

**Protected Routes:**
- `/dashboard` - Requires authentication
- `/calculator` - Requires authentication + subscription
- `/profile` - Requires authentication
- `/subscribe` - Requires authentication

**Public Routes:**
- `/` - Home page
- `/login` - Login page
- `/signup` - Signup page
- `/forgot-password` - Password reset

See `AUTHENTICATION.md` for complete authentication documentation.

### API Routes

#### Authentication Routes

**POST `/api/auth/logout`**

Logs out the current user and invalidates the session token.

**Response:**
```json
{
  "success": true
}
```

#### Payment Routes

#### POST `/api/create-order`

Creates a Razorpay payment order and stores it in the Supabase payments table.

**Request Body:**
```json
{
  "plan": "1m" | "6m" | "12m"
}
```

**Response:**
```json
{
  "id": "order_xxxxx",
  "amount": 299900,
  "currency": "INR",
  "receipt": "order_xxxxx_1m",
  "status": "created",
  "plan": "1m"
}
```

**Plan Pricing:**
- `1m`: ₹2,999 (1 month access)
- `6m`: ₹14,999 (6 months access)
- `12m`: ₹24,999 (12 months access)

**Process:**
1. Validates the plan parameter
2. Calculates amount based on plan
3. Creates order in Razorpay
4. Stores order in Supabase `payments` table with status "pending"
5. Returns order details to frontend

**Error Handling:**
- Returns 400 for invalid plan
- Returns 500 for Razorpay or database errors

**Technical Notes:**
- The Razorpay SDK is a CommonJS module, so it's imported using `require()` instead of ES6 `import` syntax
- All environment variables are validated at startup to ensure proper configuration

#### POST `/api/verify-payment`

Verifies Razorpay payment signature and updates the payment status in Supabase.

**Request Body:**
```json
{
  "razorpay_order_id": "order_xxxxx",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_signature": "signature_hash"
}
```

**Response (Success):**
```json
{
  "verified": true,
  "message": "Payment verified successfully",
  "payment": {
    "order_id": "order_xxxxx",
    "payment_id": "pay_xxxxx",
    "status": "completed",
    "plan": "1m",
    "amount": 2999
  }
}
```

**Response (Failure):**
```json
{
  "verified": false,
  "error": "Invalid payment signature"
}
```

**Process:**
1. Validates required payment fields (order_id, payment_id, signature)
2. Verifies Razorpay signature using HMAC SHA256
3. Updates Supabase payment record:
   - Sets status to "completed" if signature is valid
   - Sets status to "failed" if signature is invalid
   - Stores payment_id and signature
4. Returns verification result

**Error Handling:**
- Returns 400 for missing fields or invalid signature
- Returns 500 for database errors or configuration issues

**Security:**
- Uses HMAC SHA256 signature verification to ensure payment authenticity
- Never trusts client-side data without server-side verification
- Also activates/extends subscription as a backup if webhook fails

#### POST `/api/razorpay-webhook`

Webhook endpoint for Razorpay payment events. This endpoint is called by Razorpay when payment events occur.

**Webhook URL:** `https://formulae-app.vercel.app/api/razorpay-webhook`

**Configure in Razorpay Dashboard:**
1. Go to Settings → Webhooks
2. Add webhook URL: `https://formulae-app.vercel.app/api/razorpay-webhook`
3. Enable `payment.captured` event
4. Copy the webhook secret and set as `RAZORPAY_WEBHOOK_SECRET` environment variable

**Process:**
1. Validates webhook signature using `RAZORPAY_WEBHOOK_SECRET`
2. For `payment.captured` events:
   - Extracts `payment_id`, `order_id`, `amount`, `user_id`, and `plan` from webhook payload
   - Updates payments table: sets status to "completed", stores payment_id and signature
   - Activates/extends subscription:
     - If user has active subscription: extends end_date based on new plan
     - If no active subscription: creates new subscription with calculated end_date
   - Uses service role key to bypass RLS
3. Always returns 200 status (even on errors) to prevent Razorpay retries

**Subscription Activation:**
- Plan durations: 1m = 30 days, 6m = 180 days, 12m = 365 days
- If user already has active subscription, extends from current end_date
- Otherwise, creates new subscription starting from now

**Error Handling:**
- Logs all errors but always returns 200 to avoid webhook retries
- Continues processing even if order_id not found (handles edge cases)
- Subscription creation/update failures are logged but don't fail the webhook

### Hydration Safety

All pages that use client-side features (like localStorage) implement proper hydration safety:
- Mounted state checks before accessing browser APIs
- Consistent server and client rendering
- No hydration mismatches

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Pages

- `/` - Home page with hero section and feature overview (public). Shows login/signup buttons when not authenticated, dashboard link when authenticated.
- `/login` - User login with Supabase authentication (public)
- `/signup` - User registration with automatic profile creation (public)
- `/forgot-password` - Password reset via email (public)
- `/dashboard` - User dashboard with subscription status and quick actions (protected)
- `/calculator` - Formula calculator with Classic and Camarilla pivot point calculations. Enter OHLC values to generate R1-R4 and S1-S4 levels with tab-based formula switching (protected, subscription required). Only visible in navigation when logged in.
- `/profile` - User profile management with real-time data sync, photo upload, password change, and admin request system for email/phone changes (protected)
- `/subscribe` - Subscription plans with pricing tiers (protected)

**Navigation Features:**
- Calculator tab only visible to authenticated users
- Login/signup buttons hidden when user is logged in
- Profile and Logout buttons shown when authenticated

## Development Notes

### Adding New Pages

1. Create a new directory under `app/`
2. Add a `page.tsx` file
3. Use `PageContainer` for consistent dark theme layout
4. Use shared `Card` and `Button` components
5. Follow the established dark theme and styling patterns
6. Use green (`#00ff88`) for primary actions and accents
7. Use white/gray-300 for text on dark backgrounds

### Theme Customization

Edit `app/lib/theme.ts` to adjust tokens. Update palette, spacing, radii, font sizes/weights, or shadows in one place to keep UI consistent.

### Design Guidelines

- **Background**: Always use dark backgrounds (`#0a0a0a` or `#1a1a1a`)
- **Text**: White for headings, gray-300 for body text
- **Accents**: Use bright green (`#00ff88`) for primary actions, links, and highlights
- **Buttons**: Green primary buttons with black text, or outline variants
- **Inputs**: Use the shared `Input` component for labels, errors, and focus styles
- **Cards**: Dark gray with subtle borders, shadows, and rounded corners
- **Section headers**: Use `SectionTitle` for consistent typography, spacing, and alignment

### Database Setup

The application uses Supabase for authentication, user profiles, subscriptions, and payment records. You need to set up the database schema before running the application.

#### Quick Setup

1. **Go to your Supabase Dashboard** → SQL Editor
2. **Run the complete schema**:
   - For new installations: Run `complete-db-schema.sql`
   - For existing installations: Run `migrate-profiles-table.sql` to add missing columns

#### Required Tables

**1. Profiles Table** (stores user profiles and session tokens)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  last_session_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**2. Subscriptions Table** (stores user subscriptions)
```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('1m', '6m', '12m')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**3. Payments Table** (stores Razorpay payment records)
```sql
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('1m', '6m', '12m')),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

See `supabase-schema.sql` for the complete schema including:
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for auto-creating profiles
- Auto-update timestamps

#### Supabase Configuration

1. **Enable Email Auth** in Supabase Dashboard → Authentication → Providers
2. **Set up email templates** (optional) in Authentication → Email Templates
3. **Configure redirect URLs**:
   - Site URL: `http://localhost:3000` (development)
   - Redirect URLs: `http://localhost:3000/**`

### localStorage Usage

Always use the utility functions from `app/lib/utils.ts` when accessing localStorage to prevent hydration issues:
- `getLocalStorageItem(key)`
- `setLocalStorageItem(key, value)`
- `removeLocalStorageItem(key)`

## Design Features

- **Dark Theme**: Professional dark theme matching Magic Formulae brand
- **Grid Pattern Background**: Subtle grid pattern for visual depth
- **Green Accents**: Bright green (`#00ff88`) for primary actions and highlights
- **Smooth Animations**: Transitions and hover effects throughout
- **Custom Scrollbar**: Styled scrollbars matching the dark theme
- **Responsive Navigation**: Fixed navigation bar with mobile-friendly menu
- **Gradient Effects**: Purple/pink gradients for special buttons
- **Shadow Effects**: Green glow effects on primary buttons

## Security Features

- **Row Level Security (RLS)**: Database-level security policies ensure users can only access their own data
- **Session Token Validation**: Every protected route validates session tokens for single-device login
- **Middleware Protection**: Server-side route protection before pages load
- **Secure Password Storage**: Passwords are hashed and stored securely by Supabase
- **Auto Session Refresh**: Automatic token refresh handled by Supabase
- **CSRF Protection**: Built-in protection via Supabase Auth

## Future Enhancements

- User subscription management dashboard
- Additional formula calculations
- Export/import functionality (CSV, PDF)
- Advanced analytics dashboard
- Real-time stock data integration
- Mobile app version
- Dark/light theme toggle (optional)
- Two-factor authentication (2FA)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Related Documentation

- **`AUTHENTICATION.md`** - Complete authentication system documentation with setup instructions, security features, and usage examples
- **`supabase-schema.sql`** - Complete database schema with all tables, triggers, and RLS policies
- **`migrate-profiles-table.sql`** - Migration script for adding missing columns to existing profiles table

## License

This project is private and proprietary.
