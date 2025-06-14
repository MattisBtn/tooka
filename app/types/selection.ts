import { z } from "zod";
import type { Tables } from "~/types/database.types";

export type Selection = Tables<"selections">;
export type SelectionImage = Tables<"selection_images">;
export type SelectionComment = Tables<"selection_comments">;

export interface ISelectionFilters {
  search?: string;
  status?:
    | "draft"
    | "awaiting_client"
    | "revision_requested"
    | "completed"
    | null;
  project_id?: string;
}

export interface ISelectionRepository {
  findMany(
    filters: ISelectionFilters,
    pagination: IPagination
  ): Promise<Selection[]>;
  findById(id: string): Promise<Selection | null>;
  findByProjectId(projectId: string): Promise<Selection | null>;
  create(
    data: Omit<Selection, "id" | "created_at" | "updated_at">
  ): Promise<Selection>;
  update(id: string, data: Partial<Selection>): Promise<Selection>;
  delete(id: string): Promise<void>;
}

export interface ISelectionImageRepository {
  findBySelectionId(selectionId: string): Promise<SelectionImage[]>;
  create(
    data: Omit<SelectionImage, "id" | "created_at">
  ): Promise<SelectionImage>;
  update(id: string, data: Partial<SelectionImage>): Promise<SelectionImage>;
  delete(id: string): Promise<void>;
  deleteMany(selectionId: string): Promise<void>;
  getPublicUrl(filePath: string): string;
}

export interface IPagination {
  page: number;
  pageSize: number;
}

// Selection status options for UI
export interface SelectionStatusItem {
  value: "draft" | "awaiting_client" | "revision_requested" | "completed";
  label: string;
  description: string;
  icon: string;
  color: string;
}

// Validation schema for selection form
export const selectionFormSchema = z.object({
  max_media_selection: z
    .number()
    .min(1, "Au moins 1 média doit être sélectionnable")
    .max(1000, "Nombre maximum trop élevé"),
  extra_media_price: z
    .number()
    .min(0, "Le prix doit être positif")
    .optional()
    .nullable(),
  status: z
    .enum(["draft", "awaiting_client", "revision_requested", "completed"])
    .default("draft"),
});

export type SelectionFormData = z.infer<typeof selectionFormSchema>;

// Selection with project and images information for display
export interface SelectionWithDetails extends Selection {
  project?: {
    readonly id: string;
    readonly title: string;
    readonly status: "draft" | "in_progress" | "completed";
  };
  images?: readonly SelectionImage[];
  imageCount?: number;
  selectedCount?: number;
  hasMore?: boolean;
  currentPage?: number;
}

// Selection with project info for client access
export interface SelectionWithProjectDetails extends Selection {
  project: {
    id: string;
    title: string;
    description: string | null;
    password_hash: string;
    status: "draft" | "in_progress" | "completed";
  };
  images: SelectionImage[];
  imageCount: number;
  selectedCount: number;
}

// Image upload data
export interface ImageUploadData {
  file: File;
  preview?: string;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
}

// Client selection access types
export interface ClientSelectionAccess {
  project: {
    id: string;
    title: string;
    description: string | null;
    hasPassword: boolean;
  };
  selection: SelectionWithDetails;
}

// Selection image with client interaction data
export interface SelectionImageWithInteractions extends SelectionImage {
  comments?: SelectionComment[];
}

export interface ClientPasswordVerification {
  password: string;
}

export const clientPasswordSchema = z.object({
  password: z.string().min(1, "Mot de passe requis"),
});

export type ClientPasswordFormData = z.infer<typeof clientPasswordSchema>;

// Client selection actions
export interface ClientSelectionAction {
  selection_id: string;
  action: "validate" | "request_revisions";
  selected_images: string[]; // Array of image IDs
  comment?: string;
  timestamp: string;
}

export interface ClientRevisionRequest {
  comment?: string;
}

export const clientRevisionRequestSchema = z.object({
  comment: z.string().optional(),
});

export type ClientRevisionRequestData = z.infer<
  typeof clientRevisionRequestSchema
>;

// Selection status update
export interface SelectionStatusUpdate {
  status: "completed" | "revision_requested";
  client_comment?: string;
  selected_images?: string[];
  updated_at: string;
}

// Client comment form validation
export const clientCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Le commentaire ne peut pas être vide")
    .max(500, "Le commentaire est trop long"),
});

export type ClientCommentFormData = z.infer<typeof clientCommentSchema>;

// Selection image toggle request
export interface ImageSelectionRequest {
  imageId: string;
  selected: boolean;
}

export interface ImageSelectionResponse {
  success: boolean;
  selected: boolean;
  selectedCount: number;
  maxReached: boolean;
}
