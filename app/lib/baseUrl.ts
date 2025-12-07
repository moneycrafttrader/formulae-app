/**
 * Get the base URL for API calls
 * Works on both client and server
 * Uses NEXT_PUBLIC_SITE_URL if available, otherwise falls back to window.location.origin on client
 * Never uses localhost - always uses NEXT_PUBLIC_SITE_URL or dynamic window.location.origin
 */
export function getBaseUrl(): string {
  // On server-side, use environment variable (must be set in production)
  if (typeof window === "undefined") {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      // In production, this should always be set
      // In development, it may not be set, so we can't construct URLs server-side
      // This should only be called client-side anyway
      throw new Error("NEXT_PUBLIC_SITE_URL must be set in environment variables");
    }
    return siteUrl;
  }

  // On client-side, prefer environment variable, fallback to window.location.origin
  // window.location.origin is always correct and never localhost in production
  return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
}

/**
 * Build an absolute API URL from a relative path
 * @param path - Relative API path (e.g., "/api/auth/store-session-token")
 * @returns Absolute URL
 */
export function getApiUrl(path: string): string {
  const baseUrl = getBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
