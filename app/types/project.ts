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
  ): Promise<Project>;
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
  description: z.string().optional(),
  client_id: z.string().min(1, "Client requis"),
  status: z.enum(["draft", "in_progress", "completed"]).default("draft"),
  initial_price: z
    .number()
    .min(0, "Le prix doit être positif")
    .optional()
    .nullable(),
  link_expires_at: z.string().optional().nullable(),
  password_hash: z.string().min(1, "Mot de passe requis"),
  secure_link: z.string().min(1, "Lien sécurisé requis"),
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
}
