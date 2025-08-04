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
    interval: BillingInterval
  ) => {
    try {
      loading.value = true;
      error.value = null;
      const { url } = await subscriptionService.createCheckoutSession(
        userId,
        priceId,
        interval
      );
      window.location.href = url;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to create subscription");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const setInterval = (interval: BillingInterval) => {
    selectedInterval.value = interval;
  };

  return {
    // State
    plans: readonly(plans),
    currentSubscription: readonly(currentSubscription),
    loading: readonly(loading),
    error: readonly(error),
    selectedInterval: readonly(selectedInterval),

    // Getters
    isLoading,
    hasError,
    hasActiveSubscription,
    isTrialing,
    isPastDue,

    // Actions
    reset,
    fetchPlans,
    fetchCurrentSubscription,
    createSubscription,
    setInterval,
  };
});
