import { z } from "zod";
import type { Tables } from "~/types/database.types";
import type {
  UploadFileStatus,
  UploadOptions,
  UploadProgress,
  UploadResult,
} from "~/types/upload";

export type Moodboard = Tables<"moodboards">;
export type MoodboardImage = Tables<"moodboard_images">;
export type MoodboardComment = Tables<"moodboard_comments">;
export type MoodboardReaction = Tables<"moodboard_reactions">;

export interface IMoodboardFilters {
  search?: string;
  status?:
    | "draft"
    | "awaiting_client"
    | "revision_requested"
    | "completed"
    | null;
  project_id?: string;
}

export interface IMoodboardRepository {
  findById(id: string): Promise<Moodboard | null>;
  findByProjectId(projectId: string): Promise<Moodboard | null>;
  create(
    moodboardData: Omit<Moodboard, "id" | "created_at" | "updated_at">
  ): Promise<Moodboard>;
  update(id: string, moodboardData: Partial<Moodboard>): Promise<Moodboard>;
  delete(id: string): Promise<void>;
}

export interface IMoodboardImageRepository {
  findByMoodboardId(moodboardId: string): Promise<MoodboardImage[]>;
  create(
    data: Omit<MoodboardImage, "id" | "created_at">
  ): Promise<MoodboardImage>;
  update(id: string, data: Partial<MoodboardImage>): Promise<MoodboardImage>;
  delete(id: string): Promise<void>;
  deleteMany(moodboardId: string): Promise<void>;
  getPublicUrl(filePath: string): string;
}

// Validation schema for moodboard form
export const moodboardFormSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis")
    .max(255, "Le titre est trop long"),
  description: z
    .string()
    .max(1000, "La description est trop longue")
    .optional()
    .nullable(),
  status: z
    .enum([
      "draft",
      "awaiting_client",
      "revision_requested",
      "payment_pending",
      "completed",
    ])
    .default("draft"),
});

export type MoodboardFormData = z.infer<typeof moodboardFormSchema>;

// Moodboard with project and images information for display
export interface MoodboardWithDetails extends Moodboard {
  project?: Tables<"projects">;
  images?: readonly MoodboardImage[];
  imageCount?: number;
}

// Client moodboard access types
export interface ClientMoodboardAccess {
  project: {
    id: string;
    title: string;
    description: string | null;
    hasPassword: boolean;
  };
  moodboard: MoodboardWithDetails;
}

// Moodboard image with client interaction data
export interface MoodboardImageWithInteractions extends MoodboardImage {
  reactions?: {
    love: number;
    like: number;
    dislike: number;
  };
  userReaction?: "love" | "like" | "dislike" | null;
  comments?: MoodboardComment[];
  signed_url?: string | null;
}

export interface ClientPasswordVerification {
  password: string;
}

export const clientPasswordSchema = z.object({
  password: z.string().min(1, "Mot de passe requis"),
});

export type ClientPasswordFormData = z.infer<typeof clientPasswordSchema>;

// Client moodboard actions
export interface ClientMoodboardAction {
  moodboard_id: string;
  action: "validate" | "request_revisions";
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

// Moodboard status update
export interface MoodboardStatusUpdate {
  status: "completed" | "revision_requested";
  client_comment?: string;
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

// Reaction types
export type ReactionType = "love" | "like" | "dislike";

export interface ReactionCounts {
  love: number;
  like: number;
  dislike: number;
}

export interface ImageReactions {
  [imageId: string]: ReactionCounts;
}

export interface ReactionRequest {
  imageId: string;
  reaction: ReactionType;
}

export interface ReactionResponse {
  success: boolean;
  action: "created" | "updated" | "removed";
  reaction: ReactionType | null;
}

export interface ReactionsResponse {
  success: boolean;
  reactions: ImageReactions;
}

// Client reaction form validation
export const clientReactionSchema = z.object({
  imageId: z.string().uuid(),
  reaction: z.enum(["love", "like", "dislike"]),
});

export type ClientReactionFormData = z.infer<typeof clientReactionSchema>;

// Re-export upload types for backward compatibility
export type { UploadFileStatus, UploadOptions, UploadProgress };

// Moodboard-specific upload result type
export type MoodboardUploadResult = UploadResult<MoodboardImage>;
