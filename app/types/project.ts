import { z } from "zod";
import type { Json, Tables } from "~/types/database.types";

export type Project = Tables<"projects">;

export interface IProjectFilters {
  search?: string;
  status?: "draft" | "in_progress" | "completed" | null;
  client_id?: string;
  sort?:
    | "title_asc"
    | "title_desc"
    | "created_asc"
    | "created_desc"
    | "status_asc"
    | "status_desc";
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
  require_password: z.boolean().default(false),
  // password_hash est généré seulement si require_password est true
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;

// Edit schema for inline editing
export const projectEditSchema = z.object({
  title: z.string().min(1, "Titre requis").max(255, "Titre trop long"),
  description: z.string().nullable().optional(),
  client_id: z.string().min(1, "Client requis"),
  require_password: z.boolean().default(false),
});

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
    selection_id: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

// Workflow step types
export type WorkflowStep = 1 | 2 | 3 | 4;

export type StepStatus = "accessible" | "locked";

export interface StepInfo {
  status: StepStatus;
  canView: boolean;
  canEdit: boolean;
  moduleExists: boolean;
  moduleStatus?: string;
}

// Workflow status types for table display
export type WorkflowStageStatus = "not_started" | "in_progress" | "completed";

export interface WorkflowStage {
  name: "Proposition" | "Moodboard" | "Sélection" | "Galerie";
  key: "proposal" | "moodboard" | "selection" | "gallery";
  status: WorkflowStageStatus;
  icon: string;
  color: string;
}

export interface ProjectWorkflowStatus {
  currentStage: WorkflowStage | null;
  stages: WorkflowStage[];
  overallProgress: number; // Percentage 0-100
}
