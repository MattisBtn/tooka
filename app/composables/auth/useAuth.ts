import type { AuthError } from "@supabase/supabase-js";
import type {
  IAuthError,
  ILoginCredentials,
  IRegistrationData,
} from "~/types/auth";

export const useAuth = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  const loading = ref(false);
  const error = ref<IAuthError | null>(null);

  const isLoggedIn = computed(() => !!user.value);

  const resetError = () => {
    error.value = null;
  };

  const handleAuthError = (err: Error | AuthError | unknown): IAuthError => {
    const authError: IAuthError = {
      message:
        err instanceof Error
          ? err.message
          : "Une erreur inattendue est survenue",
      code: (err as AuthError)?.code,
      status: (err as AuthError)?.status,
    };
    error.value = authError;
    return authError;
  };

  const login = async (credentials: ILoginCredentials) => {
    resetError();
    loading.value = true;

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) throw authError;
      return { success: true };
    } catch (err: Error | AuthError | unknown) {
      return { success: false, error: handleAuthError(err) };
    } finally {
      loading.value = false;
    }
  };

  const signInWithGoogle = async () => {
    resetError();
    loading.value = true;

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        console.error("Google OAuth error:", authError);
        throw authError;
      }

      return { success: true };
    } catch (err: Error | AuthError | unknown) {
      console.error("Google OAuth failed:", err);
      return { success: false, error: handleAuthError(err) };
    } finally {
      loading.value = false;
    }
  };

  const register = async (data: IRegistrationData) => {
    resetError();
    loading.value = true;

    try {
      const { error: authError, data: userData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      });

      if (authError) throw authError;

      // If email confirmation is required in Supabase
      const needsEmailConfirmation = !userData.session;

      return {
        success: true,
        needsEmailConfirmation,
      };
    } catch (err: Error | AuthError | unknown) {
      return { success: false, error: handleAuthError(err) };
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    resetError();
    loading.value = true;

    try {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
      return { success: true };
    } catch (err: Error | AuthError | unknown) {
      return { success: false, error: handleAuthError(err) };
    } finally {
      loading.value = false;
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    resetError();
    loading.value = true;

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (authError) throw authError;
      return { success: true };
    } catch (err: Error | AuthError | unknown) {
      return { success: false, error: handleAuthError(err) };
    } finally {
      loading.value = false;
    }
  };

  const updatePassword = async (password: string) => {
    resetError();
    loading.value = true;

    try {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      return { success: true };
    } catch (err: Error | AuthError | unknown) {
      return { success: false, error: handleAuthError(err) };
    } finally {
      loading.value = false;
    }
  };

  return {
    user,
    isLoggedIn,
    loading: readonly(loading),
    error: readonly(error),
    login,
    signInWithGoogle,
    register,
    logout,
    resetPasswordForEmail,
    updatePassword,
    resetError,
  };
};
