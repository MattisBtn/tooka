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

    const data = await moodboardRepository.findByProjectId(projectId);

    if (!data) {
      return null;
    }

    // Transform data for store usage
    const images =
      (data as Moodboard & { moodboard_images?: MoodboardImage[] })
        .moodboard_images || [];
    return {
      ...data,
      images: images,
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
};
