"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from "@/app/lib/utils";

const SESSION_TOKEN_KEY = "session_token";

/**
 * Hook to manage session token synchronization with API requests
 * Injects x-session-token header into all fetch requests
 * Handles auto-logout when token mismatch is detected
 */
export function useSessionToken() {
  const router = useRouter();
  const interceptorsRef = useRef<{ fetch: typeof fetch } | null>(null);

  useEffect(() => {
    // Intercept fetch to inject session token header
    if (typeof window !== "undefined") {
      const originalFetch = window.fetch;

      window.fetch = async (...args) => {
        const [url, options = {}] = args;
        const token = getLocalStorageItem(SESSION_TOKEN_KEY);

        // Add session token to headers if present
        if (token && typeof url === "string") {
          const headers = new Headers(options.headers);
          headers.set("x-session-token", token);

          const modifiedOptions = {
            ...options,
            headers,
          };

          const response = await originalFetch(url, modifiedOptions);

          // Check for 401 (unauthorized) which indicates token mismatch
          if (response.status === 401) {
            // Clear local storage and redirect to login
            removeLocalStorageItem(SESSION_TOKEN_KEY);
            router.push("/login?error=session_expired");
            return response;
          }

          return response;
        }

        return originalFetch(url, options);
      };

      // Store original fetch for cleanup
      interceptorsRef.current = { fetch: originalFetch };
    }

    // Cleanup: restore original fetch
    return () => {
      if (interceptorsRef.current && typeof window !== "undefined") {
        window.fetch = interceptorsRef.current.fetch;
      }
    };
  }, [router]);
}

/**
 * Get session token from localStorage
 */
export function getSessionToken(): string | null {
  return getLocalStorageItem(SESSION_TOKEN_KEY);
}

/**
 * Set session token in localStorage
 */
export function setSessionToken(token: string): void {
  setLocalStorageItem(SESSION_TOKEN_KEY, token);
}

/**
 * Remove session token from localStorage
 */
export function clearSessionToken(): void {
  removeLocalStorageItem(SESSION_TOKEN_KEY);
}
