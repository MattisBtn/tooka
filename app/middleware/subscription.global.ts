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

  // Chargement et vérification subscription (non bloquant)
  try {
    await store.fetchCurrentSubscription(user.value.id);

    if (!store.hasValidSubscription) {
      return navigateTo("/pricing");
    }
  } catch (error) {
    // Ne bloque pas la navigation en cas d’erreur réseau momentanée
    console.warn(
      "Subscription check failed, letting navigation continue:",
      error
    );
    // Option: laisser passer et laisser les pages gérer l’absence de droits/accès
    return;
  }
});
