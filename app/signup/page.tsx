"use client";

import { useState } from "react";
import Link from "next/link";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import SectionTitle from "@/app/components/SectionTitle";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Add signup logic here
    console.log("Form submitted:", form);
  };

  return (
    <PageContainer centered>
      <Card variant="light" maxWidth="md">

        <SectionTitle
          align="center"
          title="Create Your Account"
          description="Get unlimited formula access by creating your free Magic Formulae account."
          className="mb-6"
        />

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
          />

          <Input
            label="Email"
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />

          <Input
            label="Phone Number"
            type="tel"
            name="phone"
            required
            maxLength={10}
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
            description="We will use this for account security and updates."
          />

          <Input
            label="Password"
            type="password"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
            placeholder="Create a password"
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            required
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
          />

          {/* Terms */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              required
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
          <Button type="submit" fullWidth>
            Create Account
          </Button>
        </form>

        {/* Already have an account? */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?
        </p>

        <div className="text-center mt-1">
          <Link href="/login" className="text-[#00ff88] font-medium hover:underline">
            Login Here
          </Link>
        </div>
      </Card>
    </PageContainer>
  );
}
