"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import SectionTitle from "@/app/components/SectionTitle";
import { setSessionToken } from "@/app/hooks/useSessionToken";
import { supabaseBrowser } from "@/app/lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const errorParam = searchParams.get("error");

  useEffect(() => {
    // Display error messages from URL params
    if (errorParam === "session_expired") {
      setError("Your session has expired. Please login again.");
    } else if (errorParam === "session_mismatch") {
      setError("You have been logged out from another device. Please login again.");
    } else if (errorParam === "profile_not_found") {
      setError("Account not found. Please sign up.");
    } else if (errorParam === "server_error") {
      setError("Server error. Please try again.");
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Sign in with Supabase Auth on client side
      const { data: authData, error: authError } = await supabaseBrowser.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        // Provide more helpful error messages
        let errorMessage = authError.message || "Invalid email or password";
        
        if (authError.message?.includes("Email not confirmed")) {
          errorMessage = "Please check your email and confirm your account before logging in.";
        } else if (authError.message?.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please try again.";
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      // Generate session token
      const sessionToken = crypto.randomUUID();

      // Update profile with session token using client-side Supabase (has auth context)
      const { error: profileError } = await supabaseBrowser
        .from("profiles")
        .upsert(
          {
            id: authData.user.id,
            email: authData.user.email!,
            role: "user",
            last_session_token: sessionToken,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        console.error("Failed to update session token:", profileError);
        // Still allow login even if token update fails
        // User can continue but single-device login won't work until this is fixed
      }

      // Store session token in localStorage
      setSessionToken(sessionToken);

      // Redirect to intended page or dashboard
      router.push(redirectTo);
    } catch (err: any) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <PageContainer centered>
      <Card variant="light" maxWidth="md">
        <SectionTitle
          align="center"
          title="Login to Your Account"
          description="Access your dashboard and manage your subscriptions securely."
          className="mb-6"
        />

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            disabled={loading}
          />

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-[#00ff88] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        {/* Divider */}
        <p className="text-center text-sm text-gray-500 mt-6">
          — Don't have an account? —
        </p>

        {/* Signup Link */}
        <div className="text-center mt-3">
          <Link
            href="/signup"
            className="text-[#00ff88] font-medium hover:underline"
          >
            Create New Account
          </Link>
        </div>
      </Card>
    </PageContainer>
  );
}
