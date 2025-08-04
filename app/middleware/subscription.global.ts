import { useAuth } from "~/composables/auth/useAuth";

// Configuration des routes
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/pricing",
  "/moodboard",
  "/selection",
  "/gallery",
  "/proposal",
] as const;

// Fonctions utilitaires
const isPublicRoute = (path: string): boolean => {
  return PUBLIC_ROUTES.some((route) => path.startsWith(route));
};

export default defineNuxtRouteMiddleware(async (to) => {
  const { user } = useAuth();
  const store = useSubscriptionStore();

  // Routes publiques - accès libre
  if (isPublicRoute(to.path)) {
    return;
  }

  // Vérification authentification
  if (!user.value) {
    return navigateTo("/login");
  }

  // Chargement et vérification subscription
  try {
    await store.fetchCurrentSubscription(user.value.id);

    if (!store.hasValidSubscription) {
      return navigateTo("/pricing");
    }
  } catch (error) {
    console.error("Failed to fetch subscription:", error);
    return navigateTo("/pricing");
  }
});
