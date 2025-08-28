import { selectionImageRepository } from "~/repositories/selectionImageRepository";
import { selectionRepository } from "~/repositories/selectionRepository";
import type {
  Selection,
  SelectionImage,
  SelectionWithDetails,
} from "~/types/selection";
import { uploadConfig } from "~/utils/uploadConfig";

// Types for progress callbacks
type ProgressCallback = (
  filename: string,
  status: "uploading" | "uploaded" | "converting" | "converted" | "failed"
) => void;
type CountCallback = (type: "upload" | "converted" | "failed") => void;

export const selectionService = {
  /**
   * Get selection by project ID with only selected images (for performance)
   */
  async getSelectionByProjectId(
    projectId: string
  ): Promise<SelectionWithDetails | null> {
    const { selection, images } = await selectionRepository.findByProjectId(
      projectId
    );

    if (!selection) {
      return null;
    }

    // Only return selected images for performance
    const selectedImages = images.filter((img) => img.is_selected);
    const selectedCount = selectedImages.length;

    const result = {
      ...selection,
      images: selectedImages,
      imageCount: images.length, // Total count
      selectedCount,
    };

    return result;
  },

  /**
   * Get all images for a selection with pagination
   */
  async getSelectionImagesWithPagination(
    selectionId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    images: SelectionImage[];
    totalCount: number;
    hasMore: boolean;
    currentPage: number;
  }> {
    const offset = (page - 1) * limit;

    const { images, totalCount } =
      await selectionImageRepository.findBySelectionIdWithPagination(
        selectionId,
        limit,
        offset
      );

    const hasMore = offset + images.length < totalCount;

    return {
      images,
      totalCount,
      hasMore,
      currentPage: page,
    };
  },

  /**
   * Get only selected images for a selection
   */
  async getSelectedImages(selectionId: string): Promise<SelectionImage[]> {
    const { images } = await selectionImageRepository.findSelectedBySelectionId(
      selectionId
    );
    return images;
  },

  /**
   * Create new selection with validation and business rules
   */
  async createSelection(
    selectionData: Omit<Selection, "id" | "created_at" | "updated_at">
  ): Promise<{ selection: Selection; projectUpdated: boolean }> {
    if (
      selectionData.max_media_selection === undefined ||
      selectionData.max_media_selection === null ||
      (selectionData.max_media_selection !== -1 &&
        selectionData.max_media_selection < 1)
    ) {
      throw new Error(
        "Le nombre maximum de médias sélectionnables est requis (minimum 1 ou -1 pour illimité)"
      );
    }

    // Check if selection already exists for this project
    const existingSelection = await this.getSelectionByProjectId(
      selectionData.project_id
    );
    if (existingSelection) {
      throw new Error("Une sélection existe déjà pour ce projet");
    }

    // For creation, always save as draft
    const finalSelectionData = {
      ...selectionData,
      status: "draft" as const,
    };

    // Create selection
    const selection = await selectionRepository.create(finalSelectionData);

    // For creation, project is never updated automatically
    const projectUpdated = false;

    return { selection, projectUpdated };
  },

  /**
   * Update selection with business rules
   */
  async updateSelection(
    id: string,
    updates: Partial<Selection>
  ): Promise<{ selection: Selection; projectUpdated: boolean }> {
    // Update selection
    const selection = await selectionRepository.update(id, updates);

    // Project is considered updated when selection is sent to client
    const projectUpdated = updates.status === "awaiting_client";

    return { selection, projectUpdated };
  },

  /**
   * Delete selection with dependency checks
   */
  async deleteSelection(id: string): Promise<void> {
    const selection = await selectionRepository.findById(id);
    if (!selection) {
      throw new Error("Selection not found");
    }

    // Business rule: can only delete selections that are not completed or payment pending
    if (
      selection.status === "completed" ||
      selection.status === "payment_pending"
    ) {
      throw new Error(
        "Cannot delete selections that are payment pending or completed"
      );
    }

    // Delete selection
    await selectionRepository.delete(id);
  },

  /**
   * Upload images to selection
   */
  async uploadImages(
    selectionId: string,
    files: File[],
    onProgress?: ProgressCallback,
    onCount?: CountCallback
  ): Promise<SelectionImage[]> {
    const supabase = useSupabaseClient();
    const user = useSupabaseUser();

    const uploadedImages: SelectionImage[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        // Update progress: start uploading this file
        onProgress?.(file.name, "uploading");

        // Validate file type
        if (!file.type.startsWith("image/") && !this.isRawFormat(file.name)) {
          errors.push(`${file.name}: Type de fichier non supporté`);
          onProgress?.(file.name, "failed");
          onCount?.("failed");
          continue;
        }

        // Validate file size using config
        if (file.size > uploadConfig.selection.maxFileSize) {
          const maxSizeMB = uploadConfig.selection.maxFileSize / (1024 * 1024);
          errors.push(
            `${file.name}: Fichier trop volumineux (max ${maxSizeMB}MB)`
          );
          onProgress?.(file.name, "failed");
          onCount?.("failed");
          continue;
        }

        // Generate unique filename preserving original name
        const { fileName: _fileName, filePath } =
          await this.generateUniqueFilename(
            file.name,
            user.value!.id,
            selectionId
          );
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "";

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("selection-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          errors.push(`${file.name}: ${uploadError.message}`);
          onProgress?.(file.name, "failed");
          onCount?.("failed");
          continue;
        }

        // Mark as uploaded
        onProgress?.(file.name, "uploaded");
        onCount?.("upload");

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
          source_filename: file.name, // Store original filename for all files
          source_format: null,
          target_format: null,
        };

        const image = await selectionImageRepository.create(imageData);
        uploadedImages.push(image);

        // If RAW file, trigger conversion
        if (isRawFormat) {
          try {
            // Mark as converting
            onProgress?.(file.name, "converting");

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
              onProgress?.(file.name, "converted");
              onCount?.("converted");
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
            onProgress?.(file.name, "failed");
            onCount?.("failed");
          }
        } else {
          // For non-RAW files, mark as converted immediately
          onProgress?.(file.name, "converted");
          onCount?.("converted");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        errors.push(`${file.name}: ${errorMessage}`);
        onProgress?.(file.name, "failed");
        onCount?.("failed");
      }
    }

    if (errors.length > 0) {
      console.warn("Upload errors:", errors);
      // Note: We don't throw here to allow partial success
    }

    return uploadedImages;
  },

  /**
   * Check if file is RAW format using config
   */
  isRawFormat(filename: string): boolean {
    const rawFormats = uploadConfig.selection.rawFormats
      .split(",")
      .map((format) => format.trim().replace(".", "").toLowerCase());
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
        const signedUrl = await selectionImageRepository.getSignedUrl(
          filePath,
          3600
        );
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
   * Download selected images from selection as ZIP file
   */
  async downloadSelectedImagesAsZip(selectionId: string): Promise<void> {
    const selection = await selectionRepository.findById(selectionId);
    if (!selection) {
      throw new Error("Sélection non trouvée");
    }

    const selectionWithImages = await this.getSelectionByProjectId(
      selection.project_id
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

  /**
   * Clean filename by removing special characters and spaces
   */
  cleanFilename(filename: string): string {
    // Remove extension first
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

    // Clean special characters, keep only alphanumeric, hyphens, and underscores
    const cleanName = nameWithoutExt
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/_+/g, "_") // Replace multiple underscores with single
      .replace(/^_|_$/g, ""); // Remove leading/trailing underscores

    return cleanName || "image"; // Fallback if name becomes empty
  },

  /**
   * Check if file exists in storage
   */
  async checkFileExists(filePath: string): Promise<boolean> {
    const supabase = useSupabaseClient();

    try {
      const { data, error } = await supabase.storage
        .from("selection-images")
        .list(filePath.split("/").slice(0, -1).join("/"), {
          search: filePath.split("/").pop() || "",
        });

      if (error) {
        console.warn("Error checking file existence:", error);
        return false; // Assume file doesn't exist on error
      }

      return data && data.length > 0;
    } catch (error) {
      console.warn("Error checking file existence:", error);
      return false;
    }
  },

  /**
   * Generate unique filename preserving original name
   */
  async generateUniqueFilename(
    originalFilename: string,
    userId: string,
    selectionId: string
  ): Promise<{ fileName: string; filePath: string }> {
    const fileExt = originalFilename.split(".").pop()?.toLowerCase() || "";
    const cleanName = this.cleanFilename(originalFilename);

    let fileName = `${cleanName}.${fileExt}`;
    let filePath = `${userId}/selections/${selectionId}/${fileName}`;
    let counter = 1;

    // Check for conflicts and generate unique name
    while (await this.checkFileExists(filePath)) {
      fileName = `${cleanName}_${counter}.${fileExt}`;
      filePath = `${userId}/selections/${selectionId}/${fileName}`;
      counter++;

      // Safety check to prevent infinite loop
      if (counter > 50) {
        throw new Error("Too many files with similar names");
      }
    }

    return { fileName, filePath };
  },

  /**
   * Format selection limit for display
   */
  formatSelectionLimit(maxSelection: number): string {
    if (maxSelection === -1) {
      return "Illimitée";
    }
    return `${maxSelection} image${maxSelection > 1 ? "s" : ""} maximum`;
  },
};
