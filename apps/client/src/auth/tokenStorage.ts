const KEY = "homelabconnect.token";

// Storage can be unavailable (private mode, blocked site data), so every access is guarded.
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(KEY, token);
    } catch {
      // The session still works for this tab; it just won't survive a reload.
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // Nothing stored, nothing to clear.
    }
  },
};
