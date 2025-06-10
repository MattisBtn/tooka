/**
 * Gallery Authentication Composable
 * Handles client gallery authentication with session persistence
 */

export const useGalleryAuth = (galleryId: string) => {
  const AUTH_KEY = `gallery_auth_${galleryId}`;
  const AUTH_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  const isAuthenticated = ref(false);
  const authError = ref<string | null>(null);

  // Auth session interface
  interface AuthSession {
    galleryId: string;
    timestamp: number;
    passwordHash: string; // Simple hash for verification
  }

  // Simple hash function for password verification
  const createPasswordHash = (password: string, galleryId: string): string => {
    // Simple hash combining password and galleryId for uniqueness
    const combined = `${password}_${galleryId}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  };

  // Save authentication session
  const saveAuthSession = (password: string) => {
    const session: AuthSession = {
      galleryId,
      timestamp: Date.now(),
      passwordHash: createPasswordHash(password, galleryId),
    };

    if (import.meta.client) {
      try {
        sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
      } catch (error) {
        console.warn("Failed to save auth session:", error);
      }
    }
  };

  // Load authentication session
  const loadAuthSession = (): AuthSession | null => {
    if (!import.meta.client) return null;

    try {
      const stored = sessionStorage.getItem(AUTH_KEY);
      if (!stored) return null;

      const session: AuthSession = JSON.parse(stored);

      // Check if session is expired
      if (Date.now() - session.timestamp > AUTH_EXPIRY) {
        clearAuthSession();
        return null;
      }

      // Verify session belongs to current gallery
      if (session.galleryId !== galleryId) {
        return null;
      }

      return session;
    } catch (error) {
      console.warn("Failed to load auth session:", error);
      clearAuthSession();
      return null;
    }
  };

  // Clear authentication session
  const clearAuthSession = () => {
    if (import.meta.client) {
      try {
        sessionStorage.removeItem(AUTH_KEY);
      } catch (error) {
        console.warn("Failed to clear auth session:", error);
      }
    }
  };

  // Verify password against stored session
  const verifyStoredAuth = async (): Promise<boolean> => {
    const session = loadAuthSession();
    if (!session) return false;

    // Mark as authenticated if we have a valid session
    isAuthenticated.value = true;
    return true;
  };

  // Authenticate with password and save session
  const authenticate = async (
    password: string,
    verifyFn: (password: string) => Promise<boolean>
  ): Promise<boolean> => {
    try {
      authError.value = null;

      // Verify password with server
      const isValid = await verifyFn(password);

      if (isValid) {
        isAuthenticated.value = true;
        saveAuthSession(password);
        return true;
      } else {
        authError.value = "Mot de passe incorrect";
        return false;
      }
    } catch {
      authError.value = "Erreur lors de la vérification du mot de passe";
      return false;
    }
  };

  // Logout and clear session
  const logout = () => {
    isAuthenticated.value = false;
    authError.value = null;
    clearAuthSession();
  };

  // Initialize authentication state
  const initializeAuth = async (): Promise<boolean> => {
    // Try to restore from stored session first
    const hasValidSession = await verifyStoredAuth();
    return hasValidSession;
  };

  // Cleanup on unmount
  onUnmounted(() => {
    // Don't clear session on unmount - keep it for navigation
  });

  return {
    // State
    isAuthenticated: readonly(isAuthenticated),
    authError: readonly(authError),

    // Methods
    authenticate,
    logout,
    initializeAuth,
    clearAuthSession,

    // Utilities
    hasStoredAuth: () => loadAuthSession() !== null,
  };
};
