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
