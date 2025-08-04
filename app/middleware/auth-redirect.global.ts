export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser();

  // Si l'utilisateur est connecté et essaie d'accéder aux pages d'auth
  if (
    user.value &&
    ["/login", "/register", "/reset-password"].includes(to.path)
  ) {
    return navigateTo("/");
  }

  // Ne pas rediriger depuis update-password car il peut y avoir un token de récupération
  if (to.path === "/update-password") {
    return;
  }
});
