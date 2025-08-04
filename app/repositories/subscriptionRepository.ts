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
        "subscription_status, subscription_end_date, stripe_subscription_id, stripe_customer_id, plan_id"
      )
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user subscription:", error);
      // Si l'utilisateur n'existe pas ou n'a pas de subscription, retourner null
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

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

  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (error) {
      console.error("Error fetching plan:", error);
      return null;
    }

    return data;
  },
};
