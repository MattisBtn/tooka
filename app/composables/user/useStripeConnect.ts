import type {
  StripeConnectAccount,
  StripeConnectOnboardingSession,
} from "~/types/userProfile";
import { useAuth } from "../auth/useAuth";

export const useStripeConnect = () => {
  const { user } = useAuth();
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const stripeAccount = ref<StripeConnectAccount | null>(null);

  // Fetch user's Stripe Connect account status
  const fetchStripeAccount = async () => {
    if (!user.value?.id) return;

    try {
      isLoading.value = true;
      error.value = null;

      const data = await $fetch<{ account: StripeConnectAccount | null }>(
        `/api/stripe/account/${user.value.id}`
      );
      stripeAccount.value = data.account;

      // Si le compte était présent mais a été nettoyé, informer l'utilisateur
      if (!data.account && stripeAccount.value) {
        error.value =
          "Votre compte Stripe n'est plus accessible. Vous pouvez en créer un nouveau.";
      }
    } catch (err) {
      error.value = "Erreur lors de la récupération du compte Stripe";
      console.error("Error fetching Stripe account:", err);
    } finally {
      isLoading.value = false;
    }
  };

  // Create Stripe Connect account and get onboarding URL
  const createStripeAccount = async () => {
    if (!user.value?.id) return;

    try {
      isLoading.value = true;
      error.value = null;

      const data = await $fetch<{ session: StripeConnectOnboardingSession }>(
        "/api/stripe/account/create",
        {
          method: "POST",
          body: { user_id: user.value.id },
        }
      );

      // Redirect to Stripe onboarding
      window.location.href = data.session.url;
    } catch (err) {
      error.value = "Erreur lors de la création du compte Stripe";
      console.error("Error creating Stripe account:", err);
    } finally {
      isLoading.value = false;
    }
  };

  // Get dashboard login link for existing accounts
  const getDashboardLink = async () => {
    if (
      !stripeAccount.value?.account_id ||
      !user.value?.id ||
      !hasStripeAccount.value
    ) {
      error.value = "Aucun compte Stripe connecté";
      return;
    }

    try {
      isLoading.value = true;
      const data = await $fetch<{ url: string }>(
        `/api/stripe/account/${user.value.id}/dashboard`
      );
      window.open(data.url, "_blank");
    } catch (err) {
      error.value = "Erreur lors de l'accès au tableau de bord Stripe";
      console.error("Error getting dashboard link:", err);
    } finally {
      isLoading.value = false;
    }
  };

  // Computed properties
  const hasStripeAccount = computed(() => !!stripeAccount.value);
  const isAccountComplete = computed(
    () => stripeAccount.value?.status === "complete"
  );
  const canReceivePayments = computed(
    () =>
      stripeAccount.value?.charges_enabled &&
      stripeAccount.value?.payouts_enabled
  );

  const accountStatusText = computed(() => {
    if (!stripeAccount.value) return "Non connecté";

    switch (stripeAccount.value.status) {
      case "complete":
        return "Actif";
      case "pending":
        return "En attente";
      case "restricted":
        return "Restreint";
      case "rejected":
        return "Rejeté";
      case "not_connected": // ✅ Maintenant cohérent avec la DB
        return "Non connecté";
      default:
        return "Inconnu";
    }
  });

  const accountStatusColor = computed(() => {
    if (!stripeAccount.value) return "neutral";

    switch (stripeAccount.value.status) {
      case "complete":
        return "success";
      case "pending":
        return "warning";
      case "restricted":
      case "rejected":
        return "error";
      case "not_connected": // ✅ Maintenant cohérent avec la DB
        return "neutral";
      default:
        return "neutral";
    }
  });

  // Initialize on mount
  onMounted(() => {
    if (user.value?.id) {
      fetchStripeAccount();
    }
  });

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    stripeAccount: readonly(stripeAccount),

    // Actions
    fetchStripeAccount,
    createStripeAccount,
    getDashboardLink,

    // Computed
    hasStripeAccount,
    isAccountComplete,
    canReceivePayments,
    accountStatusText,
    accountStatusColor,

    // Utils
    resetError: () => {
      error.value = null;
    },
  };
};
