"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import SectionTitle from "@/app/components/SectionTitle";
import { supabaseBrowser } from "@/app/lib/supabaseBrowser";

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [subscription, setSubscription] = useState<{
    plan: string;
    start_date: string;
    end_date: string;
    status: string;
  } | null>(null);

  // Load user profile data
  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserProfile = async () => {
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabaseBrowser.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // Get user profile from profiles table
      const { data: profile, error: profileError } = await supabaseBrowser
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      // Set email from profile or auth user
      setEmail(profile?.email || user.email || "");
      
      // Set name from user metadata (stored during signup)
      const userName = user.user_metadata?.name || user.email?.split("@")[0] || "";
      setName(userName);

      // Phone number - you can add this to profiles table if needed
      // For now, using empty string
      setPhone("");

      // Load subscription status
      const { data: subscriptionData } = await supabaseBrowser
        .from("subscriptions")
        .select("plan, start_date, end_date, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (subscriptionData) {
        const endDate = new Date(subscriptionData.end_date);
        const now = new Date();
        if (endDate > now) {
          setSubscription(subscriptionData as typeof subscription);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile data");
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setProfilePic(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabaseBrowser.auth.getUser();

      if (userError || !user) {
        setError("You must be logged in to update your profile");
        setSaving(false);
        return;
      }

      // Update user metadata (for name)
      if (name) {
        const { error: updateError } = await supabaseBrowser.auth.updateUser({
          data: {
            name: name,
          },
        });

        if (updateError) {
          throw updateError;
        }
      }

      // Email cannot be changed directly - removed email update logic

      // Update password if provided
      if (newPassword && newPassword.length >= 6) {
        const { error: passwordError } = await supabaseBrowser.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) {
          throw passwordError;
        }
      }

      // Update profile in profiles table (no email update)
      const { error: profileError } = await supabaseBrowser
        .from("profiles")
        .update({})
        .eq("id", user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        // Don't throw - profile update is less critical
      }

      setSuccess("Profile updated successfully!");
      setNewPassword(""); // Clear password field after successful update

      // Reload profile data to reflect changes
      await loadUserProfile();
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const requestPhoneChange = () => {
    if (!newPhone) {
      setError("Please enter a new phone number");
      return;
    }
    alert(
      "Your request to change phone number has been sent to admin. They will approve it shortly."
    );
    setNewPhone("");
    // TODO: Send request to backend admin panel
  };

  const requestEmailChange = () => {
    if (!newEmail || !newEmail.includes("@")) {
      setError("Please enter a valid new email address");
      return;
    }
    alert(
      "Your request to change email address has been sent to admin. They will approve it shortly."
    );
    setNewEmail("");
    // TODO: Send request to backend admin panel
  };

  if (loading) {
    return (
      <PageContainer centered>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white">Loading profile...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer centered>
      <div className="w-full max-w-md space-y-6">
        <SectionTitle
          align="center"
          size="md"
          title={
            <>
              <span className="text-white">Your </span>
              <span className="text-[#00ff88]">Profile</span>
            </>
          }
          description="Update your personal details, phone number, and password."
          className="space-y-2"
        />

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 rounded-md bg-green-500/10 border border-green-500/50 text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Profile Picture */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-gray-700 overflow-hidden mb-3 relative">
            {profilePic ? (
              <Image 
                src={profilePic} 
                alt="Profile" 
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Photo
              </div>
            )}
          </div>

          <label className="cursor-pointer inline-block">
            <span className="bg-[#00ff88] hover:bg-[#00cc6f] text-black py-2 px-4 rounded-md font-semibold transition inline-flex items-center gap-2 border border-[#00ff88]">
              Upload Photo
            </span>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>

        {/* Profile Form */}
        <Card variant="light" className="space-y-5">

          {/* Name */}
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />

          {/* Email (read-only) */}
          <div className="space-y-3">
            <Input
              label="Email Address"
              type="email"
              value={email}
              disabled
              description="Email address cannot be changed directly."
            />

            {/* Request Email Change */}
            <Input
              label="Request New Email Address"
              type="email"
              placeholder="Enter new email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />

            <Button onClick={requestEmailChange} variant="purple" fullWidth className="mt-1">
              Request Email Change
            </Button>
          </div>

          {/* Phone Number (cannot change directly) */}
          <div className="space-y-3">
            <Input
              label="Phone Number"
              type="text"
              value={phone}
              disabled
              description="Phone number cannot be changed directly."
            />

            {/* Request Phone Change */}
            <Input
              label="Request New Phone Number"
              type="text"
              placeholder="Enter new phone number"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />

            <Button onClick={requestPhoneChange} variant="purple" fullWidth className="mt-1">
              Request Phone Change
            </Button>
          </div>

          {/* Update Password */}
          <Input
            label="Change Password"
            type="password"
            placeholder="Enter new password (min. 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          {/* Save Button */}
          <Button
            onClick={handleSubmit}
            variant="success"
            fullWidth
            className="py-3"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Card>

        {/* Subscription Status Card */}
        <Card variant="light" className="space-y-5">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Subscription Status
            </h3>

            {subscription ? (
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Status:</span>{" "}
                  <span className="text-[#00ff88] font-medium">Active</span>
                </div>
                <div>
                  <span className="text-gray-400">Plan:</span>{" "}
                  <span className="text-white font-medium">
                    {subscription.plan === "1m"
                      ? "1 Month"
                      : subscription.plan === "6m"
                      ? "6 Months"
                      : "1 Year"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">End Date:</span>{" "}
                  <span className="text-white font-medium">
                    {new Date(subscription.end_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="pt-3">
                  <Button variant="primary" href="/subscribe" fullWidth>
                    Manage Subscription
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Status:</span>{" "}
                  <span className="text-red-400 font-medium">No Active Subscription</span>
                </div>
                <div className="pt-3">
                  <Button variant="primary" href="/subscribe" fullWidth>
                    Subscribe Now
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
