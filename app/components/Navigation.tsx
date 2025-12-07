"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Button from "./Button";
import { supabaseBrowser } from "@/app/lib/supabaseBrowser";
import { clearSessionToken } from "@/app/hooks/useSessionToken";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Clear session token from localStorage first
      clearSessionToken();

      // Clear all cookies on client side
      document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // Clear Supabase cookies (they use the project ref)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      if (supabaseUrl) {
        const projectRef = supabaseUrl.split("//")[1]?.split(".")[0] || "supabase";
        document.cookie = `sb-${projectRef}-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }

      // Try to call logout API (non-blocking)
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      } catch (apiError) {
        console.error("Logout API error:", apiError);
        // Continue with logout even if API call fails
      }

      // Sign out from Supabase (non-blocking)
      try {
        await supabaseBrowser.auth.signOut();
      } catch (signOutError) {
        console.error("Supabase signOut error:", signOutError);
        // Continue with logout even if signOut fails
      }

      // Force redirect using window.location to ensure clean state
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Even on error, try to redirect to home
      window.location.href = "/";
    }
  };

  const isActive = (path: string) => pathname === path;

  // Base nav links (always visible)
  const baseNavLinks = [{ href: "/", label: "Home" }];

  // Protected nav links (only when logged in)
  const protectedNavLinks = [
    { href: "/calculator", label: "Calculator" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  // Combine links based on auth status
  const navLinks = isLoggedIn
    ? [...baseNavLinks, ...protectedNavLinks]
    : baseNavLinks;

  return (
    <nav className="bg-[#0a0a0a] border-b border-gray-800 shadow-lg shadow-black/50 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#00ff88]">MF</span>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-tight">MAGIC FORMULAE</span>
                <span className="text-xs text-[#00ff88] leading-tight">Powered by Sure Profit India</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-[#00ff88] bg-[#00ff88]/10"
                    : "text-white hover:text-[#00ff88] hover:bg-[#00ff88]/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {!loading && !isLoggedIn && (
              <Button
                variant="primary"
                href="/signup"
                className="hidden sm:inline-flex items-center gap-1"
              >
                Get Started →
              </Button>
            )}
            {!loading && isLoggedIn && (
              <>
                <Button
                  variant="secondary"
                  href="/profile"
                  className="hidden sm:inline-flex items-center gap-1"
                >
                  Profile
                </Button>
                <Button
                  variant="danger"
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center gap-1"
                >
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

