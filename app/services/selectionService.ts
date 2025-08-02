import { selectionImageRepository } from "~/repositories/selectionImageRepository";
import { selectionRepository } from "~/repositories/selectionRepository";
import type {
  IPagination,
  ISelectionFilters,
  Selection,
  SelectionImage,
  SelectionWithDetails,
} from "~/types/selection";

// Simple cache to avoid redundant API calls
const selectionCache = new Map<
  string,
  { data: SelectionWithDetails | null; timestamp: number }
>();
const CACHE_DURATION = 5000; // 5 seconds cache

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
        payment_pending: 3,
        completed: 4,
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
   * Get selection by project ID with images - with simple caching
   */
  async getSelectionByProjectId(
    projectId: string
  ): Promise<SelectionWithDetails | null> {
    if (!projectId?.trim()) {
      throw new Error("Project ID is required");
    }

    // Check cache first
    const cached = selectionCache.get(projectId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const selection = await selectionRepository.findByProjectId(projectId);

    if (!selection) {
      // Cache the null result
      selectionCache.set(projectId, { data: null, timestamp: Date.now() });
      return null;
    }

    // Get images
    const images = await selectionImageRepository.findBySelectionId(
      selection.id
    );

    // Count selected images
    const selectedCount = images.filter((img) => img.is_selected).length;

    const result = {
      ...selection,
      images,
      imageCount: images.length,
      selectedCount,
    };

    // Cache the result
    selectionCache.set(projectId, { data: result, timestamp: Date.now() });

    return result;
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

    // Clear cache for this project
    selectionCache.delete(selectionData.project_id);

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
  ): Promise<{ selection: SelectionWithDetails; projectUpdated: boolean }> {
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

    // Get images for the updated selection
    const images = await selectionImageRepository.findBySelectionId(id);

    // Count selected images
    const selectedCount = images.filter((img) => img.is_selected).length;

    // Return selection with details
    const selectionWithDetails: SelectionWithDetails = {
      ...selection,
      images,
      imageCount: images.length,
      selectedCount,
    };

    // Clear cache for this project
    selectionCache.delete(existingSelection.project_id);

    // Project is considered updated when selection is sent to client
    const projectUpdated = finalUpdates.status === "awaiting_client";

    return { selection: selectionWithDetails, projectUpdated };
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

    // Clear cache for this project
    selectionCache.delete(selection.project_id);
  },

  /**
   * Upload images to selection
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

    const uploadedImages: SelectionImage[] = [];
    const errors: string[] = [];

    // Import store for progress tracking
    const { useSelectionStore } = await import("~/stores/selection");
    const selectionStore = useSelectionStore();

    for (const file of files) {
      try {
        // Update progress: start uploading this file
        selectionStore.updateFileProgress(file.name, "uploading");

        // Validate file type
        if (!file.type.startsWith("image/") && !this.isRawFormat(file.name)) {
          errors.push(`${file.name}: Type de fichier non supporté`);
          selectionStore.updateFileProgress(file.name, "failed");
          selectionStore.incrementFailedCount();
          continue;
        }

        // Validate file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
          errors.push(`${file.name}: Fichier trop volumineux (max 100MB)`);
          selectionStore.updateFileProgress(file.name, "failed");
          selectionStore.incrementFailedCount();
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `${user.value.id}/selections/${selectionId}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("selection-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          errors.push(`${file.name}: ${uploadError.message}`);
          selectionStore.updateFileProgress(file.name, "failed");
          selectionStore.incrementFailedCount();
          continue;
        }

        // Mark as uploaded
        selectionStore.updateFileProgress(file.name, "uploaded");
        selectionStore.incrementUploadCount();

        // Check if file is RAW format
        const isRawFormat = this.isRawFormat(file.name);

        // Create database record
        const imageData = {
          selection_id: selectionId,
          file_url: filePath,
          is_selected: false,
          conversion_status: null,
          requires_conversion: false,
          source_file_url: null,
          source_filename: null,
          source_format: null,
          target_format: null,
        };

        const image = await selectionImageRepository.create(imageData);
        uploadedImages.push(image);

        // If RAW file, trigger conversion
        if (isRawFormat) {
          try {
            // Mark as converting
            selectionStore.updateFileProgress(file.name, "converting");

            // Generate signed URL for the RAW file
            const { data: signedUrlData } = await supabase.storage
              .from("selection-images")
              .createSignedUrl(filePath, 60); // 60 seconds for conversion

            if (signedUrlData?.signedUrl) {
              // Convert RAW to JPEG
              const conversionResult = await this.convertRawToJpeg(
                signedUrlData.signedUrl,
                filePath,
                selectionId
              );

              // Update the image record with conversion info
              const updatedImage = await selectionImageRepository.update(
                image.id,
                {
                  file_url: conversionResult.jpegFilePath, // Use JPEG as main file
                  source_file_url: filePath, // Keep RAW as source
                  source_filename: file.name,
                  source_format: fileExt.toUpperCase(),
                  target_format: "JPEG",
                  requires_conversion: true,
                  conversion_status: "completed",
                }
              );

              // Update the uploaded image in the array
              const index = uploadedImages.findIndex(
                (img) => img.id === image.id
              );
              if (index !== -1) {
                uploadedImages[index] = updatedImage;
              }

              // Mark as converted
              selectionStore.updateFileProgress(file.name, "converted");
              selectionStore.incrementConvertedCount();
            }
          } catch (conversionError) {
            console.error(
              `Conversion failed for ${file.name}:`,
              conversionError
            );
            // Don't fail the upload, just log the conversion error
            errors.push(
              `${file.name}: Conversion échouée (fichier RAW conservé)`
            );
            selectionStore.updateFileProgress(file.name, "failed");
            selectionStore.incrementFailedCount();
          }
        } else {
          // For non-RAW files, mark as converted immediately
          selectionStore.updateFileProgress(file.name, "converted");
          selectionStore.incrementConvertedCount();
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        errors.push(`${file.name}: ${errorMessage}`);
        selectionStore.updateFileProgress(file.name, "failed");
        selectionStore.incrementFailedCount();
      }
    }

    if (errors.length > 0) {
      console.warn("Upload errors:", errors);
      // Note: We don't throw here to allow partial success
    }

    return uploadedImages;
  },

  /**
   * Check if file is RAW format
   */
  isRawFormat(filename: string): boolean {
    const rawFormats = ["nef", "dng", "raw", "cr2", "arw"];
    const fileExt = filename.split(".").pop()?.toLowerCase() || "";
    return rawFormats.includes(fileExt);
  },

  /**
   * Convert RAW file to JPEG using external conversion service
   */
  async convertRawToJpeg(
    rawFileUrl: string,
    rawFilePath: string,
    selectionId: string
  ): Promise<{
    rawUrl: string;
    jpegUrl: string;
    rawFilePath: string;
    jpegFilePath: string;
  }> {
    const response = await $fetch("/api/selection/convert", {
      method: "POST",
      body: {
        rawFileUrl,
        rawFilePath,
        selectionId,
      },
    });

    return response;
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
      (
        await this.getSelectionById(selectionId)
      ).project_id
    );

    if (!selectionWithImages) {
      throw new Error("Sélection non trouvée");
    }

    // Filter only selected images
    const selectedImages = (selectionWithImages.images || []).filter(
      (img) => img.is_selected
    );

    if (selectedImages.length === 0) {
      throw new Error("Aucune image sélectionnée par le client");
    }

    // For now, download images one by one
    // In the future, we could implement a ZIP download service
    const toast = useToast();
    let downloadCount = 0;
    let errorCount = 0;

    toast.add({
      title: "Téléchargement en cours",
      description: `Téléchargement de ${selectedImages.length} image(s) sélectionnée(s)...`,
      icon: "i-lucide-download",
      color: "info",
    });

    for (const image of selectedImages) {
      try {
        // Use source file for original format, fallback to converted file
        const fileUrl = image.source_file_url || image.file_url;
        const filename =
          image.source_filename ||
          `selection_${image.id}.${image.source_format || "jpg"}`;

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
        title: "Téléchargement terminé",
        description: `${downloadCount} image(s) téléchargée(s) avec succès`,
        icon: "i-lucide-check-circle",
        color: "success",
      });
    } else {
      toast.add({
        title: "Téléchargement partiellement réussi",
        description: `${downloadCount} réussie(s), ${errorCount} échouée(s)`,
        icon: "i-lucide-alert-triangle",
        color: "warning",
      });
    }
  },

  /**
   * Download selected images from selection as ZIP file
   */
  async downloadSelectedImagesAsZip(selectionId: string): Promise<void> {
    const selectionWithImages = await this.getSelectionByProjectId(
      (
        await this.getSelectionById(selectionId)
      ).project_id
    );

    if (!selectionWithImages) {
      throw new Error("Sélection non trouvée");
    }

    // Filter only selected images
    const selectedImages = (selectionWithImages.images || []).filter(
      (img) => img.is_selected
    );

    if (selectedImages.length === 0) {
      throw new Error("Aucune image sélectionnée par le client");
    }

    try {
      // Import JSZip dynamically
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      let processedCount = 0;
      let errorCount = 0;

      // Process images in batches to avoid memory issues
      const batchSize = 5;
      for (let i = 0; i < selectedImages.length; i += batchSize) {
        const batch = selectedImages.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (image) => {
            try {
              // Get the appropriate file URL (original if available, otherwise converted)
              const fileUrl = image.source_file_url || image.file_url;
              const fileFormat = image.source_format || "jpg";
              const originalFilename =
                image.source_filename ||
                image.file_url?.split("/").pop() ||
                `image_${image.id}`;

              // Generate a clean filename
              const cleanFilename = this.generateCleanFilename(
                originalFilename,
                fileFormat,
                image.id
              );

              // Download the file as blob
              const blob = await selectionImageRepository.downloadImageBlob(
                fileUrl
              );

              // Add to ZIP with proper filename
              zip.file(cleanFilename, blob);

              processedCount++;
            } catch (error) {
              console.error(`Failed to process image ${image.id}:`, error);
              errorCount++;
            }
          })
        );
      }

      if (processedCount === 0) {
        throw new Error("Aucune image n'a pu être traitée");
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `selection_${selectionId}_selected_${
        new Date().toISOString().split("T")[0]
      }.zip`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(url);

      // Show success message
      const toast = useToast();
      toast.add({
        title: "ZIP téléchargé",
        description: `${processedCount} image(s) sélectionnée(s) dans le ZIP${
          errorCount > 0 ? `, ${errorCount} échouée(s)` : ""
        }`,
        icon: "i-lucide-check-circle",
        color: "success",
      });
    } catch (error) {
      console.error("ZIP creation failed:", error);
      const toast = useToast();
      toast.add({
        title: "Erreur de création du ZIP",
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de la création du ZIP",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
      throw error;
    }
  },

  /**
   * Generate clean filename for ZIP
   */
  generateCleanFilename(
    originalFilename: string,
    format: string,
    imageId: string
  ): string {
    // Remove extension and clean the filename
    const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, "");
    const cleanName = nameWithoutExt
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    // Ensure unique filename with proper extension
    const extension = format.toLowerCase();
    return `${cleanName || `image_${imageId}`}.${extension}`;
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
