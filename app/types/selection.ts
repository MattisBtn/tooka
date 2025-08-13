import { z } from "zod";
import type { Tables } from "~/types/database.types";
import {
  MODULE_STATUS,
  type ModuleStatus,
  type ProjectStatus,
} from "~/types/status";

export type Selection = Tables<"selections">;
export type SelectionImage = Tables<"selection_images">;
export type SelectionComment = Tables<"selection_comments">;

export interface ISelectionFilters {
  search?: string;
  status?: ModuleStatus | null;
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
  getSignedUrl(filePath: string, expiresIn?: number): Promise<string>;
  downloadImageBlob(
    filePath: string,
    options?: ImageDownloadOptions
  ): Promise<Blob>;
  subscribeToSelectionImages(
    selectionId: string,
    callback: (payload: SelectionImageRealtimePayload) => void
  ): { unsubscribe: () => Promise<"ok" | "timed out" | "error"> };
  updateConversionStatus(
    imageIds: string[],
    status:
      | "pending"
      | "queued"
      | "processing"
      | "completed"
      | "failed"
      | "retrying"
      | "cancelled"
  ): Promise<void>;
  getImagesRequiringConversion(
    selectionId: string,
    statuses?: (
      | "pending"
      | "queued"
      | "processing"
      | "completed"
      | "failed"
      | "retrying"
      | "cancelled"
    )[]
  ): Promise<SelectionImage[]>;
}

export interface IPagination {
  page: number;
  pageSize: number;
}

// Selection status options for UI
export interface SelectionStatusItem {
  value: ModuleStatus;
  label: string;
  description: string;
  icon: string;
  color: string;
}

// Selection limit options for UI
export interface SelectionLimitOption {
  value: number;
  label: string;
  description: string;
  icon: string;
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
    MODULE_STATUS.DRAFT,
    MODULE_STATUS.AWAITING_CLIENT,
    MODULE_STATUS.REVISION_REQUESTED,
    MODULE_STATUS.COMPLETED,
    MODULE_STATUS.PAYMENT_PENDING,
  ]),
});

export type SelectionFormData = z.infer<typeof selectionFormSchema>;

// Selection with project and images information for display
export interface SelectionWithDetails extends Selection {
  project?: {
    readonly id: string;
    readonly title: string;
    readonly status: ProjectStatus;
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
    status: ProjectStatus;
    remaining_amount: number | null;
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

// Realtime types for selection images
export interface SelectionImageRealtimePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: SelectionImage;
  old: SelectionImage;
}

export interface SelectionRealtimeSubscription {
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  isSubscribed: () => boolean;
}

// Image download types
export interface ImageDownloadOptions {
  filename?: string;
  forceDownload?: boolean;
}
