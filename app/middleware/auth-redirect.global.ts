import { useAuth } from "~/composables/auth/useAuth";

// Routes d'authentification à protéger
const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

// Vérifier si la route est une page d'authentification
const isAuthRoute = (path: string): boolean => {
  return AUTH_ROUTES.some((route) => path.startsWith(route));
};

export default defineNuxtRouteMiddleware(async (to) => {
  const { user } = useAuth();

  // Si l'utilisateur est connecté et tente d'accéder à une page d'auth
  if (user.value && isAuthRoute(to.path)) {
    return navigateTo("/");
  }
});
