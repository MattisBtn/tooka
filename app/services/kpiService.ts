import type { UserKPI } from "~/types/kpi";

export const kpiService = {
  async getUserKPIs(timeRange: string = "current_month"): Promise<UserKPI[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value?.id) return [];

    const now = new Date();
    let startDate: Date;
    const endDate: Date = now;

    // Calculer la période selon le timeRange
    switch (timeRange) {
      case "current_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last_3_months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "last_6_months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case "current_year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const { data, error } = await supabase
      .from("user_kpi_view")
      .select("*")
      .eq("user_id", user.value.id)
      .gte("period", startDate.toISOString())
      .lte("period", endDate.toISOString())
      .order("period", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getKPIsForCustomRange(
    startDate: Date,
    endDate: Date
  ): Promise<UserKPI[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value?.id) return [];

    const { data, error } = await supabase
      .from("user_kpi_view")
      .select("*")
      .eq("user_id", user.value.id)
      .gte("period", startDate.toISOString())
      .lte("period", endDate.toISOString())
      .order("period", { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
