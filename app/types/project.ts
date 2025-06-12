import { z } from "zod";
import type { Tables } from "~/types/database.types";

export type Project = Tables<"projects">;

export interface IProjectFilters {
  search?: string;
  status?: "draft" | "in_progress" | "completed" | null;
  client_id?: string;
}

export interface IProjectRepository {
  findMany(
    filters: IProjectFilters,
    pagination: IPagination
  ): Promise<ProjectWithClient[]>;
  findById(id: string): Promise<ProjectWithClient | null>;
  create(
    data: Omit<Project, "id" | "created_at" | "updated_at">
  ): Promise<ProjectWithClient>;
  update(id: string, data: Partial<Project>): Promise<Project>;
  delete(id: string): Promise<void>;
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
  password_expires_at: z.string().optional().nullable(),
  // password_hash et secure_link sont générés automatiquement par le service
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
    title: string;
    status: "draft" | "awaiting_client" | "revision_requested" | "completed";
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
  gallery?: {
    id: string;
    status: "draft" | "awaiting_client" | "revision_requested" | "completed";
    payment_required: boolean;
    selection_id: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}
