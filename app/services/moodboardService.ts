import { moodboardImageRepository } from "~/repositories/moodboardImageRepository";
import { moodboardRepository } from "~/repositories/moodboardRepository";
import type {
  IMoodboardFilters,
  IPagination,
  Moodboard,
  MoodboardImage,
  MoodboardWithDetails,
} from "~/types/moodboard";

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
    moodboardData: Omit<Moodboard, "id" | "created_at" | "updated_at">,
    shouldValidate: boolean = false
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

    // Set status based on validation
    const finalMoodboardData = {
      ...moodboardData,
      status: shouldValidate
        ? ("awaiting_client" as const)
        : ("draft" as const),
    };

    // Create moodboard
    const moodboard = await moodboardRepository.create(finalMoodboardData);

    // For now, we don't update project status automatically
    // This could be added later if needed
    const projectUpdated = false;

    return { moodboard, projectUpdated };
  },

  /**
   * Update moodboard with business rules
   */
  async updateMoodboard(
    id: string,
    updates: Partial<Moodboard>,
    shouldValidate?: boolean
  ): Promise<{ moodboard: MoodboardWithDetails; projectUpdated: boolean }> {
    const existingMoodboard = await this.getMoodboardById(id);

    // Handle validation status change
    const finalUpdates = { ...updates };

    // If shouldValidate is explicitly provided, override the status
    if (shouldValidate !== undefined) {
      finalUpdates.status = shouldValidate ? "awaiting_client" : "draft";
    }

    // If status is provided in updates, use it (allows direct status control)
    if (updates.status) {
      finalUpdates.status = updates.status;
    }

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

    // Get images for the updated moodboard
    const images = await moodboardImageRepository.findByMoodboardId(id);

    // Return moodboard with details
    const moodboardWithDetails: MoodboardWithDetails = {
      ...moodboard,
      images,
      imageCount: images.length,
    };

    // Project is considered updated when moodboard is sent to client
    const projectUpdated = finalUpdates.status === "awaiting_client";

    return { moodboard: moodboardWithDetails, projectUpdated };
  },

  /**
   * Delete moodboard with dependency checks
   */
  async deleteMoodboard(id: string): Promise<void> {
    const moodboard = await this.getMoodboardById(id);

    // Business rule: can only delete moodboards that are not completed (validated by client)
    if (moodboard.status === "completed") {
      throw new Error(
        "Cannot delete moodboards that have been validated by the client"
      );
    }

    // Delete all images first
    await moodboardImageRepository.deleteMany(id);

    // Delete moodboard
    await moodboardRepository.delete(id);
  },

  /**
   * Upload multiple images to moodboard
   */
  async uploadImages(
    moodboardId: string,
    files: File[]
  ): Promise<MoodboardImage[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour uploader des images");
    }

    if (!files.length) {
      throw new Error("Aucun fichier sélectionné");
    }

    // Verify moodboard exists and belongs to user
    const _moodboard = await this.getMoodboardById(moodboardId);

    const uploadedImages: MoodboardImage[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          errors.push(`${file.name}: Type de fichier non supporté`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 100 * 1024 * 1024) {
          errors.push(`${file.name}: Fichier trop volumineux (max 10MB)`);
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `${user.value.id}/moodboards/${moodboardId}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("moodboard-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          errors.push(`${file.name}: ${uploadError.message}`);
          continue;
        }

        // Create database record
        const imageData = {
          moodboard_id: moodboardId,
          file_url: filePath,
        };

        const image = await moodboardImageRepository.create(imageData);
        uploadedImages.push(image);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        errors.push(`${file.name}: ${errorMessage}`);
      }
    }

    if (errors.length > 0 && uploadedImages.length === 0) {
      throw new Error(`Échec de l'upload: ${errors.join(", ")}`);
    }

    if (errors.length > 0) {
      console.warn("Some uploads failed:", errors);
    }

    return uploadedImages;
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
   * Get moodboard status options for UI
   */
  getStatusOptions() {
    return [
      {
        value: "draft" as const,
        label: "Brouillon",
        description: "Moodboard en cours de préparation",
        icon: "i-lucide-image",
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
        value: "completed" as const,
        label: "Validé",
        description: "Moodboard validé par le client",
        icon: "i-lucide-check-circle",
        color: "success",
      },
    ];
  },
};
