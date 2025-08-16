import { moodboardImageRepository } from "~/repositories/moodboardImageRepository";
import { moodboardRepository } from "~/repositories/moodboardRepository";
import type {
  Moodboard,
  MoodboardImage,
  MoodboardUploadResult,
  MoodboardWithDetails,
} from "~/types/moodboard";
import type { UploadOptions } from "~/types/upload";
import { MOODBOARD_UPLOAD_CONFIG } from "~/types/upload";
import { uploadImagesWithProgress } from "~/utils/uploadService";

export const moodboardService = {
  /**
   * Get moodboard by ID with validation
   */
  async getMoodboardById(id: string): Promise<Moodboard> {
    if (!id?.trim()) {
      throw new Error("Moodboard ID is required");
    }

    const moodboard = await moodboardRepository.findById(id);

    if (!moodboard) {
      throw new Error("Moodboard not found");
    }

    return moodboard;
  },

  /**
   * Get moodboard by project ID with images
   */
  async getMoodboardByProjectId(
    projectId: string
  ): Promise<MoodboardWithDetails | null> {
    if (!projectId?.trim()) {
      throw new Error("Project ID is required");
    }

    // Use optimized single query with join instead of 2 separate calls
    return await moodboardRepository.findByProjectId(projectId);
  },

  /**
   * Create new moodboard with validation and business rules
   */
  async createMoodboard(
    moodboardData: Omit<Moodboard, "id" | "created_at" | "updated_at">
  ): Promise<{ moodboard: Moodboard; projectUpdated: boolean }> {
    if (!moodboardData.project_id?.trim()) {
      throw new Error("Project ID is required");
    }

    if (!moodboardData.title?.trim()) {
      throw new Error("Le titre est requis");
    }

    try {
      const moodboard = await moodboardRepository.create({
        ...moodboardData,
        status: "draft" as const,
      });
      return { moodboard, projectUpdated: false };
    } catch (error) {
      if (
        (error instanceof Error && error.message.includes("duplicate key")) ||
        (error as Error).message.includes("unique")
      ) {
        throw new Error("Un moodboard existe déjà pour ce projet");
      }
      throw error;
    }
  },

  /**
   * Update moodboard with business rules
   */
  async updateMoodboard(
    id: string,
    updates: Partial<Moodboard>
  ): Promise<{ moodboard: MoodboardWithDetails; projectUpdated: boolean }> {
    const finalUpdates = { ...updates };

    // Update moodboard and get images in a single optimized call
    const moodboardWithDetails = await moodboardRepository.update(
      id,
      finalUpdates
    );

    // Project is considered updated when moodboard is sent to client
    const projectUpdated = finalUpdates.status === "awaiting_client";

    return { moodboard: moodboardWithDetails, projectUpdated };
  },

  /**
   * Delete moodboard with dependency checks
   */
  async deleteMoodboard(id: string): Promise<void> {
    const moodboard = await this.getMoodboardById(id);

    // Business rule: can't delete moodboards that are completed or payment pending
    if (
      moodboard.status === "completed" ||
      moodboard.status === "payment_pending"
    ) {
      throw new Error(
        "Cannot delete moodboards that are payment pending or completed"
      );
    }

    await moodboardRepository.delete(id);
  },

  /**
   * Upload multiple images to moodboard (legacy method for backward compatibility)
   */
  async uploadImages(
    moodboardId: string,
    files: File[]
  ): Promise<MoodboardImage[]> {
    const result = await this.uploadImagesWithProgress(moodboardId, files);
    return result.uploadedImages;
  },

  /**
   * Upload multiple images with detailed progress tracking and parallel processing
   */
  async uploadImagesWithProgress(
    moodboardId: string,
    files: File[],
    options: UploadOptions = {}
  ): Promise<MoodboardUploadResult> {
    return uploadImagesWithProgress<MoodboardImage>(
      moodboardId,
      files,
      MOODBOARD_UPLOAD_CONFIG,
      moodboardImageRepository,
      (moodboardId: string, filePath: string) => ({
        moodboard_id: moodboardId,
        file_url: filePath,
      }),
      options
    );
  },

  /**
   * Get signed URL for moodboard image
   */
  async getImageSignedUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour accéder à l'image");
    }

    const { data, error } = await supabase.storage
      .from("moodboard-images")
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  },

  /**
   * Delete image from moodboard
   */
  async deleteImage(imageId: string): Promise<void> {
    await moodboardImageRepository.delete(imageId);
  },

  /**
   * Delete all images from moodboard
   */
  async deleteAllImages(moodboardId: string): Promise<void> {
    await moodboardImageRepository.deleteMany(moodboardId);
  },

  /**
   * Get moodboard status options for UI
   */
  getStatusOptions() {
    return [
      {
        value: "draft" as const,
        label: "Brouillon",
        description: "Moodboard en cours de préparation",
        icon: "i-lucide-palette",
        color: "neutral",
      },
      {
        value: "awaiting_client" as const,
        label: "En attente client",
        description: "Moodboard envoyé au client",
        icon: "i-lucide-clock",
        color: "warning",
      },
      {
        value: "revision_requested" as const,
        label: "Révision demandée",
        description: "Le client demande des modifications",
        icon: "i-lucide-edit",
        color: "info",
      },
      {
        value: "payment_pending" as const,
        label: "Paiement en attente",
        description: "En attente de confirmation de paiement",
        icon: "i-lucide-credit-card",
        color: "info",
      },
      {
        value: "completed" as const,
        label: "Accepté",
        description: "Moodboard accepté par le client",
        icon: "i-lucide-check-circle",
        color: "success",
      },
    ];
  },
};
