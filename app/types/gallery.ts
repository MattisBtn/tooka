import { z } from "zod";
import type { Tables } from "~/types/database.types";

export type Gallery = Tables<"galleries">;
export type GalleryImage = Tables<"gallery_images">;
export type GalleryComment = Tables<"gallery_comments">;

export interface IGalleryFilters {
  search?: string;
  status?:
    | "draft"
    | "awaiting_client"
    | "revision_requested"
    | "completed"
    | "payment_pending"
    | null;
  project_id?: string;
}

export interface IGalleryRepository {
  findMany(
    filters: IGalleryFilters,
    pagination: IPagination
  ): Promise<Gallery[]>;
  findById(id: string): Promise<Gallery | null>;
  findByProjectId(projectId: string): Promise<Gallery | null>;
  create(
    data: Omit<Gallery, "id" | "created_at" | "updated_at">
  ): Promise<Gallery>;
  update(id: string, data: Partial<Gallery>): Promise<Gallery>;
  delete(id: string): Promise<void>;
}

export interface IGalleryImageRepository {
  findByGalleryId(galleryId: string): Promise<GalleryImage[]>;
  create(data: Omit<GalleryImage, "id" | "created_at">): Promise<GalleryImage>;
  update(id: string, data: Partial<GalleryImage>): Promise<GalleryImage>;
  delete(id: string): Promise<void>;
  deleteMany(galleryId: string): Promise<void>;
  getPublicUrl(filePath: string): string;
}

export interface IPagination {
  page: number;
  pageSize: number;
}

// Gallery status options for UI
export interface GalleryStatusItem {
  value:
    | "draft"
    | "awaiting_client"
    | "revision_requested"
    | "completed"
    | "payment_pending";
  label: string;
  description: string;
  icon: string;
  color: string;
}

// Validation schema for gallery form
export const galleryFormSchema = z.object({
  payment_required: z.boolean().default(true),
  selection_id: z.string().optional().nullable(),
  status: z
    .enum([
      "draft",
      "awaiting_client",
      "revision_requested",
      "completed",
      "payment_pending",
    ])
    .default("draft"),
});

export type GalleryFormData = z.infer<typeof galleryFormSchema>;

// Gallery with project and images information for display
export interface GalleryWithDetails extends Gallery {
  project?: {
    readonly id: string;
    readonly title: string;
    readonly status: "draft" | "in_progress" | "completed";
  };
  images?: readonly GalleryImage[];
  imageCount?: number;
  hasMore?: boolean;
  currentPage?: number;
}

// Gallery with project info for client access
export interface GalleryWithProjectDetails extends Gallery {
  project: {
    id: string;
    title: string;
    description: string | null;
    password_hash: string;
    status: "draft" | "in_progress" | "completed";
  };
  images: GalleryImage[];
  imageCount: number;
}

// Image upload data
export interface ImageUploadData {
  file: File;
  preview?: string;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
}

// Gallery pricing calculation
export interface GalleryPricing {
  basePrice: number;
  depositPaid: number;
  remainingAmount: number;
  paymentRequired: boolean;
}

// Client gallery access types
export interface ClientGalleryAccess {
  project: {
    id: string;
    title: string;
    description: string | null;
    hasPassword: boolean;
    remainingAmount: number;
  };
  gallery: GalleryWithDetails;
}

export interface ClientPasswordVerification {
  password: string;
}

export const clientPasswordSchema = z.object({
  password: z.string().min(1, "Mot de passe requis"),
});

export type ClientPasswordFormData = z.infer<typeof clientPasswordSchema>;

// Client gallery actions
export interface ClientGalleryAction {
  gallery_id: string;
  action: "validate" | "validate_with_payment" | "request_revisions";
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

// Gallery status update
export interface GalleryStatusUpdate {
  status: "completed" | "revision_requested";
  client_comment?: string;
  updated_at: string;
}

// Gallery payment types (similar to proposal payment types)
export interface GalleryPaymentData {
  method: string;
  amount: number;
  reference: string;
  bankDetails?: {
    iban: string;
    bic: string;
    beneficiary: string;
    reference: string;
  };
}

export interface GalleryPaymentResponse {
  success: boolean;
  message: string;
  payment: GalleryPaymentData;
  gallery: {
    id: string;
    status: "payment_pending";
    clientName: string;
    projectTitle: string;
  };
}
