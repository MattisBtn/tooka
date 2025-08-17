import type { Tables } from "~/types/database.types";

// Base notification type from database
export type Notification = Tables<"notifications">;

// Notification types based on the triggers
export type NotificationType =
  | "moodboard_revision_requested"
  | "gallery_revision_requested"
  | "selection_revision_requested"
  | "proposal_revision_requested"
  | "proposal_payment_pending"
  | "gallery_payment_pending"
  | "proposal_completed_with_deposit"
  | "gallery_completed_stripe";

// Notification data structure based on the JSONB data field
export interface NotificationData {
  project_id: string;
  project_title: string;
  item_id: string;
  item_type: "moodboards" | "galleries" | "selections" | "proposals";
  status: string;
  proposal_id?: string;
  deposit_amount?: number;
  gallery_id?: string;
}
