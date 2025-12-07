"use client";

import { useEffect, useState } from "react";
import type { Subscription } from "@/app/lib/subscription";

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
