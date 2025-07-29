import { z } from "zod";
import type { Json, Tables } from "~/types/database.types";

export type Project = Tables<"projects">;

export interface IProjectFilters {
  search?: string;
  status?: "draft" | "in_progress" | "completed" | null;
  client_id?: string;
}

export interface IPagination {
  page: number;
  pageSize: number;
}

// Project status options for UI
export interface ProjectStatusItem {
  value: "draft" | "in_progress" | "completed";
  label: string;
  description: string;
  icon: string;
  color: string;
}

// Validation schema for project form
export const projectFormSchema = z.object({
  title: z.string().min(1, "Titre requis").max(255, "Titre trop long"),
  description: z.string().nullable().optional(),
  client_id: z.string().min(1, "Client requis"),
  status: z.enum(["draft", "in_progress", "completed"]).default("draft"),
  initial_price: z
    .number()
    .min(0, "Le prix doit être positif")
    .optional()
    .nullable(),
  require_password: z.boolean().default(false),
  // password_hash est généré seulement si require_password est true
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;

// Project with client information for display
export interface ProjectWithClient extends Project {
  client?: {
    id: string;
    type: "individual" | "company";
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
    billing_email: string;
  };
  proposal?: {
    id: string;
    content_json: Json;
    content_html: string;
    status:
      | "draft"
      | "awaiting_client"
      | "revision_requested"
      | "completed"
      | "payment_pending";
    price: number;
    deposit_required: boolean;
    deposit_amount: number | null;
    contract_url: string | null;
    quote_url: string | null;
  } | null;
  moodboard?: {
    id: string;
    title: string;
    description: string | null;
    status: "draft" | "awaiting_client" | "revision_requested" | "completed";
    created_at: string;
    updated_at: string;
  } | null;
  selection?: {
    id: string;
    max_media_selection: number;
    extra_media_price: number | null;
    status: "draft" | "awaiting_client" | "revision_requested" | "completed";
    created_at: string;
    updated_at: string;
  } | null;
  gallery?: {
    id: string;
    status: "draft" | "awaiting_client" | "revision_requested" | "completed";
    payment_required: boolean;
    selection_id: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

// Workflow step types
export type WorkflowStep = 1 | 2 | 3 | 4;

export interface WorkflowStepInfo {
  step: WorkflowStep;
  module: "proposal" | "moodboard" | "selection" | "gallery";
  title: string;
  description: string;
  canEdit: boolean;
  canDelete: boolean;
  isCompleted: boolean;
}

// Workflow validation
export interface WorkflowValidation {
  canProceedToNextStep: boolean;
  currentStepCompleted: boolean;
  previousStepsCompleted: boolean;
  errorMessage?: string;
}
