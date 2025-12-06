"use client";

import { useState } from "react";
import PageContainer from "@/app/components/PageContainer";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import SectionTitle from "@/app/components/SectionTitle";

export default function ProfilePage() {
  const [name, setName] = useState("Shubham Trader");
  const [email, setEmail] = useState("shubham@example.com");
  const [phone, setPhone] = useState("9876543210");
  const [newPhone, setNewPhone] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setProfilePic(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    alert("Profile Updated Successfully!");
    // TODO: Send updates to backend API
  };

  const requestPhoneChange = () => {
    alert(
      "Your request to change phone number has been sent to admin. They will approve it shortly."
    );
    // TODO: Send request to backend admin panel
  };

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

        {/* Profile Picture */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-gray-700 overflow-hidden mb-3">
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
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
          <Input label="Change Password" type="password" placeholder="Enter new password" />

          {/* Save Button */}
          <Button
            onClick={handleSubmit}
            variant="success"
            fullWidth
            className="py-3"
          >
            Save Changes
          </Button>
        </Card>
      </div>
    </PageContainer>
  );
}
