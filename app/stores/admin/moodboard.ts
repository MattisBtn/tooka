import { defineStore } from "pinia";
import { moodboardService } from "~/services/moodboardService";
import type {
  MoodboardFormData,
  MoodboardImage,
  MoodboardUploadResult,
  MoodboardWithDetails,
} from "~/types/moodboard";
import type { UploadOptions, UploadProgress } from "~/types/upload";

export const useMoodboardStore = defineStore("moodboard", () => {
  // Core State
  const moodboard = ref<MoodboardWithDetails | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const showForm = ref(false);
  const formLoading = ref(false);

  // Upload State
  const uploadProgress = ref<UploadProgress>({
    isUploading: false,
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
    cancelledFiles: 0,
    currentFiles: [],
    overallProgress: 0,
    canCancel: false,
  });
  const uploadController = ref<AbortController | null>(null);
  const showUploadProgress = ref(false);

  // Getters
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);
  const exists = computed(() => moodboard.value !== null);
  const canEdit = computed(
    () =>
      !moodboard.value ||
      moodboard.value.status === "draft" ||
      moodboard.value.status === "revision_requested"
  );
  const imageCount = computed(() => moodboard.value?.imageCount || 0);
  const hasImages = computed(() => imageCount.value > 0);

  // Upload Actions
  const resetUploadState = () => {
    uploadProgress.value = {
      isUploading: false,
      totalFiles: 0,
      completedFiles: 0,
      failedFiles: 0,
      cancelledFiles: 0,
      currentFiles: [],
      overallProgress: 0,
      canCancel: false,
    };
    uploadController.value = null;
    showUploadProgress.value = false;
  };

  const updateUploadProgress = (progress: UploadProgress) => {
    uploadProgress.value = {
      ...progress,
      currentFiles: [...progress.currentFiles], // Create a mutable copy
    };
  };

  const startUpload = () => {
    uploadController.value = new AbortController();
    showUploadProgress.value = true;
  };

  const finishUpload = () => {
    uploadController.value = null;
    showUploadProgress.value = false;
  };

  const uploadImagesWithProgress = async (
    moodboardId: string,
    files: File[]
  ): Promise<MoodboardUploadResult> => {
    if (!files.length) {
      throw new Error("Aucun fichier à uploader");
    }

    try {
      startUpload();
      resetUploadState();

      const { moodboardService } = await import("~/services/moodboardService");

      const options: UploadOptions = {
        maxConcurrent: 4,
        maxRetries: 2,
        onProgress: updateUploadProgress,
        signal: uploadController.value?.signal,
      };

      const result = await moodboardService.uploadImagesWithProgress(
        moodboardId,
        files,
        options
      );

      return result;
    } finally {
      finishUpload();
    }
  };

  // Actions
  const reset = () => {
    moodboard.value = null;
    loading.value = false;
    error.value = null;
    showForm.value = false;
    formLoading.value = false;
    resetUploadState();
  };

  const loadMoodboard = async (projectId: string) => {
    if (loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const data = await moodboardService.getMoodboardByProjectId(projectId);
      moodboard.value = data;
      return data;
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        moodboard.value = null;
        return null;
      }
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch moodboard");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createMoodboard = async (
    projectId: string,
    moodboardData: MoodboardFormData,
    selectedFiles?: File[]
  ) => {
    formLoading.value = true;
    error.value = null;

    try {
      const data = {
        project_id: projectId,
        title: moodboardData.title,
        description: moodboardData.description || null,
        status: moodboardData.status,
        revision_last_comment: null,
      };

      const result = await moodboardService.createMoodboard(data);

      // Upload images if provided with progress tracking
      let uploadedImages: MoodboardImage[] = [];
      if (selectedFiles && selectedFiles.length > 0) {
        const uploadResult = await uploadImagesWithProgress(
          result.moodboard.id,
          selectedFiles
        );
        uploadedImages = uploadResult.uploadedImages;
      }

      // Update moodboard state directly with images instead of reloading
      moodboard.value = {
        ...result.moodboard,
        images: uploadedImages,
        imageCount: uploadedImages.length,
      };

      // Project status will be updated automatically when needed

      showForm.value = false;
      return result.moodboard;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to create moodboard");
      throw err;
    } finally {
      formLoading.value = false;
    }
  };

  const updateMoodboard = async (
    moodboardId: string,
    moodboardData: MoodboardFormData,
    selectedFiles?: File[]
  ) => {
    formLoading.value = true;
    error.value = null;

    try {
      const data = {
        project_id: moodboard.value!.project_id,
        title: moodboardData.title,
        description: moodboardData.description || null,
        status: moodboardData.status,
        revision_last_comment: null,
      };

      const result = await moodboardService.updateMoodboard(moodboardId, data);

      // Upload images if provided with progress tracking
      let uploadedImages: MoodboardImage[] = [];
      if (selectedFiles && selectedFiles.length > 0) {
        const uploadResult = await uploadImagesWithProgress(
          result.moodboard.id,
          selectedFiles
        );
        uploadedImages = uploadResult.uploadedImages;
      }

      // Update moodboard state directly with new images
      moodboard.value = {
        ...result.moodboard,
        images: [...(result.moodboard.images || []), ...uploadedImages],
        imageCount:
          (result.moodboard.images?.length || 0) + uploadedImages.length,
      };

      // Project status will be updated automatically when needed

      showForm.value = false;
      return result.moodboard;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to update moodboard");
      throw err;
    } finally {
      formLoading.value = false;
    }
  };

  const deleteMoodboard = async (moodboardId: string) => {
    loading.value = true;
    error.value = null;

    try {
      await moodboardService.deleteMoodboard(moodboardId);
      moodboard.value = null;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete moodboard");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteImage = async (imageId: string) => {
    loading.value = true;
    error.value = null;

    try {
      await moodboardService.deleteImage(imageId);
      // Update moodboard directly instead of reloading
      if (moodboard.value) {
        const updatedImages = (moodboard.value.images || []).filter(
          (img) => img.id !== imageId
        );
        moodboard.value = {
          ...moodboard.value,
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

  const deleteAllImages = async () => {
    if (!moodboard.value?.images || moodboard.value.images.length === 0) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      await moodboardService.deleteAllImages(moodboard.value.id);

      // Clear images from moodboard
      if (moodboard.value) {
        moodboard.value = {
          ...moodboard.value,
          images: [],
          imageCount: 0,
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

  const sendToClient = async (moodboardId: string) => {
    loading.value = true;
    error.value = null;

    try {
      const { moodboardService } = await import("~/services/moodboardService");
      const result = await moodboardService.updateMoodboard(moodboardId, {
        status: "awaiting_client",
      });
      moodboard.value = result.moodboard;

      return {
        moodboard: result.moodboard,
        projectUpdated: result.projectUpdated,
      };
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to send to client");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State (readonly for external access)
    moodboard: readonly(moodboard),
    loading: readonly(loading),
    error: readonly(error),
    showForm,
    formLoading: readonly(formLoading),

    // Upload State
    uploadProgress: readonly(uploadProgress),
    showUploadProgress: readonly(showUploadProgress),

    // Computed
    isLoading,
    hasError,
    exists,
    canEdit,
    imageCount,
    hasImages,

    // Actions
    reset,
    loadMoodboard,
    createMoodboard,
    updateMoodboard,
    deleteMoodboard,
    deleteImage,
    deleteAllImages,
    sendToClient,
    openForm: () => (showForm.value = true),
    closeForm: () => (showForm.value = false),

    // Upload Actions
    resetUploadState,
    startUpload,
    finishUpload,
    uploadImagesWithProgress,
  };
});
