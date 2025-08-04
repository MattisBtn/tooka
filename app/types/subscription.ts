import type { Json } from "./database.types";

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "unpaid";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  features: Json;
  is_active: boolean | null;
  created_at: string | null;
}

export interface UserSubscription {
  subscription_status: string | null;
  subscription_end_date: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

export type BillingInterval = "monthly" | "yearly";

export interface CheckoutSession {
  url: string;
  session_id: string;
}
