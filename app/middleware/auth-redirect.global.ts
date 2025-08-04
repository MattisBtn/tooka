export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser();

  // Si l'utilisateur est connecté et essaie d'accéder aux pages d'auth
  if (
    user.value &&
    ["/login", "/register", "/reset-password"].includes(to.path)
  ) {
    return navigateTo("/");
  }

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à update-password
  // on vérifie qu'il a un token de récupération
  if (to.path === "/update-password") {
    const supabase = useSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Si pas de session et pas de token de récupération, rediriger vers login
    if (!session) {
      return navigateTo("/login");
    }
  }
});
