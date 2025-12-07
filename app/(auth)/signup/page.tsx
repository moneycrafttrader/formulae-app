"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import SectionTitle from "@/app/components/SectionTitle";
import { supabaseBrowser } from "@/app/lib/supabaseBrowser";
import { setSessionToken } from "@/app/hooks/useSessionToken";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check if user is already authenticated and redirect if so
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabaseBrowser.auth.getSession();
        
        // If user is already logged in, redirect to dashboard immediately
        if (session && !error) {
          // Use window.location for more reliable redirect
          window.location.href = "/dashboard";
          return;
        }
        
        // If no session or error, show the signup page
        setMounted(true);
      } catch (err) {
        // If error checking session, allow page to render anyway
        console.error("Error checking auth:", err);
        setMounted(true);
      }
    };

    checkAuth();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error on input change
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!termsAccepted) {
      setError("Please accept the Terms & Conditions");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: signUpError } =
        await supabaseBrowser.auth.signUp({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          options: {
            data: {
              name: form.name,
            },
            emailRedirectTo: "https://formulae-app.vercel.app/auth/callback",
          },
        });

      if (signUpError) {
        setError(signUpError.message || "Signup failed");
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Failed to create account");
        setLoading(false);
        return;
      }

      // Generate session token
      const sessionToken = crypto.randomUUID();

      // Wait a moment for the trigger to create the profile
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Store session token via API (updates both profiles and device_lock)
      const tokenRes = await fetch("/api/auth/store-session-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_token: sessionToken,
        }),
      });

      if (!tokenRes.ok) {
        console.error("Failed to store session token");
        // Continue anyway - profile will be updated on first login
      }

      // Store session token in localStorage and cookie
      setSessionToken(sessionToken);
      
      // Also set cookie for middleware access
      document.cookie = `session_token=${sessionToken}; path=/; max-age=86400; SameSite=Lax`;

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Don't render until we've checked auth status to prevent flashing
  if (!mounted) {
    return (
      <PageContainer centered>
        <Card variant="light" maxWidth="md">
          <div className="text-center py-8">
            <div className="text-white">Loading...</div>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer centered>
      <Card variant="light" maxWidth="md">
        <SectionTitle
          align="center"
          title="Create Your Account"
          description="Get unlimited formula access by creating your free Magic Formulae account."
          className="mb-6"
        />

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Signup Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            type="text"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            disabled={loading}
          />

          <Input
            label="Email"
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
            placeholder="Create a password (min. 6 characters)"
            disabled={loading}
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            required
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            disabled={loading}
          />

          {/* Terms */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              required
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 accent-[#00ff88]"
            />
            <p className="text-sm text-gray-300">
              I agree to the{" "}
              <Link href="/terms" className="text-[#00ff88] hover:underline">
                Terms & Conditions
              </Link>
            </p>
          </div>

          {/* Signup Button */}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        {/* Already have an account? */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?
        </p>

        <div className="text-center mt-1">
          <Link
            href="/login"
            className="text-[#00ff88] font-medium hover:underline"
          >
            Login Here
          </Link>
        </div>
      </Card>
    </PageContainer>
  );
}
