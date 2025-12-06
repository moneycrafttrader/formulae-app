"use client";

import { useState } from "react";
import Link from "next/link";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import SectionTitle from "@/app/components/SectionTitle";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with your backend email reset system
    console.log("Password reset email sent to:", email);
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />

          {/* Reset Button */}
          <Button type="submit" fullWidth>
            Send Reset Link
          </Button>

        </form>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <Link href="/login" className="text-[#00ff88] font-medium hover:underline">
            Back to Login
          </Link>
        </div>
      </Card>
    </PageContainer>
  );
}
