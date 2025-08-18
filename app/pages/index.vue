<script setup lang="ts">
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';
import { useKPIDashboard } from "~/composables/useKPIDashboard";
import type { TimeRangeValue } from "~/types/kpi";
import { timeRangeOptions } from "~/types/kpi";

const df = new DateFormatter('fr-FR', { dateStyle: 'medium' })

const {
  kpis,
  loading,
  selectedTimeRange,
  projectCompletionRate,
  conversionRate,
  revenueGrowth,
  projectsGrowth,
  clientsGrowth,
  avgValueGrowth,
  avgDaysToComplete,
  fetchKPIs,
  updateTimeRange,
} = useKPIDashboard();

// Computed pour accéder aux KPI du mois le plus récent
const currentKPIs = computed(() => kpis.value[0] || null);

// Date range picker
const modelValue = shallowRef({
  start: new CalendarDate(2024, 1, 1),
  end: new CalendarDate(2024, 12, 31)
})

// Catégories pour l'area chart
const areaChartCategories: Record<string, BulletLegendItemInterface> = {
  en_cours: { name: 'En cours', color: '#3b82f6' },
  termines: { name: 'Terminés', color: '#10b981' },
}





// Computed pour générer les données du graphique selon la période
const projectChartData = computed<{ date: string; en_cours: number; termines: number }[]>(() => {
  if (!kpis.value.length) return [];

  return kpis.value.slice(0, 6).map(kpi => {
    const date = new Date(kpi.period || '');
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

    return {
      date: monthName,
      en_cours: kpi.active_projects || 0,
      termines: kpi.completed_projects || 0,
    };
  }).reverse(); // Inverser pour avoir l'ordre chronologique
});

// Computed pour le donut chart (mois courant)
const projectDonutData = computed(() => {
  if (!currentKPIs.value) return [];

  const active = currentKPIs.value.active_projects || 0;
  const completed = currentKPIs.value.completed_projects || 0;
  const drafts = (currentKPIs.value.total_projects || 0) - active - completed;

  return [
    {
      color: '#3b82f6',
      name: 'En cours',
      value: active,
    },
    {
      color: '#10b981',
      name: 'Terminés',
      value: completed,
    },
    {
      color: '#6b7280',
      name: 'Brouillons',
      value: drafts,
    },
  ].filter(item => item.value > 0); // Ne pas afficher les segments vides
});

const xFormatter = (i: number): string => `${projectChartData.value[i]?.date || ''}`
const height = 300

// Gestionnaire de changement de période
const handleTimeRangeChange = async (value: TimeRangeValue) => {
  await updateTimeRange(value);
};

// Formatage des valeurs
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
};

// Load KPIs on mount
onMounted(() => {
  fetchKPIs();
});
</script>

<template>
  <div>
    <!-- Page Header -->
    <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de vos performances" :separator="false">
      <template #actions>
        <!-- Time range buttons -->
        <div class="flex items-center gap-2">
          <UButton v-for="option in timeRangeOptions" :key="option.value"
            :color="selectedTimeRange === option.value ? 'primary' : 'neutral'"
            :variant="selectedTimeRange === option.value ? 'solid' : 'subtle'" size="sm"
            @click="handleTimeRangeChange(option.value)">
            {{ option.label }}
          </UButton>
        </div>

        <!-- Date range picker -->
        <UPopover>
          <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" size="sm">
            <template v-if="modelValue.start">
              <template v-if="modelValue.end">
                {{ df.format(modelValue.start.toDate(getLocalTimeZone())) }} - {{
                  df.format(modelValue.end.toDate(getLocalTimeZone())) }}
              </template>
              <template v-else>
                {{ df.format(modelValue.start.toDate(getLocalTimeZone())) }}
              </template>
            </template>
            <template v-else>
              Période personnalisée
            </template>
          </UButton>

          <template #content>
            <UCalendar v-model="modelValue" class="p-2" :number-of-months="2" range />
          </template>
        </UPopover>
      </template>
    </PageHeader>

    <!-- Contenu principal -->
    <div>
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <UCard class="relative" variant="subtle">
          <UTooltip class="absolute top-2 right-2"
            text="Total des revenus générés par vos projets sur la période sélectionnée">
            <UButton icon="i-lucide-help-circle" size="sm" color="neutral" variant="ghost" />
          </UTooltip>
          <div class="flex flex-col">
            <div class="flex items-center justify-between mb-3">
              <UButton icon="i-lucide-euro" size="md" color="primary" variant="solid" class="w-fit" />

            </div>
            <h3 class="text-sm text-gray-500 dark:text-gray-400 mb-2">Revenus totaux</h3>
            <div class="flex items-center gap-2">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(currentKPIs?.total_billed ||
                0)
              }}
              </p>
              <UBadge v-if="!loading && revenueGrowth !== null" :color="revenueGrowth > 0 ? 'success' : 'error'"
                variant="subtle" size="sm" :label="`${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`" />
            </div>
          </div>
        </UCard>

        <UCard class="relative" variant="subtle">
          <UTooltip class="absolute top-2 right-2" text="Nombre total de projets créés sur la période sélectionnée">
            <UButton icon="i-lucide-help-circle" size="sm" color="neutral" variant="ghost" />
          </UTooltip>
          <div class="flex flex-col">
            <div class="flex items-center justify-between mb-3">
              <UButton icon="i-lucide-folder" size="md" color="primary" variant="solid" class="w-fit" />

            </div>
            <h3 class="text-sm text-gray-500 dark:text-gray-400 mb-2">Projets totaux</h3>
            <div class="flex items-center gap-2">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ currentKPIs?.total_projects || 0 }}</p>
              <UBadge v-if="!loading && projectsGrowth !== null" :color="projectsGrowth > 0 ? 'success' : 'error'"
                variant="subtle" size="sm" :label="`${projectsGrowth > 0 ? '+' : ''}${projectsGrowth.toFixed(1)}%`" />
            </div>
          </div>
        </UCard>

        <UCard class="relative" variant="subtle">
          <UTooltip class="absolute top-2 right-2" text="Nombre total de projets créés sur la période sélectionnée">
            <UButton icon="i-lucide-help-circle" size="sm" color="neutral" variant="ghost" />
          </UTooltip>
          <div class="flex flex-col">
            <div class="flex items-center justify-between mb-3">
              <UButton icon="i-lucide-users" size="md" color="primary" variant="solid" class="w-fit" />
            </div>
            <h3 class="text-sm text-gray-500 dark:text-gray-400 mb-2">Clients uniques</h3>
            <div class="flex items-center gap-2">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ currentKPIs?.unique_clients || 0 }}</p>
              <UBadge v-if="!loading && clientsGrowth !== null" :color="clientsGrowth > 0 ? 'success' : 'error'"
                variant="subtle" size="sm" :label="`${clientsGrowth > 0 ? '+' : ''}${clientsGrowth.toFixed(1)}%`" />
            </div>
          </div>
        </UCard>

        <UCard class="relative" variant="subtle">
          <UTooltip class="absolute top-2 right-2"
            text="Valeur moyenne par projet, calculée sur l'ensemble de vos projets">
            <UButton icon="i-lucide-help-circle" size="sm" color="neutral" variant="ghost" />
          </UTooltip>
          <div class="flex flex-col">
            <div class="flex items-center justify-between mb-3">
              <UButton icon="i-lucide-bar-chart-3" size="md" color="primary" variant="solid" class="w-fit" />

            </div>
            <h3 class="text-sm text-gray-500 dark:text-gray-400 mb-2">Valeur moyenne</h3>
            <div class="flex items-center gap-2">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{
                formatCurrency(currentKPIs?.avg_project_value || 0) }}
              </p>
              <UBadge v-if="!loading && avgValueGrowth !== null" :color="avgValueGrowth > 0 ? 'success' : 'error'"
                variant="subtle" size="sm" :label="`${avgValueGrowth > 0 ? '+' : ''}${avgValueGrowth.toFixed(1)}%`" />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Métriques détaillées -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Productivité -->
        <UCard class="relative" variant="subtle">
          <div>
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                  <UIcon name="i-heroicons-rocket-launch" class="w-5 h-5 text-white dark:text-black" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Performance</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Vos indicateurs clés</p>
                </div>
              </div>
              <UTooltip class="absolute top-4 right-4" text="Métriques de performance pour évaluer votre efficacité">
                <UButton icon="i-lucide-help-circle" size="sm" color="neutral" variant="ghost" />
              </UTooltip>
            </div>

            <div class="space-y-6">
              <!-- Taux de finalisation -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Taux de finalisation</span>
                    <UTooltip text="Pourcentage de projets terminés par rapport au total des projets">
                      <UButton icon="i-lucide-help-circle" size="xs" color="neutral" variant="ghost" />
                    </UTooltip>
                  </div>
                  <span class="text-lg font-bold text-gray-900 dark:text-white">{{ projectCompletionRate.toFixed(1)
                    }}%</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div class="bg-black dark:bg-white h-2 rounded-full transition-all duration-500"
                    :style="{ width: `${projectCompletionRate}%` }" />
                </div>
              </div>

              <!-- Temps moyen -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Temps moyen</span>
                    <UTooltip text="Durée moyenne en jours pour terminer un projet complet">
                      <UButton icon="i-lucide-help-circle" size="xs" color="neutral" variant="ghost" />
                    </UTooltip>
                  </div>
                  <span class="text-lg font-bold text-gray-900 dark:text-white">{{
                    avgDaysToComplete ? avgDaysToComplete.toFixed(1) : 'N/A' }}
                    jours</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div class="bg-black dark:bg-white h-2 rounded-full transition-all duration-500"
                    :style="{ width: `${Math.min(((avgDaysToComplete || 15) / 30) * 100, 100)}%` }" />
                </div>
              </div>

              <!-- Taux de conversion -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Taux de conversion</span>
                    <UTooltip text="Pourcentage de devis transformés en projets signés">
                      <UButton icon="i-lucide-help-circle" size="xs" color="neutral" variant="ghost" />
                    </UTooltip>
                  </div>
                  <span class="text-lg font-bold text-gray-900 dark:text-white">{{ conversionRate.toFixed(1) }}%</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div class="bg-black dark:bg-white h-2 rounded-full transition-all duration-500"
                    :style="{ width: `${conversionRate}%` }" />
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Graphique de répartition -->
        <UCard class="lg:col-span-2 relative" variant="subtle">
          <UTooltip class="absolute top-2 right-2" text="Répartition des projets par statut et type">
            <UButton icon="i-lucide-help-circle" size="sm" color="neutral" variant="ghost" />
          </UTooltip>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-chart-pie" class="w-4 h-4 text-white dark:text-black" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Répartition des projets</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Par statut et type</p>
              </div>
            </div>
          </template>

          <!-- Graphique conditionnel selon la période -->
          <AreaChart v-if="selectedTimeRange !== 'current_month'" :data="projectChartData" :height="height"
            y-label="Projets" x-label="Mois" :categories="areaChartCategories" :y-num-ticks="4" :x-num-ticks="6"
            :y-grid-line="true" :legend-position="LegendPosition.Top" :hide-legend="false" :x-formatter="xFormatter" />

          <DonutChart v-else :data="projectDonutData.map((i) => i.value)" :height="height" :labels="projectDonutData"
            :hide-legend="false" :radius="0">
            <div class="absolute text-center">
              <div class="font-semibold">{{ currentKPIs?.total_projects || 0 }}</div>
              <div class="text-muted">Projets</div>
            </div>
          </DonutChart>
        </UCard>
      </div>
    </div>
  </div>
</template>
