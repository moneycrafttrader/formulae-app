"use client";

import { useState } from "react";
import Link from "next/link";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import SectionTitle from "@/app/components/SectionTitle";
import { supabaseBrowser } from "@/app/lib/supabaseBrowser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      // Request password reset
      const { error: resetError } = await supabaseBrowser.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message || "Failed to send reset email");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <PageContainer centered>
      <Card variant="light" maxWidth="md">
        <SectionTitle
          align="center"
          title="Forgot Password"
          description="Enter your email address and we will send you a password reset link."
          className="mb-6"
        />

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 rounded-md bg-green-500/10 border border-green-500/50 text-green-400 text-sm">
            Password reset email sent! Please check your inbox and follow the
            instructions to reset your password.
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
            />

            {/* Reset Button */}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        )}

        {/* Back to Login */}
        <div className="text-center mt-6">
          <Link
            href="/login"
            className="text-[#00ff88] font-medium hover:underline"
          >
            ← Back to Login
          </Link>
        </div>
      </Card>
    </PageContainer>
  );
}
