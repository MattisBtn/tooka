# 📊 Dashboard KPI Photographe - Guide d'implémentation

## 🎯 Vue d'ensemble

Ce document détaille l'implémentation d'un dashboard KPI pour les photographes utilisant la plateforme Flow, basé sur une approche **KISS** (Keep It Simple, Stupid) avec nuxt-charts.

## 📋 Phase 1: Base de Données

### Vue SQL pour les KPI

```sql
-- Vue KPI par utilisateur et période
CREATE VIEW user_kpi_view AS
SELECT
  up.id as user_id,

  -- Période (mois/année)
  DATE_TRUNC('month', p.created_at) as period,

  -- Financier
  COUNT(p.id) as total_projects,
  SUM(COALESCE(pp.amount, 0)) as total_billed, -- Paiements réels reçus
  AVG(COALESCE(pr.price, 0)) as avg_project_value, -- Valeur moyenne des devis
  COUNT(CASE WHEN pr.status = 'completed' THEN 1 END) as completed_proposals,

  -- Productivité
  AVG(EXTRACT(DAY FROM (p.completed_at - p.created_at))) as avg_days_to_complete,
  COUNT(CASE WHEN p.status = 'in_progress' THEN 1 END) as active_projects,
  COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_projects,

  -- Modules complétés
  COUNT(CASE WHEN mb.status = 'completed' THEN 1 END) as completed_moodboards,
  COUNT(CASE WHEN sel.status = 'completed' THEN 1 END) as completed_selections,
  COUNT(CASE WHEN gal.status = 'completed' THEN 1 END) as completed_galleries,

  -- Clients
  COUNT(DISTINCT p.client_id) as unique_clients

FROM user_profiles up
LEFT JOIN projects p ON up.id = p.user_id
LEFT JOIN proposals pr ON p.id = pr.project_id
LEFT JOIN project_payments pp ON p.id = pp.project_id -- Paiements réels
LEFT JOIN moodboards mb ON p.id = mb.project_id
LEFT JOIN selections sel ON p.id = sel.project_id
LEFT JOIN galleries gal ON p.id = gal.project_id
GROUP BY up.id, DATE_TRUNC('month', p.created_at);
```

## 📝 Phase 2: Types TypeScript

### Fichier: `app/types/kpi.ts`

```typescript
import type { Tables } from "~/types/database.types";

// Type basé sur la vue user_kpi_view existante
export type UserKPI = Tables<"user_kpi_view">;

// Types pour les périodes
export type KPITimeRange = {
  start: Date;
  end: Date;
  label: string;
};

// Options de période pour l'interface utilisateur
export const timeRangeOptions = [
  { label: "Ce mois", value: "current_month" },
  { label: "3 derniers mois", value: "last_3_months" },
  { label: "6 derniers mois", value: "last_6_months" },
  { label: "Cette année", value: "current_year" },
] as const;

export type TimeRangeValue = (typeof timeRangeOptions)[number]["value"];

// Interface pour les métriques calculées (optionnel, pour des calculs côté client)
export interface KPIMetrics {
  // Financier
  totalRevenue: number;
  monthlyRevenue: number;
  averageProjectValue: number;
  conversionRate: number;

  // Productivité
  projectCompletionRate: number;
  averageCompletionTime: number;

  // Clients
  clientRetentionRate: number;
  averageSatisfaction: number;
}
```

## 🔧 Phase 3: Service

### Fichier: `app/services/kpiService.ts`

```typescript
import { useSupabaseClient } from "#supabase/client";
import type { UserKPI } from "~/types/kpi";

export const kpiService = {
  async getUserKPIs(period: string = "current_month"): Promise<UserKPI | null> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("user_kpi_view")
      .select("*")
      .eq("period", period)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to fetch KPIs: ${error.message}`);
    }

    return data;
  },

  async getKPIsForTimeRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UserKPI[]> {
    const supabase = useSupabaseClient();

    const { data, error } = await supabase
      .from("user_kpi_view")
      .select("*")
      .eq("user_id", userId)
      .gte("period", startDate.toISOString())
      .lte("period", endDate.toISOString())
      .order("period", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch KPIs: ${error.message}`);
    }

    return data || [];
  },
};
```

## 🎨 Phase 4: Composables

### Fichier: `app/composables/useKPIDashboard.ts`

```typescript
import { kpiService } from "~/services/kpiService";
import type { UserKPI, KPITimeRange, TimeRangeValue } from "~/types/kpi";

export const useKPIDashboard = () => {
  const kpis = ref<UserKPI | null>(null);
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

  // Computed pour les métriques calculées
  const projectCompletionRate = computed(() => {
    if (!kpis.value) return 0;
    return kpis.value.total_projects > 0
      ? (kpis.value.completed_projects / kpis.value.total_projects) * 100
      : 0;
  });

  const conversionRate = computed(() => {
    if (!kpis.value) return 0;
    return kpis.value.total_projects > 0
      ? (kpis.value.completed_proposals / kpis.value.total_projects) * 100
      : 0;
  });

  return {
    kpis: readonly(kpis),
    loading: readonly(loading),
    error: readonly(error),
    selectedTimeRange: readonly(selectedTimeRange),
    projectCompletionRate,
    conversionRate,
    fetchKPIs,
    updateTimeRange,
  };
};
```

## 🎨 Phase 5: Composants UI

### Fichier: `app/components/dashboard/KPINumberCard.vue`

```vue
<template>
  <UCard class="text-center">
    <div class="space-y-2">
      <h3 class="text-sm font-medium text-gray-500">{{ title }}</h3>
      <p class="text-3xl font-bold" :class="colorClass">
        {{ formattedValue }}
      </p>
      <p v-if="subtitle" class="text-xs text-gray-400">{{ subtitle }}</p>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  value: number;
  format?: "number" | "currency" | "percentage";
  color?: "green" | "blue" | "orange" | "purple";
  subtitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  format: "number",
  color: "blue",
});

const formattedValue = computed(() => {
  switch (props.format) {
    case "currency":
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(props.value);
    case "percentage":
      return `${props.value.toFixed(1)}%`;
    default:
      return props.value.toLocaleString("fr-FR");
  }
});

const colorClass = computed(() => {
  const colors = {
    green: "text-green-600",
    blue: "text-blue-600",
    orange: "text-orange-600",
    purple: "text-purple-600",
  };
  return colors[props.color];
});
</script>
```

### Fichier: `app/components/dashboard/KPIDashboard.vue`

```vue
<template>
  <div class="space-y-6">
    <!-- Header avec sélecteur de période -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Tableau de bord</h1>
      <USelectMenu
        v-model="selectedTimeRange"
        :options="timeRangeOptions"
        @update:model-value="handleTimeRangeChange"
      />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" />
    </div>

    <!-- Error state -->
    <UAlert v-else-if="error" :title="error.message" color="red" />

    <!-- Dashboard content -->
    <div v-else-if="kpis" class="space-y-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPINumberCard
          title="Revenus totaux"
          :value="kpis.total_billed || 0"
          format="currency"
          color="green"
        />
        <KPINumberCard
          title="Projets totaux"
          :value="kpis.total_projects || 0"
          color="blue"
        />
        <KPINumberCard
          title="Clients uniques"
          :value="kpis.unique_clients || 0"
          color="purple"
        />
        <KPINumberCard
          title="Valeur moyenne"
          :value="kpis.avg_project_value || 0"
          format="currency"
          color="orange"
        />
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UCard>
          <h3 class="text-lg font-semibold mb-4">Répartition des projets</h3>
          <VChart :option="projectDistributionOption" />
        </UCard>

        <UCard>
          <h3 class="text-lg font-semibold mb-4">Modules complétés</h3>
          <VChart :option="modulesCompletedOption" />
        </UCard>
      </div>

      <!-- Additional metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UCard>
          <h3 class="text-lg font-semibold mb-4">Productivité</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span>Taux de finalisation</span>
              <span class="font-semibold"
                >{{ projectCompletionRate.toFixed(1) }}%</span
              >
            </div>
            <div class="flex justify-between">
              <span>Temps moyen</span>
              <span class="font-semibold"
                >{{ kpis.avg_days_to_complete?.toFixed(1) || 0 }} jours</span
              >
            </div>
            <div class="flex justify-between">
              <span>Taux de conversion</span>
              <span class="font-semibold"
                >{{ conversionRate.toFixed(1) }}%</span
              >
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useKPIDashboard } from "~/composables/useKPIDashboard";
import { timeRangeOptions } from "~/types/kpi";
import type { TimeRangeValue } from "~/types/kpi";

const {
  kpis,
  loading,
  error,
  selectedTimeRange,
  projectCompletionRate,
  conversionRate,
  fetchKPIs,
  updateTimeRange,
} = useKPIDashboard();

// Chart options
const projectDistributionOption = computed(() => ({
  tooltip: {
    trigger: "item",
    formatter: "{b}: {c} ({d}%)",
  },
  series: [
    {
      type: "pie",
      radius: ["40%", "70%"],
      data: [
        {
          value: kpis.value?.active_projects || 0,
          name: "En cours",
          itemStyle: { color: "#3B82F6" },
        },
        {
          value: kpis.value?.completed_projects || 0,
          name: "Terminés",
          itemStyle: { color: "#10B981" },
        },
        {
          value:
            (kpis.value?.total_projects || 0) -
            (kpis.value?.active_projects || 0) -
            (kpis.value?.completed_projects || 0),
          name: "Brouillons",
          itemStyle: { color: "#6B7280" },
        },
      ],
    },
  ],
}));

const modulesCompletedOption = computed(() => ({
  tooltip: {
    trigger: "axis",
  },
  xAxis: {
    type: "category",
    data: ["Propositions", "Moodboards", "Sélections", "Galeries"],
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      type: "bar",
      data: [
        kpis.value?.completed_proposals || 0,
        kpis.value?.completed_moodboards || 0,
        kpis.value?.completed_selections || 0,
        kpis.value?.completed_galleries || 0,
      ],
      itemStyle: {
        color: "#8B5CF6",
      },
    },
  ],
}));

// Methods
const handleTimeRangeChange = async (value: TimeRangeValue) => {
  await updateTimeRange(value);
};

// Load dashboard on mount
onMounted(async () => {
  await fetchKPIs();
});
</script>
```

## ⚙️ Phase 6: Configuration nuxt-charts

### Mise à jour: `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  // ... autres configurations

  echarts: {
    charts: ["BarChart", "LineChart", "PieChart", "DoughnutChart"],
    components: ["TooltipComponent", "GridComponent", "LegendComponent"],
    features: ["UniversalTransition"],
  },
});
```

## 🚀 Phase 7: Page Dashboard

### Fichier: `app/pages/dashboard.vue`

```vue
<template>
  <div class="container mx-auto px-4 py-6">
    <KPIDashboard />
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "Tableau de bord - Flow",
});

definePageMeta({
  layout: "default",
  middleware: "auth",
});
</script>
```

## 📊 Recommandations de Visualisation

### **KPI Financiers**

- **Revenus totaux** → Number Card (vert)
- **Évolution des revenus** → Line Chart
- **Valeur moyenne par projet** → Number Card (orange)

### **KPI Productivité**

- **Répartition des projets** → Donut Chart
- **Temps de réalisation** → Bar Chart
- **Modules complétés** → Bar Chart

### **KPI Clients**

- **Nombre de clients** → Number Card (bleu)
- **Répartition par type** → Pie Chart

## 🎨 Palette de Couleurs

```css
/* Couleurs recommandées */
--color-revenue: #10b981; /* Vert */
--color-projects: #3b82f6; /* Bleu */
--color-clients: #8b5cf6; /* Violet */
--color-average: #f59e0b; /* Orange */
--color-draft: #6b7280; /* Gris */
```

## 📱 Responsive Design

- **Mobile** : 1 colonne pour les cards, charts empilés
- **Tablet** : 2 colonnes pour les cards, charts côte à côte
- **Desktop** : 4 colonnes pour les cards, layout complet

## 🔒 Sécurité

- Filtrage par `user_id` côté application
- Pas de RLS sur la vue (non supporté par Supabase)
- Validation des données côté client et serveur

## 🚀 Déploiement

1. Exécuter le script SQL pour créer la vue
2. Vérifier la configuration nuxt-charts
3. Tester les composants
4. Déployer en production

## 📈 Évolutions Futures

- Ajout de graphiques temporels (évolution sur 12 mois)
- Comparaison avec les périodes précédentes
- Export des données en PDF/Excel
- Notifications pour les objectifs atteints

---

**Note** : Cette implémentation respecte les principes YAGNI et KISS, en se concentrant sur les KPI essentiels pour les photographes professionnels.
