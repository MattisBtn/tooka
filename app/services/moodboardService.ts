import { moodboardImageRepository } from "~/repositories/moodboardImageRepository";
import { moodboardRepository } from "~/repositories/moodboardRepository";
import type {
  IMoodboardFilters,
  IPagination,
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
   * Fetch moodboards with pagination and filtering
   */
  async getMoodboards(
    filters: IMoodboardFilters = {},
    pagination: IPagination
  ): Promise<Moodboard[]> {
    const moodboards = await moodboardRepository.findMany(filters, pagination);

    // Business logic: sort by status priority
    return moodboards.sort((a, b) => {
      const statusOrder = {
        draft: 0,
        awaiting_client: 1,
        revision_requested: 2,
        payment_pending: 3,
        completed: 4,
      };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  },

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

    const moodboard = await moodboardRepository.findByProjectId(projectId);

    if (!moodboard) {
      return null;
    }

    // Get images count
    const images = await moodboardImageRepository.findByMoodboardId(
      moodboard.id
    );

    return {
      ...moodboard,
      images,
      imageCount: images.length,
    };
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

    // Check if moodboard already exists for this project
    const existingMoodboard = await this.getMoodboardByProjectId(
      moodboardData.project_id
    );
    if (existingMoodboard) {
      throw new Error("Un moodboard existe déjà pour ce projet");
    }

    // For creation, always save as draft
    const finalMoodboardData = {
      ...moodboardData,
      status: "draft" as const,
    };

    // Create moodboard
    const moodboard = await moodboardRepository.create(finalMoodboardData);

    // For creation, project is never updated automatically
    const projectUpdated = false;

    return { moodboard, projectUpdated };
  },

  /**
   * Update moodboard with business rules
   */
  async updateMoodboard(
    id: string,
    updates: Partial<Moodboard>
  ): Promise<{ moodboard: MoodboardWithDetails; projectUpdated: boolean }> {
    const existingMoodboard = await this.getMoodboardById(id);

    // Apply updates as-is
    const finalUpdates = { ...updates };

    // Business rules for status transitions
    if (finalUpdates.status) {
      const currentStatus = existingMoodboard.status;
      const newStatus = finalUpdates.status;

      // Allow logical transitions:
      // - draft -> awaiting_client (send to client)
      // - awaiting_client -> draft (back to draft)
      // - revision_requested -> draft (back to draft)
      // - revision_requested -> awaiting_client (send updated version to client)

      const allowedTransitions: Record<string, string[]> = {
        draft: ["awaiting_client"],
        awaiting_client: ["draft", "revision_requested"],
        revision_requested: ["draft", "awaiting_client"],
        payment_pending: ["draft", "awaiting_client"],
        completed: [], // completed moodboards cannot be modified
      };

      if (currentStatus === "completed" && newStatus !== "completed") {
        throw new Error(
          "Les moodboards validés par le client ne peuvent plus être modifiés"
        );
      }

      // Allow same status (no change)
      if (
        currentStatus !== newStatus &&
        !allowedTransitions[currentStatus]?.includes(newStatus)
      ) {
        throw new Error(
          `Transition de statut non autorisée: ${currentStatus} -> ${newStatus}`
        );
      }
    }

    // Update moodboard
    const moodboard = await moodboardRepository.update(id, finalUpdates);

    // Get updated moodboard with images
    const moodboardWithDetails = await this.getMoodboardByProjectId(
      moodboard.project_id
    );

    if (!moodboardWithDetails) {
      throw new Error("Failed to fetch updated moodboard details");
    }

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

    // Delete all images first
    await moodboardImageRepository.deleteMany(id);

    // Delete moodboard
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
    // Verify moodboard exists
    const _moodboard = await this.getMoodboardById(moodboardId);

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
