import type { AuthError } from "@supabase/supabase-js";
import type {
  IAuthError,
  ILoginCredentials,
  IRegistrationData,
  IResetPasswordData,
  IUpdatePasswordData,
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

  const resetPassword = async (data: IResetPasswordData) => {
    resetError();
    loading.value = true;

    try {
      // Utiliser l'URL de base configurée ou l'origine actuelle
      const config = useRuntimeConfig();
      const baseUrl = config.public.siteUrl;

      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: `${baseUrl}/update-password`,
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

  const updatePassword = async (data: IUpdatePasswordData) => {
    resetError();
    loading.value = true;

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (authError) throw authError;
      return { success: true };
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

  return {
    user,
    isLoggedIn,
    loading: readonly(loading),
    error: readonly(error),
    login,
    register,
    resetPassword,
    updatePassword,
    logout,
    resetError,
  };
};
