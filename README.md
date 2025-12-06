# Magic Formulae – Powered by Sure Profit India

A Next.js application for calculating trading formulae with secure subscription access. This application provides powerful formula calculations, user authentication, profile management, and subscription features. The application features a professional dark theme matching the Magic Formulae brand with bright green accents and modern UI components.

## Features

- **Formula Calculator**: Calculate pivot points, support/resistance levels (R1-R4, S1-S4) using Classic and Camarilla formulas. Switch between formula types with tab navigation. Enter Open, High, Low, and Close (OHLC) values to generate trading levels.
- **User Authentication**: Secure login, signup, and password recovery with dark-themed forms
- **Dashboard**: User dashboard with subscription status, trial tracking, and quick navigation
- **Profile Management**: Update profile information, change password, upload profile picture, and manage account settings
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
│   ├── components/          # Shared reusable components
│   │   ├── PageContainer.tsx  # Page layout wrapper with dark theme
│   │   ├── Card.tsx          # Card component with dark variant
│   │   ├── Button.tsx        # Button component with multiple variants
│   │   ├── Input.tsx         # Form inputs with labels, helper text, and error states
│   │   ├── SectionTitle.tsx  # Consistent section headers with optional descriptions
│   │   ├── FormulaTabs.tsx  # Tab switcher for Classic/Camarilla formula types
│   │   └── Navigation.tsx    # Fixed navigation bar with branding
│   ├── api/                # API routes
│   │   ├── create-order/   # Razorpay order creation endpoint
│   │   │   └── route.ts    # POST endpoint for creating payment orders
│   │   └── verify-payment/ # Payment verification endpoint
│   │       └── route.ts    # POST endpoint for verifying Razorpay payments
│   ├── lib/                # Utility functions and constants
│   │   ├── theme.ts        # Theme constants (dark theme, colors)
│   │   ├── utils.ts        # Helper functions (localStorage, SSR safe)
│   │   └── supabase.ts     # Supabase client initialization
│   ├── calculator/         # Calculator page and formula utilities
│   │   ├── page.tsx        # Main calculator interface with formula tabs
│   │   └── formulaUtils.ts # Classic and Camarilla pivot point calculations
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── profile/           # Profile page
│   ├── forgot-password/   # Password recovery page
│   ├── subscribe/         # Subscription plans page
│   ├── layout.tsx         # Root layout with Navigation
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles (dark theme, grid pattern)
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
- `@supabase/supabase-js` - Supabase client for database operations

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
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Developer Mode (Optional - bypasses trial limits for testing)
NEXT_PUBLIC_DEV_MODE=true
```

**Note**: Get your Razorpay credentials from [Razorpay Dashboard](https://dashboard.razorpay.com/) and Supabase credentials from your [Supabase Project Settings](https://app.supabase.com/).

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

### API Routes

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

- `/` - Home page with hero section and feature overview
- `/login` - User login with dark-themed form
- `/signup` - User registration with comprehensive form
- `/forgot-password` - Password recovery page
- `/dashboard` - User dashboard with subscription status and quick actions
- `/calculator` - Formula calculator with Classic and Camarilla pivot point calculations. Enter OHLC values to generate R1-R4 and S1-S4 levels with tab-based formula switching
- `/profile` - User profile management with photo upload
- `/subscribe` - Subscription plans with pricing tiers

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

The application uses Supabase for storing payment records. You need to create a `payments` table with the following schema:

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

-- Create index for faster lookups
CREATE INDEX idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX idx_payments_status ON payments(status);
```

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

## Future Enhancements

- Payment webhook handling for order status updates
- User authentication with Supabase Auth
- User subscription management dashboard
- Additional formula calculations
- Export/import functionality (CSV, PDF)
- Advanced analytics dashboard
- Real-time stock data integration
- Mobile app version
- Dark/light theme toggle (optional)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## License

This project is private and proprietary.
