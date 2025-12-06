import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

/**
 * Server-side Supabase client for use in Server Components and API routes
 * Uses cookies() to maintain session state
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set(name, value, options);
        } catch (error) {
          // Cookie may be set in a Server Action/Route Handler
          // Silently fail in that case
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set(name, "", { ...options, maxAge: 0 });
        } catch (error) {
          // Cookie may be removed in a Server Action/Route Handler
          // Silently fail in that case
        }
      },
    },
  } as any); // Type assertion needed as cookies option exists but not in types
}

/**
 * Create Supabase client for middleware
 * Uses request cookies directly (middleware doesn't support cookies() from next/headers)
 */
export function createMiddlewareClient(request: NextRequest) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        // In middleware, we can't set cookies directly
        // This will be handled by the response
      },
      remove(name: string, options: any) {
        // In middleware, we can't remove cookies directly
        // This will be handled by the response
      },
    },
  } as any); // Type assertion needed as cookies option exists but not in types
}

/**
 * Get current user from server-side session
 */
export async function getServerUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get current session from server-side
 */
export async function getServerSession() {
  const supabase = await createServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}
