import { moodboardService } from "~/services/moodboardService";
import type {
  Moodboard,
  MoodboardFormData,
  MoodboardWithDetails,
} from "~/types/moodboard";

export const useMoodboard = (projectId: string) => {
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const moodboard = ref<MoodboardWithDetails | null>(null);

  // Computed properties
  const isEditMode = computed(() => !!moodboard.value);
  const imageCount = computed(() => moodboard.value?.imageCount || 0);
  const hasImages = computed(() => imageCount.value > 0);

  // Fetch moodboard for project
  const fetchMoodboard = async () => {
    if (!projectId) return null;

    loading.value = true;
    error.value = null;

    try {
      const data = await moodboardService.getMoodboardByProjectId(projectId);
      moodboard.value = data;
      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch moodboard");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Save moodboard (create or update) with support for direct Moodboard object
  const saveMoodboard = async (data: MoodboardFormData | Moodboard) => {
    loading.value = true;
    error.value = null;

    try {
      let result;

      // Handle direct Moodboard object (from form submission)
      if ("id" in data && data.id && isEditMode.value) {
        // Update existing moodboard using direct Moodboard data
        result = await moodboardService.updateMoodboard(data.id, {
          title: data.title,
          description: data.description,
          status: data.status,
        });

        // Update local state
        moodboard.value = {
          ...moodboard.value!,
          ...result.moodboard,
        };
      } else if (isEditMode.value && moodboard.value) {
        // Update existing moodboard using form data
        const formData = data as MoodboardFormData;
        result = await moodboardService.updateMoodboard(moodboard.value.id, {
          title: formData.title,
          description: formData.description,
          status: formData.status,
        });

        // Update local state
        moodboard.value = {
          ...moodboard.value,
          ...result.moodboard,
        };
      } else {
        // Create new moodboard
        const formData = data as MoodboardFormData;
        result = await moodboardService.createMoodboard({
          project_id: projectId,
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
        });

        // Fetch the complete moodboard data
        await fetchMoodboard();
      }

      return result;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to save moodboard");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete moodboard
  const deleteMoodboard = async () => {
    if (!moodboard.value) return;

    loading.value = true;
    error.value = null;

    try {
      await moodboardService.deleteMoodboard(moodboard.value.id);
      moodboard.value = null;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete moodboard");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Upload images to moodboard
  const uploadImages = async (files: File[]) => {
    if (!moodboard.value) {
      throw new Error("Aucun moodboard trouvé");
    }

    loading.value = true;
    error.value = null;

    try {
      const uploadedImages = await moodboardService.uploadImages(
        moodboard.value.id,
        files
      );

      // Refresh moodboard data to get updated images
      await fetchMoodboard();

      return uploadedImages;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to upload images");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete image from moodboard
  const deleteImage = async (imageId: string) => {
    loading.value = true;
    error.value = null;

    try {
      await moodboardService.deleteImage(imageId);
      // Refresh moodboard data to get updated images
      await fetchMoodboard();
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete image");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    moodboard: readonly(moodboard),

    // Computed
    isEditMode,
    imageCount,
    hasImages,

    // Actions
    fetchMoodboard,
    saveMoodboard,
    deleteMoodboard,
    uploadImages,
    deleteImage,
  };
};
