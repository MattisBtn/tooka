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

  // Méthodes pour l'API routes (sécurité)
  async createCheckoutSession(
    userId: string,
    priceId: string,
    interval: BillingInterval
  ): Promise<{ url: string | null }> {
    const response = await $fetch("/api/stripe/checkout/create", {
      method: "POST",
      body: { user_id: userId, price_id: priceId, interval },
    });
    return response;
  },

  async createPortalSession(userId: string): Promise<{ url: string | null }> {
    const response = await $fetch("/api/stripe/subscription/portal", {
      method: "POST",
      body: { user_id: userId },
    });
    return response;
  },

  async cancelSubscription(
    subscriptionId: string
  ): Promise<{ success: boolean }> {
    const response = await $fetch("/api/stripe/subscription/cancel", {
      method: "POST",
      body: { subscription_id: subscriptionId },
    });
    return response;
  },
};
