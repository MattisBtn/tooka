import { defineStore } from "pinia";
import { subscriptionService } from "~/services/subscriptionService";
import type {
  BillingInterval,
  SubscriptionPlan,
  UserSubscription,
} from "~/types/subscription";

export const useSubscriptionStore = defineStore("subscription", () => {
  // State
  const plans = ref<SubscriptionPlan[]>([]);
  const currentSubscription = ref<UserSubscription | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const selectedInterval = ref<BillingInterval>("monthly");

  // Getters
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);
  const hasActiveSubscription = computed(
    () => currentSubscription.value?.subscription_status === "active"
  );
  const hasValidSubscription = computed(() => {
    if (!currentSubscription.value) return false;

    const status = currentSubscription.value.subscription_status;
    const endDate = currentSubscription.value.subscription_end_date;

    // Active ou trialing = toujours valide
    if (status === "active" || status === "trialing") return true;

    // Canceled mais avec date de fin future = valide
    if (status === "canceled" && endDate) {
      const now = new Date();
      const end = new Date(endDate);
      return end > now;
    }

    return false;
  });
  const isTrialing = computed(
    () => currentSubscription.value?.subscription_status === "trialing"
  );
  const isPastDue = computed(
    () => currentSubscription.value?.subscription_status === "past_due"
  );

  // Actions
  const reset = () => {
    plans.value = [];
    currentSubscription.value = null;
    error.value = null;
  };

  const fetchPlans = async () => {
    try {
      loading.value = true;
      error.value = null;
      plans.value = await subscriptionService.getPlans();
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch plans");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchCurrentSubscription = async (userId: string) => {
    try {
      loading.value = true;
      error.value = null;
      currentSubscription.value =
        await subscriptionService.getCurrentSubscription(userId);
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch subscription");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createSubscription = async (
    userId: string,
    priceId: string,
    interval: BillingInterval,
    planId: string
  ) => {
    try {
      loading.value = true;
      error.value = null;
      const { url } = await subscriptionService.createCheckoutSession(
        userId,
        priceId,
        interval,
        planId
      );
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to create subscription");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createPortalSession = async (userId: string) => {
    try {
      loading.value = true;
      error.value = null;
      const { url } = await subscriptionService.createPortalSession(userId);
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      error.value =
        err instanceof Error
          ? err
          : new Error("Failed to create portal session");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      loading.value = true;
      error.value = null;
      await subscriptionService.cancelSubscription(subscriptionId);
      // Refresh current subscription
      if (currentSubscription.value?.stripe_subscription_id) {
        await fetchCurrentSubscription(
          currentSubscription.value.stripe_subscription_id
        );
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to cancel subscription");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const setInterval = (interval: BillingInterval) => {
    selectedInterval.value = interval;
  };

  const getPlanById = async (
    planId: string
  ): Promise<SubscriptionPlan | null> => {
    return await subscriptionService.getPlanById(planId);
  };

  return {
    // State
    plans: plans,
    currentSubscription: currentSubscription,
    loading: loading,
    error: error,
    selectedInterval: selectedInterval,

    // Getters
    isLoading,
    hasError,
    hasActiveSubscription,
    hasValidSubscription,
    isTrialing,
    isPastDue,

    // Actions
    reset,
    fetchPlans,
    fetchCurrentSubscription,
    createSubscription,
    createPortalSession,
    cancelSubscription,
    setInterval,
    getPlanById,
  };
});
