"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from "@/app/lib/utils";
import { getApiUrl } from "@/app/lib/baseUrl";

const SESSION_TOKEN_KEY = "session_token";

/**
 * Convert a relative URL to absolute if needed
 * Ensures all internal API calls use absolute URLs
 */
function ensureAbsoluteUrl(url: string): string {
  // If already absolute (http:// or https://), return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If relative URL starting with /api, convert to absolute using base URL
  if (url.startsWith("/api")) {
    return getApiUrl(url);
  }

  // For other relative URLs, convert if they start with /
  if (url.startsWith("/")) {
    return getApiUrl(url);
  }

  // Return as-is if it doesn't look like an internal API call
  return url;
}

/**
 * Hook to manage session token synchronization with API requests
 * Injects x-session-token header into all fetch requests
 * Handles auto-logout when token mismatch is detected
 * Ensures all internal API calls use absolute URLs
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

        // Convert relative URLs to absolute for API calls
        let finalUrl = url;
        if (typeof url === "string") {
          finalUrl = ensureAbsoluteUrl(url);
        } else if (url instanceof Request) {
          // For Request objects, convert URL to absolute if relative
          const urlString = url.url;
          if (urlString.startsWith("/api") || (urlString.startsWith("/") && !urlString.startsWith("//"))) {
            const absoluteUrl = ensureAbsoluteUrl(urlString);
            // Create new Request with absolute URL, preserving all properties
            const newRequest = new Request(absoluteUrl, url);
            finalUrl = newRequest;
          }
        }

        // Add session token to headers if present
        if (token) {
          const headers = new Headers(
            options.headers || (finalUrl instanceof Request ? finalUrl.headers : undefined)
          );
          headers.set("x-session-token", token);

          const modifiedOptions = {
            ...options,
            headers,
          };

          const response = await originalFetch(finalUrl, modifiedOptions);

          // Check for 401 (unauthorized) which indicates token mismatch
          // Only redirect if the URL is an API route that requires authentication
          // Never redirect for subscription/check APIs as they handle auth gracefully
          if (response.status === 401) {
            let urlString = "";
            if (typeof finalUrl === "string") {
              urlString = finalUrl;
            } else if (finalUrl instanceof Request) {
              urlString = finalUrl.url;
            }
            
            // List of APIs that should NOT trigger auto-redirect (they handle auth gracefully)
            const safeApis = [
              "/check-subscription-status",
              "/subscription/details",
              "/subscription/details/",
            ];
            
            const isSafeApi = urlString && safeApis.some(safe => urlString.includes(safe));
            
            // Only redirect for protected APIs that aren't in the safe list
            if (urlString && urlString.includes("/api/") && !isSafeApi) {
              // Clear local storage and redirect to login
              removeLocalStorageItem(SESSION_TOKEN_KEY);
              router.push("/login?error=session_expired");
              return response;
            }
            // For safe APIs, just return the response without redirecting
          }

          return response;
        }

        // No token - just ensure absolute URL if needed
        if (typeof url === "string" && url !== finalUrl) {
          return originalFetch(finalUrl, options);
        }

        return originalFetch(finalUrl, options);
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
