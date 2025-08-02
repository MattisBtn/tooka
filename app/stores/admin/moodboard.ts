import { defineStore } from "pinia";
import { moodboardService } from "~/services/moodboardService";
import type {
  MoodboardFormData,
  MoodboardWithDetails,
} from "~/types/moodboard";

export const useMoodboardStore = defineStore("moodboard", () => {
  const moodboard = ref<MoodboardWithDetails | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const showForm = ref(false);
  const formLoading = ref(false);

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

  // Actions
  const reset = () => {
    moodboard.value = null;
    loading.value = false;
    error.value = null;
    showForm.value = false;
    formLoading.value = false;
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
      };

      const result = await moodboardService.createMoodboard(
        data,
        moodboardData.status === "awaiting_client"
      );
      moodboard.value = result.moodboard;

      // Upload images if provided
      if (selectedFiles && selectedFiles.length > 0) {
        const uploadedImages = await moodboardService.uploadImages(
          result.moodboard.id,
          selectedFiles
        );
        // Update moodboard directly with new images instead of reloading
        moodboard.value = {
          ...moodboard.value!,
          images: uploadedImages,
          imageCount: uploadedImages.length,
        };
      }

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
      };

      const result = await moodboardService.updateMoodboard(
        moodboardId,
        data,
        moodboardData.status === "awaiting_client"
      );
      moodboard.value = result.moodboard;

      // Upload images if provided
      if (selectedFiles && selectedFiles.length > 0) {
        const uploadedImages = await moodboardService.uploadImages(
          result.moodboard.id,
          selectedFiles
        );
        // Update moodboard directly with new images instead of reloading
        const existingImages = moodboard.value?.images || [];
        moodboard.value = {
          ...moodboard.value!,
          images: [...existingImages, ...uploadedImages],
          imageCount: existingImages.length + uploadedImages.length,
        };
      }

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

  return {
    moodboard: readonly(moodboard),
    loading: readonly(loading),
    error: readonly(error),
    showForm,
    formLoading: readonly(formLoading),
    isLoading,
    hasError,
    exists,
    canEdit,
    imageCount,
    hasImages,
    reset,
    loadMoodboard,
    createMoodboard,
    updateMoodboard,
    deleteMoodboard,
    deleteImage,
    openForm: () => (showForm.value = true),
    closeForm: () => (showForm.value = false),
  };
});
