"use client";

import { useEffect, useState } from "react";

interface Subscription {
  id: string;
  user_id: string;
  plan: "1m" | "6m" | "12m";
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "cancelled";
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchSubscription() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/details", {
        credentials: "include", // Ensure cookies are sent
      });
      
      // Handle response regardless of status code
      if (res.ok || res.status === 401 || res.status === 403) {
        const data = await res.json();
        setSubscription(data.subscription || null);
      } else {
        // For any other error, just set to null
        setSubscription(null);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscription();
  }, []);

  return { subscription, loading, refresh: fetchSubscription };
}
