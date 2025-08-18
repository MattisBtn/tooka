import { kpiService } from "~/services/kpiService";
import type { TimeRangeValue, UserKPI } from "~/types/kpi";

export const useKPIDashboard = () => {
  const kpis = ref<UserKPI[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const selectedTimeRange = ref<TimeRangeValue>("current_month");

  const fetchKPIs = async () => {
    try {
      loading.value = true;
      error.value = null;
      kpis.value = await kpiService.getUserKPIs(selectedTimeRange.value);
    } catch (err) {
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  };

  const updateTimeRange = async (newRange: TimeRangeValue) => {
    selectedTimeRange.value = newRange;
    await fetchKPIs();
  };

  // Computed pour les métriques calculées (utilise le mois le plus récent)
  const currentKPIs = computed(() => kpis.value[0] || null);
  const previousKPIs = computed(() => kpis.value[1] || null);

  // Calcul des différences pour les badges
  const revenueGrowth = computed(() => {
    if (!currentKPIs.value?.total_billed || !previousKPIs.value?.total_billed)
      return null;
    const current = currentKPIs.value.total_billed;
    const previous = previousKPIs.value.total_billed;
    return previous > 0 ? ((current - previous) / previous) * 100 : null;
  });

  const projectsGrowth = computed(() => {
    if (
      !currentKPIs.value?.total_projects ||
      !previousKPIs.value?.total_projects
    )
      return null;
    const current = currentKPIs.value.total_projects;
    const previous = previousKPIs.value.total_projects;
    return previous > 0 ? ((current - previous) / previous) * 100 : null;
  });

  const clientsGrowth = computed(() => {
    if (
      !currentKPIs.value?.unique_clients ||
      !previousKPIs.value?.unique_clients
    )
      return null;
    const current = currentKPIs.value.unique_clients;
    const previous = previousKPIs.value.unique_clients;
    return previous > 0 ? ((current - previous) / previous) * 100 : null;
  });

  const avgValueGrowth = computed(() => {
    if (
      !currentKPIs.value?.avg_project_value ||
      !previousKPIs.value?.avg_project_value
    )
      return null;
    const current = currentKPIs.value.avg_project_value;
    const previous = previousKPIs.value.avg_project_value;
    return previous > 0 ? ((current - previous) / previous) * 100 : null;
  });

  // Calcul de la moyenne des jours en ignorant les valeurs null
  const avgDaysToComplete = computed(() => {
    const validValues = kpis.value
      .map((kpi) => kpi.avg_days_to_complete)
      .filter(
        (value): value is number =>
          value !== null && value !== undefined && value > 0
      );

    if (validValues.length === 0) return null;
    return (
      validValues.reduce((sum, value) => sum + value, 0) / validValues.length
    );
  });

  const projectCompletionRate = computed(() => {
    if (!currentKPIs.value?.total_projects) return 0;
    return (
      ((currentKPIs.value.completed_projects || 0) /
        currentKPIs.value.total_projects) *
      100
    );
  });

  const conversionRate = computed(() => {
    if (!currentKPIs.value?.total_projects) return 0;
    return (
      ((currentKPIs.value.completed_proposals || 0) /
        currentKPIs.value.total_projects) *
      100
    );
  });

  return {
    kpis: readonly(kpis),
    loading: readonly(loading),
    error: readonly(error),
    selectedTimeRange: readonly(selectedTimeRange),
    projectCompletionRate,
    conversionRate,
    revenueGrowth,
    projectsGrowth,
    clientsGrowth,
    avgValueGrowth,
    avgDaysToComplete,
    fetchKPIs,
    updateTimeRange,
  };
};
