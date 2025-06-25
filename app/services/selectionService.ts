import { selectionImageRepository } from "~/repositories/selectionImageRepository";
import { selectionRepository } from "~/repositories/selectionRepository";
import type {
  IPagination,
  ISelectionFilters,
  Selection,
  SelectionImage,
  SelectionWithDetails,
} from "~/types/selection";

export const selectionService = {
  /**
   * Fetch selections with pagination and filtering
   */
  async getSelections(
    filters: ISelectionFilters = {},
    pagination: IPagination
  ): Promise<Selection[]> {
    const selections = await selectionRepository.findMany(filters, pagination);

    // Business logic: sort by status priority
    return selections.sort((a, b) => {
      const statusOrder = {
        draft: 0,
        awaiting_client: 1,
        revision_requested: 2,
        completed: 3,
      };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  },

  /**
   * Get selection by ID with validation
   */
  async getSelectionById(id: string): Promise<Selection> {
    if (!id?.trim()) {
      throw new Error("Selection ID is required");
    }

    const selection = await selectionRepository.findById(id);

    if (!selection) {
      throw new Error("Selection not found");
    }

    return selection;
  },

  /**
   * Get selection by project ID with images
   */
  async getSelectionByProjectId(
    projectId: string
  ): Promise<SelectionWithDetails | null> {
    if (!projectId?.trim()) {
      throw new Error("Project ID is required");
    }

    const selection = await selectionRepository.findByProjectId(projectId);

    if (!selection) {
      return null;
    }

    // Get images
    const images = await selectionImageRepository.findBySelectionId(
      selection.id
    );

    // Count selected images
    const selectedCount = images.filter((img) => img.is_selected).length;

    return {
      ...selection,
      images,
      imageCount: images.length,
      selectedCount,
    };
  },

  /**
   * Create new selection with validation and business rules
   */
  async createSelection(
    selectionData: Omit<Selection, "id" | "created_at" | "updated_at">,
    shouldValidate: boolean = false
  ): Promise<{ selection: Selection; projectUpdated: boolean }> {
    if (!selectionData.project_id?.trim()) {
      throw new Error("Project ID is required");
    }

    if (
      !selectionData.max_media_selection ||
      selectionData.max_media_selection < 1
    ) {
      throw new Error("Le nombre maximum de médias sélectionnables est requis");
    }

    // Check if selection already exists for this project
    const existingSelection = await this.getSelectionByProjectId(
      selectionData.project_id
    );
    if (existingSelection) {
      throw new Error("Une sélection existe déjà pour ce projet");
    }

    // Set status based on validation
    const finalSelectionData = {
      ...selectionData,
      status: shouldValidate
        ? ("awaiting_client" as const)
        : ("draft" as const),
    };

    // Create selection
    const selection = await selectionRepository.create(finalSelectionData);

    // For now, we don't update project status automatically
    // This could be added later if needed
    const projectUpdated = false;

    return { selection, projectUpdated };
  },

  /**
   * Update selection with business rules
   */
  async updateSelection(
    id: string,
    updates: Partial<Selection>,
    shouldValidate?: boolean
  ): Promise<{ selection: Selection; projectUpdated: boolean }> {
    const existingSelection = await this.getSelectionById(id);

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
      const currentStatus = existingSelection.status;
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
        completed: [], // completed selections cannot be modified
      };

      if (currentStatus === "completed" && newStatus !== "completed") {
        throw new Error(
          "Les sélections validées par le client ne peuvent plus être modifiées"
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

    // Update selection
    const selection = await selectionRepository.update(id, finalUpdates);

    // Project is considered updated when selection is sent to client
    const projectUpdated = finalUpdates.status === "awaiting_client";

    return { selection, projectUpdated };
  },

  /**
   * Delete selection with dependency checks
   */
  async deleteSelection(id: string): Promise<void> {
    const selection = await this.getSelectionById(id);

    // Business rule: can only delete selections that are not completed (validated by client)
    if (selection.status === "completed") {
      throw new Error(
        "Cannot delete selections that have been validated by the client"
      );
    }

    // Delete all images first
    await selectionImageRepository.deleteMany(id);

    // Delete selection
    await selectionRepository.delete(id);
  },

  /**
   * Upload multiple images to selection
   */
  async uploadImages(
    selectionId: string,
    files: File[]
  ): Promise<SelectionImage[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté pour uploader des images");
    }

    if (!files.length) {
      throw new Error("Aucun fichier sélectionné");
    }

    // Verify selection exists and belongs to user
    const _selection = await this.getSelectionById(selectionId);

    const uploadedImages: SelectionImage[] = [];
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
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `${user.value.id}/selections/${selectionId}/${fileName}`;

        // Detect if file is RAW format
        const rawFormats = [
          "nef",
          "dng",
          "raw",
          "cr2",
          "arw",
          "raf",
          "orf",
          "rw2",
          "crw",
          "pef",
          "srw",
          "x3f",
        ];
        const isRawFormat = rawFormats.includes(fileExt);

        // Determine source format from file extension
        const sourceFormat = fileExt || file.type.split("/")[1] || "unknown";

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("selection-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          errors.push(`${file.name}: ${uploadError.message}`);
          continue;
        }

        // Create database record with conversion info
        const imageData = {
          selection_id: selectionId,
          file_url: filePath,
          is_selected: false,
          source_file_url: filePath, // For now, same as file_url (will be different after conversion)
          source_filename: file.name,
          source_format: sourceFormat,
          target_format: isRawFormat ? "jpeg" : sourceFormat, // Convert RAW to JPEG, others keep original format
          requires_conversion: isRawFormat,
          conversion_status: (isRawFormat ? "pending" : "completed") as
            | "pending"
            | "completed", // RAW files need conversion, others are ready
        };

        const image = await selectionImageRepository.create(imageData);
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
   * Get signed URL for selection image
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
      .from("selection-images")
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  },

  /**
   * Delete image from selection
   */
  async deleteImage(imageId: string): Promise<void> {
    await selectionImageRepository.delete(imageId);
  },

  /**
   * Toggle image selection status
   */
  async toggleImageSelection(
    imageId: string,
    selected: boolean
  ): Promise<{
    success: boolean;
    selectedCount: number;
    maxReached?: boolean;
  }> {
    // Get the image to verify it exists and get selection info
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error("Vous devez être connecté");
    }

    // Get image with selection info
    const { data: imageData, error: imageError } = await supabase
      .from("selection_images")
      .select(
        `
        *,
        selection:selections!inner(
          id,
          max_media_selection,
          project:projects!inner(
            user_id
          )
        )
      `
      )
      .eq("id", imageId)
      .eq("selection.project.user_id", user.value.id)
      .single();

    if (imageError || !imageData) {
      throw new Error("Image non trouvée ou accès non autorisé");
    }

    const selection = Array.isArray(imageData.selection)
      ? imageData.selection[0]
      : imageData.selection;

    // If trying to select, check if max is reached
    if (selected && !imageData.is_selected) {
      // Count currently selected images
      const { data: selectedImages, error: countError } = await supabase
        .from("selection_images")
        .select("id")
        .eq("selection_id", selection.id)
        .eq("is_selected", true);

      if (countError) {
        throw new Error("Erreur lors du comptage des images sélectionnées");
      }

      if (selectedImages.length >= selection.max_media_selection) {
        return {
          success: false,
          selectedCount: selectedImages.length,
          maxReached: true,
        };
      }
    }

    // Update the image selection status
    await selectionImageRepository.update(imageId, { is_selected: selected });

    // Get updated count
    const { data: updatedSelectedImages } = await supabase
      .from("selection_images")
      .select("id")
      .eq("selection_id", selection.id)
      .eq("is_selected", true);

    return {
      success: true,
      selectedCount: updatedSelectedImages?.length || 0,
    };
  },

  /**
   * Get selection status options for UI
   */
  getStatusOptions() {
    return [
      {
        value: "draft" as const,
        label: "Brouillon",
        description: "Sélection en cours de préparation",
        icon: "i-lucide-mouse-pointer-click",
        color: "neutral",
      },
      {
        value: "awaiting_client" as const,
        label: "En attente client",
        description: "Sélection envoyée au client",
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
        description: "Sélection validée par le client",
        icon: "i-lucide-check-circle",
        color: "success",
      },
    ];
  },
};
