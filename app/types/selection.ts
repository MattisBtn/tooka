import { z } from "zod";
import type { Tables } from "~/types/database.types";

export type Selection = Tables<"selections">;
export type SelectionImage = Tables<"selection_images">;
export type SelectionComment = Tables<"selection_comments">;

export interface ISelectionRepository {
  findById(id: string): Promise<Selection | null>;
  findByProjectId(projectId: string): Promise<{
    selection: Selection | null;
    images: SelectionImage[];
  }>;
  create(
    data: Omit<Selection, "id" | "created_at" | "updated_at">
  ): Promise<Selection>;
  update(id: string, data: Partial<Selection>): Promise<Selection>;
  delete(id: string): Promise<void>;
}

export interface ISelectionImageRepository {
  create(
    data: Omit<SelectionImage, "id" | "created_at">
  ): Promise<SelectionImage>;
  update(id: string, data: Partial<SelectionImage>): Promise<SelectionImage>;
  delete(id: string): Promise<void>;
  getSignedUrl(filePath: string, expiresIn?: number): Promise<string>;
  downloadImageBlob(
    filePath: string,
    options?: ImageDownloadOptions
  ): Promise<Blob>;
}

// Validation schema for selection form
export const selectionFormSchema = z.object({
  max_media_selection: z
    .number()
    .min(-1, "La valeur doit être -1 (illimité) ou au moins 1")
    .max(1000, "Nombre maximum trop élevé"),
  extra_media_price: z
    .number()
    .min(0, "Le prix doit être positif")
    .optional()
    .nullable(),
  status: z.enum([
    "draft",
    "awaiting_client",
    "revision_requested",
    "completed",
    "payment_pending",
  ]),
});

export type SelectionFormData = z.infer<typeof selectionFormSchema>;

// Selection with project and images information for display
export interface SelectionWithDetails extends Selection {
  project?: Partial<Tables<"projects">>;
  images?: readonly SelectionImage[];
  imageCount?: number;
  selectedCount?: number;
  hasMore?: boolean;
  currentPage?: number;
  activeFilters?: {
    selected: boolean;
  };
}

// Selection with project info for client access
export interface SelectionWithProjectDetails extends Selection {
  project: {
    id: string;
    title: string;
    description: string | null;
    password_hash: string;
    status: "draft" | "in_progress" | "completed";
    remaining_amount: number | null;
  };
  images: SelectionImage[];
  imageCount: number;
  selectedCount: number;
}

// Client-side types for selection access
export interface ClientSelectionAccess {
  project: {
    id: string;
    title: string;
    description: string | null;
    hasPassword: boolean;
    maxImages?: number;
    extraImagePrice?: number;
  };
  selection: SelectionWithImages & {
    imageCount: number;
    hasMore: boolean;
    currentPage: number;
    activeFilters?: {
      selected: boolean;
    };
  };
}

export interface SelectionImageWithSelection extends SelectionImage {
  userSelected?: boolean; // Track user's selection state
  signed_url?: string | null; // Signed URL for client access
}

export interface SelectionWithImages extends Selection {
  images?: readonly SelectionImageWithSelection[];
}

// Client verification schema
export const clientPasswordVerificationSchema = z.object({
  password: z.string().min(1, "Mot de passe requis"),
});

export type ClientPasswordVerification = z.infer<
  typeof clientPasswordVerificationSchema
>;

// Client revision request schema
export const clientRevisionRequestSchema = z.object({
  comment: z.string().optional(),
});

export type ClientRevisionRequest = z.infer<typeof clientRevisionRequestSchema>;

// Client image selection schema
export const clientImageSelectionSchema = z.object({
  imageId: z.string().uuid(),
  selected: z.boolean(),
});

export type ClientImageSelection = z.infer<typeof clientImageSelectionSchema>;

// Client comment form validation
export const clientCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Le commentaire ne peut pas être vide")
    .max(500, "Le commentaire est trop long"),
});

export type ClientCommentFormData = z.infer<typeof clientCommentSchema>;

// Image download types
export interface ImageDownloadOptions {
  filename?: string;
  forceDownload?: boolean;
}
