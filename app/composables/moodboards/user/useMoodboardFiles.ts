import { moodboardService } from "~/services/moodboardService";

export const useMoodboardFiles = () => {
  const loading = ref(false);
  const error = ref<Error | null>(null);

  // Delete image
  const deleteImage = async (imageId: string) => {
    loading.value = true;
    error.value = null;

    try {
      await moodboardService.deleteImage(imageId);
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete image");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Update image caption
  const updateCaption = async (imageId: string, caption: string | null) => {
    loading.value = true;
    error.value = null;

    try {
      await moodboardService.updateImageCaption(imageId, caption);
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to update caption");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    deleteImage,
    updateCaption,
  };
};
