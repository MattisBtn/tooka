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

    // Trigger conversion for RAW images
    const rawImageIds = uploadedImages
      .filter((img) => img.requires_conversion)
      .map((img) => img.id);

    if (rawImageIds.length > 0) {
      // Queue images for conversion using repository
      try {
        await selectionImageRepository.updateConversionStatus(
          rawImageIds,
          "queued"
        );

        // Trigger conversion asynchronously (don't wait for completion)
        const { conversionService } = await import(
          "~/services/conversionService"
        );
        conversionService.convertImages(rawImageIds).catch((error) => {
          console.error("Background conversion failed:", error);
        });
      } catch (error) {
        console.warn("Failed to queue images for conversion:", error);
        // Don't throw error as upload was successful
      }
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
    return await selectionImageRepository.getSignedUrl(filePath, expiresIn);
  },

  /**
   * Download image with proper browser download behavior
   */
  async downloadImage(
    filePath: string,
    filename?: string,
    forceDownload: boolean = true
  ): Promise<void> {
    try {
      if (forceDownload) {
        // Use blob download for reliable file downloads
        const blob = await selectionImageRepository.downloadImageBlob(filePath);

        // Create download link with blob URL
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename || `image_${Date.now()}`;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup blob URL
        URL.revokeObjectURL(url);
      } else {
        // Use signed URL for preview/navigation
        const signedUrl = await this.getImageSignedUrl(filePath);
        window.open(signedUrl, "_blank");
      }
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `Erreur lors du téléchargement: ${error.message}`
          : "Erreur lors du téléchargement de l'image"
      );
    }
  },

  /**
   * Delete image from selection
   */
  async deleteImage(imageId: string): Promise<void> {
    await selectionImageRepository.delete(imageId);
  },

  /**
   * Download selected images in original format as ZIP
   */
  async downloadSelectedImages(selectionId: string): Promise<void> {
    const selectionWithImages = await this.getSelectionByProjectId(
      // We need to get project ID from selection ID
      (await this.getSelectionById(selectionId)).project_id
    );

    if (!selectionWithImages) {
      throw new Error("Sélection non trouvée");
    }

    // Filter only selected images
    const selectedImages = (selectionWithImages.images || []).filter(img => img.is_selected);

    if (selectedImages.length === 0) {
      throw new Error("Aucune image sélectionnée par le client");
    }

    // For now, download images one by one
    // In the future, we could implement a ZIP download service
    const toast = useToast();
    let downloadCount = 0;
    let errorCount = 0;

    toast.add({
      title: 'Téléchargement en cours',
      description: `Téléchargement de ${selectedImages.length} image(s) sélectionnée(s)...`,
      icon: 'i-lucide-download',
      color: 'info'
    });

    for (const image of selectedImages) {
      try {
        // Use source file for original format, fallback to converted file
        const fileUrl = image.source_file_url || image.file_url;
        const filename = image.source_filename || `selection_${image.id}.${image.source_format || 'jpg'}`;
        
        await this.downloadImage(fileUrl, filename, true);
        downloadCount++;
      } catch (error) {
        console.error(`Failed to download image ${image.id}:`, error);
        errorCount++;
      }
    }

    // Show final result
    if (errorCount === 0) {
      toast.add({
        title: 'Téléchargement terminé',
        description: `${downloadCount} image(s) téléchargée(s) avec succès`,
        icon: 'i-lucide-check-circle',
        color: 'success'
      });
    } else {
      toast.add({
        title: 'Téléchargement partiellement réussi',
        description: `${downloadCount} réussie(s), ${errorCount} échouée(s)`,
        icon: 'i-lucide-alert-triangle',
        color: 'warning'
      });
    }
  },

  /**
   * Retry conversion for failed images
   */
  async retryConversion(imageId: string): Promise<void> {
    // Update status to queued using repository
    await selectionImageRepository.updateConversionStatus([imageId], "queued");

    // Trigger conversion using conversion service
    const { conversionService } = await import("~/services/conversionService");
    await conversionService.convertImage(imageId);
  },

  /**
   * Trigger conversion for all pending RAW images in a selection
   */
  async convertSelectionImages(selectionId: string): Promise<void> {
    // Get images that need conversion from repository
    const rawImages =
      await selectionImageRepository.getImagesRequiringConversion(selectionId, [
        "pending",
        "failed",
      ]);

    if (!rawImages || rawImages.length === 0) {
      throw new Error("Aucune image à convertir trouvée");
    }

    // Update status to queued
    const imageIds = rawImages.map((img) => img.id);
    await selectionImageRepository.updateConversionStatus(imageIds, "queued");

    // Trigger conversion using conversion service
    const { conversionService } = await import("~/services/conversionService");
    const response = await conversionService.convertImages(imageIds);

    if (response.summary.failed > 0) {
      throw new Error(
        `${response.summary.failed} conversion(s) ont échoué sur ${response.summary.total}`
      );
    }
  },

  // toggleImageSelection removed - selections are now handled client-side until validation

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

  /**
   * Subscribe to real-time updates for selection images
   */
  subscribeToSelectionImages(
    selectionId: string,
    callback: (
      payload: import("~/types/selection").SelectionImageRealtimePayload
    ) => void
  ) {
    return selectionImageRepository.subscribeToSelectionImages(
      selectionId,
      callback
    );
  },
};
