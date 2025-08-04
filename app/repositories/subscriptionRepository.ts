import type { SubscriptionPlan, UserSubscription } from "~/types/subscription";

export const subscriptionRepository = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price_monthly", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("user_profiles")
      .select(
        "subscription_status, subscription_end_date, stripe_subscription_id, stripe_customer_id"
      )
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserSubscription(
    userId: string,
    updates: Partial<UserSubscription>
  ): Promise<void> {
    const supabase = useSupabaseClient();

    const { error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", userId);

    if (error) throw error;
  },
};
