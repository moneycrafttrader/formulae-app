// ==============================
// Safe LocalStorage Utilities
// ==============================

/**
 * Check if running on client-side (browser)
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Safely read from localStorage
 */
export function getLocalStorageItem(key: string): string | null {
  if (!isClient()) return null;

  try {
    return window.localStorage.getItem(key);
  } catch (err) {
    console.error("localStorage read error:", err);
    return null;
  }
}

/**
 * Safely write to localStorage
 */
export function setLocalStorageItem(key: string, value: string): void {
  if (!isClient()) return;

  try {
    window.localStorage.setItem(key, value);
  } catch (err) {
    console.error("localStorage write error:", err);
  }
}

/**
 * Safely remove a key from localStorage
 */
export function removeLocalStorageItem(key: string): void {
  if (!isClient()) return;

  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.error("localStorage remove error:", err);
  }
}

/**
 * Enable developer mode (bypasses trial limits)
 */
export function enableDeveloperMode(): void {
  if (!isClient()) return;
  setLocalStorageItem("dev_mode", "true");
  console.log("🛠️ Developer mode enabled - Unlimited calculations");
}

/**
 * Disable developer mode
 */
export function disableDeveloperMode(): void {
  if (!isClient()) return;
  removeLocalStorageItem("dev_mode");
  console.log("Developer mode disabled");
}

/**
 * Check if developer mode is enabled
 */
export function isDeveloperMode(): boolean {
  if (!isClient()) return false;
  return (
    process.env.NEXT_PUBLIC_DEV_MODE === "true" ||
    getLocalStorageItem("dev_mode") === "true"
  );
}

/**
 * Reset trial count for development mode only
 * This function only works in development and should never run in production
 */
export function resetTrialCountForDev(): void {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    setLocalStorageItem("trialsLeft", "0");
  }
}

/**
 * Get trials left from localStorage
 * Returns the number of trials remaining, defaulting to 20 if not set
 */
export function getTrialsLeft(): number {
  if (typeof window === "undefined") return 0;

  const stored = getLocalStorageItem("trial_count");
  return stored ? Number(stored) : 20; // default 20 for dev
}

/**
 * Set trials left in localStorage
 * @param value - Number of trials remaining
 */
export function setTrialsLeft(value: number): void {
  if (typeof window === "undefined") return;
  setLocalStorageItem("trial_count", String(value));
}
