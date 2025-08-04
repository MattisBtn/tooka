import { subscriptionRepository } from "~/repositories/subscriptionRepository";
import type {
  BillingInterval,
  SubscriptionPlan,
  UserSubscription,
} from "~/types/subscription";

export const subscriptionService = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    return await subscriptionRepository.getPlans();
  },

  async getCurrentSubscription(
    userId: string
  ): Promise<UserSubscription | null> {
    return await subscriptionRepository.getUserSubscription(userId);
  },

  async updateSubscription(
    userId: string,
    updates: Partial<UserSubscription>
  ): Promise<void> {
    await subscriptionRepository.updateUserSubscription(userId, updates);
  },

  async createCheckoutSession(
    userId: string,
    priceId: string,
    interval: BillingInterval
  ): Promise<{ url: string }> {
    const response = await $fetch("/api/stripe/checkout/create", {
      method: "POST",
      body: { user_id: userId, price_id: priceId, interval },
    });
    return response as { url: string };
  },
};
