"use client";

import { useState } from "react";
import Link from "next/link";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import SectionTitle from "@/app/components/SectionTitle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Add login logic here
    console.log("Login attempt:", { email, password });
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

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>

          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-[#00ff88] hover:underline">
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <Button type="submit" fullWidth>
            Login
          </Button>
        </form>

        {/* Divider */}
        <p className="text-center text-sm text-gray-500 mt-6">
          — Don’t have an account? —
        </p>

        {/* Signup Link */}
        <div className="text-center mt-3">
          <Link href="/signup" className="text-[#00ff88] font-medium hover:underline">
            Create New Account
          </Link>
        </div>
      </Card>
    </PageContainer>
  );
}
