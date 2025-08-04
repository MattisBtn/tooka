import { useAuth } from "~/composables/auth/useAuth";

export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuth();
  const store = useSubscriptionStore();

  // Pages nécessitant un abonnement actif
  const protectedRoutes = ["/dashboard", "/projects/create", "/analytics"];

  // Si c'est une route protégée
  if (protectedRoutes.some((route) => to.path.startsWith(route))) {
    // Si pas d'utilisateur connecté
    if (!user.value) {
      return navigateTo("/login");
    }

    // Si pas d'abonnement actif
    if (!store.hasActiveSubscription) {
      return navigateTo("/pricing");
    }
  }
});
