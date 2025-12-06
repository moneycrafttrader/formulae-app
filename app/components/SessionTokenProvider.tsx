"use client";

import { useEffect } from "react";
import { useSessionToken } from "@/app/hooks/useSessionToken";

/**
 * Provider component to initialize session token hook
 * Must be a client component to access browser APIs
 */
export default function SessionTokenProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useSessionToken();

  return <>{children}</>;
}
