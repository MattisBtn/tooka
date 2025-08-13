import { defineStore } from "pinia";
import { selectionService } from "~/services/selectionService";
import { MODULE_STATUS } from "~/types/status";
import type {
  SelectionFormData,
  SelectionImage,
  SelectionWithDetails,
} from "~/types/selection";

// Utility function to calculate conversion summary
export const useConversionSummary = (images: SelectionImage[]) => {
  const summary = {
    total: 0,
    completed: 0,
    processing: 0,
    pending: 0,
    failed: 0,
  };

  images.forEach((image) => {
    if (image.requires_conversion) {
      summary.total++;
      switch (image.conversion_status) {
        case "completed":
          summary.completed++;
          break;
        case "processing":
        case "queued":
          summary.processing++;
          break;
        case "pending":
          summary.pending++;
          break;
        case "failed":
          summary.failed++;
          break;
      }
    }
  });

  return summary;
};

export const useSelectionStore = defineStore("selection", () => {
  const selection = ref<SelectionWithDetails | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const showForm = ref(false);
  const formLoading = ref(false);
  const backgroundUploading = ref(false);
  const isDownloadingZip = ref(false);

  // Upload progress tracking
  const uploadProgress = ref({
    isActive: false,
    totalFiles: 0,
    uploadedFiles: 0,
    convertedFiles: 0,
    failedFiles: 0,
    currentStep: "idle" as "idle" | "uploading" | "converting" | "completed",
    fileProgress: [] as Array<{
      filename: string;
      status:
        | "pending"
        | "uploading"
        | "uploaded"
        | "converting"
        | "converted"
        | "failed";
      progress: number;
    }>,
  });

  // Getters
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);
  const exists = computed(() => selection.value !== null);
  const canEdit = computed(
    () =>
      !selection.value ||
      selection.value.status === MODULE_STATUS.DRAFT ||
      selection.value.status === MODULE_STATUS.REVISION_REQUESTED
  );
  const imageCount = computed(() => selection.value?.imageCount || 0);
  const selectedCount = computed(() => selection.value?.selectedCount || 0);
  const hasImages = computed(() => imageCount.value > 0);
  const formattedExtraMediaPrice = computed(() => {
    if (!selection.value?.extra_media_price) return null;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(selection.value.extra_media_price);
  });

  // Format selection limit for display
  const formattedSelectionLimit = computed(() => {
    if (!selection.value?.max_media_selection) return "Non défini";
    return selectionService.formatSelectionLimit(
      selection.value.max_media_selection
    );
  });

  // Check if selection has unlimited selection
  const hasUnlimitedSelection = computed(() => {
    return selection.value?.max_media_selection === -1;
  });

  // Conversion summary
  const conversionSummary = computed(() => {
    if (!selection.value?.images)
      return { total: 0, completed: 0, processing: 0, pending: 0, failed: 0 };
    return useConversionSummary(Array.from(selection.value.images));
  });

  const hasConversionsInProgress = computed(() => {
    return (
      conversionSummary.value.processing > 0 ||
      conversionSummary.value.pending > 0
    );
  });

  const canPerformActions = computed(() => {
    return !loading.value && !hasConversionsInProgress.value;
  });

  // Upload progress computed
  const uploadProgressPercentage = computed(() => {
    if (!uploadProgress.value.isActive || uploadProgress.value.totalFiles === 0)
      return 0;

    const totalOperations = uploadProgress.value.totalFiles * 2; // Upload + Conversion par fichier
    const completedOperations =
      uploadProgress.value.uploadedFiles + uploadProgress.value.convertedFiles;

    return Math.round((completedOperations / totalOperations) * 100);
  });

  const uploadProgressSteps = computed(() => [
    "Préparation...",
    "Upload en cours...",
    "Conversion en cours...",
    "Terminé!",
  ]);

  const currentProgressStep = computed(() => {
    switch (uploadProgress.value.currentStep) {
      case "idle":
        return 0;
      case "uploading":
        return 1;
      case "converting":
        return 2;
      case "completed":
        return 3;
      default:
        return 0;
    }
  });

  // Actions
  const reset = () => {
    selection.value = null;
    loading.value = false;
    error.value = null;
    showForm.value = false;
    formLoading.value = false;
    resetUploadProgress();
  };

  const resetUploadProgress = () => {
    uploadProgress.value = {
      isActive: false,
      totalFiles: 0,
      uploadedFiles: 0,
      convertedFiles: 0,
      failedFiles: 0,
      currentStep: "idle",
      fileProgress: [],
    };
  };

  const initializeUploadProgress = (files: File[]) => {
    uploadProgress.value = {
      isActive: true,
      totalFiles: files.length,
      uploadedFiles: 0,
      convertedFiles: 0,
      failedFiles: 0,
      currentStep: "uploading",
      fileProgress: files.map((file) => ({
        filename: file.name,
        status: "pending",
        progress: 0,
      })),
    };
  };

  const updateFileProgress = (
    filename: string,
    status: (typeof uploadProgress.value.fileProgress)[0]["status"],
    progress: number = 0
  ) => {
    const fileIndex = uploadProgress.value.fileProgress.findIndex(
      (f) => f.filename === filename
    );
    if (fileIndex !== -1) {
      uploadProgress.value.fileProgress[fileIndex]!.status = status;
      uploadProgress.value.fileProgress[fileIndex]!.progress = progress;
    }
  };

  const incrementUploadCount = () => {
    uploadProgress.value.uploadedFiles++;
    if (
      uploadProgress.value.uploadedFiles === uploadProgress.value.totalFiles
    ) {
      uploadProgress.value.currentStep = "converting";
    }
  };

  const incrementConvertedCount = () => {
    uploadProgress.value.convertedFiles++;
    if (
      uploadProgress.value.convertedFiles === uploadProgress.value.totalFiles
    ) {
      uploadProgress.value.currentStep = "completed";
      // Auto-hide après 2 secondes
      setTimeout(() => {
        resetUploadProgress();
      }, 2000);
    }
  };

  const incrementFailedCount = () => {
    uploadProgress.value.failedFiles++;
  };

  const downloadSelectedImagesAsZip = async () => {
    if (!selection.value?.id) {
      throw new Error("Aucune sélection disponible");
    }

    isDownloadingZip.value = true;

    try {
      const { selectionService } = await import("~/services/selectionService");
      await selectionService.downloadSelectedImagesAsZip(selection.value.id);
    } catch (error) {
      console.error("ZIP download failed:", error);
      throw error;
    } finally {
      isDownloadingZip.value = false;
    }
  };

  const loadSelection = async (projectId: string) => {
    if (loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const data = await selectionService.getSelectionByProjectId(projectId);
      selection.value = data;
      return data;
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        selection.value = null;
        return null;
      }
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch selection");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createSelection = async (
    projectId: string,
    selectionData: SelectionFormData,
    selectedFiles?: File[]
  ) => {
    formLoading.value = true;
    error.value = null;

    try {
      const data = {
        project_id: projectId,
        max_media_selection: selectionData.max_media_selection,
        extra_media_price: selectionData.extra_media_price || null,
        status: selectionData.status,
        revision_last_comment: null,
      };

      const result = await selectionService.createSelection(
        data,
        selectionData.status === MODULE_STATUS.AWAITING_CLIENT
      );
      selection.value = result.selection;

      // Upload images if provided
      if (selectedFiles && selectedFiles.length > 0) {
        initializeUploadProgress(selectedFiles);
        handleBackgroundUpload(result.selection.id, selectedFiles);
      }

      // Check and update project status automatically
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();
      await projectSetupStore.checkAndUpdateProjectStatus();

      showForm.value = false;
      return result.selection;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to create selection");
      throw err;
    } finally {
      formLoading.value = false;
    }
  };

  const updateSelection = async (
    selectionId: string,
    selectionData: SelectionFormData,
    selectedFiles?: File[]
  ) => {
    formLoading.value = true;
    error.value = null;

    try {
      const data = {
        project_id: selection.value!.project_id,
        max_media_selection: selectionData.max_media_selection,
        extra_media_price: selectionData.extra_media_price || null,
        status: selectionData.status,
        revision_last_comment: null,
      };

      const result = await selectionService.updateSelection(
        selectionId,
        data,
        selectionData.status === MODULE_STATUS.AWAITING_CLIENT
      );
      selection.value = result.selection;

      // Upload images if provided
      if (selectedFiles && selectedFiles.length > 0) {
        initializeUploadProgress(selectedFiles);
        handleBackgroundUpload(result.selection.id, selectedFiles);
      }

      // Check and update project status automatically
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();
      await projectSetupStore.checkAndUpdateProjectStatus();

      showForm.value = false;
      return result.selection;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to update selection");
      throw err;
    } finally {
      formLoading.value = false;
    }
  };

  const handleBackgroundUpload = async (selectionId: string, files: File[]) => {
    backgroundUploading.value = true;

    try {
      for (const file of files) {
        updateFileProgress(file.name, "uploading");
      }

      const uploadedImages = await selectionService.uploadImages(
        selectionId,
        files
      );

      // Mettre à jour la sélection avec les nouvelles images
      const existingImages = selection.value?.images || [];
      selection.value = {
        ...selection.value!,
        images: [...existingImages, ...uploadedImages],
        imageCount: existingImages.length + uploadedImages.length,
      };
    } catch (error) {
      console.error("Background upload failed:", error);
      // Marquer les fichiers comme échoués
      files.forEach((file) => {
        updateFileProgress(file.name, "failed");
        incrementFailedCount();
      });
    } finally {
      backgroundUploading.value = false;
    }
  };

  const deleteSelection = async (selectionId: string) => {
    loading.value = true;
    error.value = null;

    try {
      await selectionService.deleteSelection(selectionId);
      selection.value = null;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete selection");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteImage = async (imageId: string) => {
    loading.value = true;
    error.value = null;

    try {
      await selectionService.deleteImage(imageId);
      // Update selection directly instead of reloading
      if (selection.value) {
        const updatedImages = (selection.value.images || []).filter(
          (img) => img.id !== imageId
        );
        selection.value = {
          ...selection.value,
          images: updatedImages,
          imageCount: updatedImages.length,
        };
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete image");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const downloadImage = async (
    filePath: string,
    filename?: string,
    forceDownload: boolean = true
  ) => {
    try {
      await selectionService.downloadImage(filePath, filename, forceDownload);
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to download image");
      throw err;
    }
  };

  const deleteAllImages = async () => {
    if (!selection.value?.images || selection.value.images.length === 0) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      // Delete all images in parallel
      const deletePromises = selection.value.images.map((img) =>
        selectionService.deleteImage(img.id)
      );
      await Promise.all(deletePromises);

      // Clear images from selection
      if (selection.value) {
        selection.value = {
          ...selection.value,
          images: [],
          imageCount: 0,
          selectedCount: 0,
        };
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete all images");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    selection: readonly(selection),
    loading: readonly(loading),
    error: readonly(error),
    showForm,
    formLoading: readonly(formLoading),
    isLoading,
    hasError,
    exists,
    canEdit,
    imageCount,
    selectedCount,
    hasImages,
    formattedExtraMediaPrice,
    formattedSelectionLimit,
    hasUnlimitedSelection,
    conversionSummary,
    hasConversionsInProgress,
    canPerformActions,
    reset,
    loadSelection,
    createSelection,
    updateSelection,
    deleteSelection,
    deleteImage,
    downloadImage,
    deleteAllImages,
    openForm: () => (showForm.value = true),
    closeForm: () => (showForm.value = false),
    backgroundUploading: readonly(backgroundUploading),
    isDownloadingZip: readonly(isDownloadingZip),
    uploadProgress: readonly(uploadProgress),
    uploadProgressPercentage,
    uploadProgressSteps,
    currentProgressStep,
    initializeUploadProgress,
    updateFileProgress,
    incrementUploadCount,
    incrementConvertedCount,
    incrementFailedCount,
    downloadSelectedImagesAsZip,
    handleBackgroundUpload,
  };
});
