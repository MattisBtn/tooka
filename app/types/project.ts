import { z } from "zod";
import type { Json, Tables } from "~/types/database.types";
import {
  PROJECT_STATUS,
  type ModuleStatus,
  type ProjectStatus,
} from "~/types/status";

export type Project = Tables<"projects">;

export interface IProjectFilters {
  search?: string;
  status?: ProjectStatus | null;
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
  value: ProjectStatus;
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
  status: z
    .enum([
      PROJECT_STATUS.DRAFT,
      PROJECT_STATUS.IN_PROGRESS,
      PROJECT_STATUS.COMPLETED,
    ])
    .default(PROJECT_STATUS.DRAFT),
  initial_price: z
    .number()
    .min(0, "Le prix doit être positif")
    .optional()
    .nullable(),
  require_password: z.boolean().default(false),
  // password_hash est généré seulement si require_password est true
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;

// Edit schema for inline editing
export const projectEditSchema = z.object({
  title: z.string().min(1, "Titre requis").max(255, "Titre trop long"),
  description: z.string().nullable().optional(),
  client_id: z.string().min(1, "Client requis"),
  initial_price: z
    .number()
    .min(0, "Le prix doit être positif")
    .optional()
    .nullable(),
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
    status: ModuleStatus;
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
    status: ModuleStatus;
    created_at: string;
    updated_at: string;
  } | null;
  selection?: {
    id: string;
    max_media_selection: number;
    extra_media_price: number | null;
    status: ModuleStatus;
    created_at: string;
    updated_at: string;
  } | null;
  gallery?: {
    id: string;
    status: ModuleStatus;
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
