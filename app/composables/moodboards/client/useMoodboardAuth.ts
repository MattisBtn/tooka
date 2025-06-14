/**
 * Simplified Moodboard Authentication Composable
 */

export const useMoodboardAuth = (moodboardId: string) => {
  const AUTH_KEY = `moodboard_auth_${moodboardId}`;
  const AUTH_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  const isAuthenticated = ref(false);
  const authError = ref<string | null>(null);

  // Simple auth session interface
  interface AuthSession {
    moodboardId: string;
    timestamp: number;
    authenticated: boolean;
  }

  // Save authentication session
  const saveAuthSession = () => {
    const session: AuthSession = {
      moodboardId,
      timestamp: Date.now(),
      authenticated: true,
    };

    if (import.meta.client) {
      try {
        localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      } catch (error) {
        console.warn("Failed to save auth session:", error);
      }
    }
  };

  // Load authentication session
  const loadAuthSession = (): AuthSession | null => {
    if (!import.meta.client) return null;

    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (!stored) return null;

      const session: AuthSession = JSON.parse(stored);

      // Check if session is expired
      if (Date.now() - session.timestamp > AUTH_EXPIRY) {
        clearAuthSession();
        return null;
      }

      // Verify session belongs to current moodboard
      if (session.moodboardId !== moodboardId) {
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
        localStorage.removeItem(AUTH_KEY);
      } catch (error) {
        console.warn("Failed to clear auth session:", error);
      }
    }
  };

  // Verify stored session
  const verifyStoredAuth = async (): Promise<boolean> => {
    const session = loadAuthSession();
    if (!session || !session.authenticated) return false;

    isAuthenticated.value = true;
    return true;
  };

  // Authenticate with password
  const authenticate = async (
    password: string,
    verifyFn: (password: string) => Promise<boolean>
  ): Promise<boolean> => {
    try {
      authError.value = null;

      const isValid = await verifyFn(password);

      if (isValid) {
        isAuthenticated.value = true;
        saveAuthSession();
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
    return await verifyStoredAuth();
  };

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
