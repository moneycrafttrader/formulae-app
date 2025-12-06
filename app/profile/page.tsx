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
  const [newPassword, setNewPassword] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

      // Update email if changed
      if (email && email !== user.email) {
        const { error: emailError } = await supabaseBrowser.auth.updateUser({
          email: email,
        });

        if (emailError) {
          throw emailError;
        }
      }

      // Update password if provided
      if (newPassword && newPassword.length >= 6) {
        const { error: passwordError } = await supabaseBrowser.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) {
          throw passwordError;
        }
      }

      // Update profile in profiles table
      const { error: profileError } = await supabaseBrowser
        .from("profiles")
        .update({
          email: email,
        })
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
    alert(
      "Your request to change phone number has been sent to admin. They will approve it shortly."
    );
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

          {/* Email */}
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />

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
      </div>
    </PageContainer>
  );
}
