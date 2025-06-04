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
  value: "draft" | "awaiting_client" | "revision_requested" | "completed";
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
    .enum(["draft", "awaiting_client", "revision_requested", "completed"])
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
