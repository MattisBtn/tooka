/**
 * Simplified Client Authentication Composable
 */
export const useClientAuth = (resourceType: string, resourceId: string) => {
  const AUTH_KEY = `${resourceType}_auth_${resourceId}`;

  const isAuthenticated = ref(false);
  const authError = ref<string | null>(null);

  // Check if project has password
  const hasStoredAuth = (): boolean => {
    if (!import.meta.client) return false;
    try {
      return localStorage.getItem(AUTH_KEY) === "authenticated";
    } catch {
      return false;
    }
  };

  // Set authenticated state
  const setAuthenticated = (authenticated: boolean) => {
    isAuthenticated.value = authenticated;

    if (import.meta.client) {
      try {
        if (authenticated) {
          localStorage.setItem(AUTH_KEY, "authenticated");
        } else {
          localStorage.removeItem(AUTH_KEY);
        }
      } catch {
        // Ignore storage errors
      }
    }
  };

  // Initialize from storage
  const initializeAuth = () => {
    if (hasStoredAuth()) {
      isAuthenticated.value = true;
    }
  };

  // Verify password
  const verifyPassword = async (
    password: string,
    verifyFn: (password: string) => Promise<boolean>
  ): Promise<boolean> => {
    try {
      authError.value = null;

      const isValid = await verifyFn(password);

      if (isValid) {
        setAuthenticated(true);
        return true;
      } else {
        authError.value = "Mot de passe incorrect";
        return false;
      }
    } catch {
      authError.value = "Erreur lors de la vérification";
      return false;
    }
  };

  // Logout
  const logout = () => {
    setAuthenticated(false);
    authError.value = null;
  };

  return {
    isAuthenticated: readonly(isAuthenticated),
    authError: readonly(authError),
    setAuthenticated,
    initializeAuth,
    verifyPassword,
    logout,
    hasStoredAuth,
  };
};
