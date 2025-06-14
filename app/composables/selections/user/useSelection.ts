import { computed, ref } from "vue";
import { selectionService } from "~/services/selectionService";
import type {
  SelectionFormData,
  SelectionWithDetails,
} from "~/types/selection";

export const useSelection = (projectId: string) => {
  // State
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const selection = ref<SelectionWithDetails | null>(null);

  // Computed
  const imageCount = computed(() => selection.value?.imageCount || 0);
  const selectedCount = computed(() => selection.value?.selectedCount || 0);
  const hasImages = computed(() => imageCount.value > 0);
  const hasSelectedImages = computed(() => selectedCount.value > 0);
  const maxMediaSelection = computed(
    () => selection.value?.max_media_selection || 0
  );
  const extraMediaPrice = computed(
    () => selection.value?.extra_media_price || 0
  );

  // Format extra media price
  const formattedExtraMediaPrice = computed(() => {
    if (!extraMediaPrice.value) return null;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(extraMediaPrice.value);
  });

  // Methods
  const fetchSelection = async () => {
    loading.value = true;
    error.value = null;

    try {
      const data = await selectionService.getSelectionByProjectId(projectId);
      selection.value = data;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Unknown error");
      console.error("Error fetching selection:", err);
    } finally {
      loading.value = false;
    }
  };

  const saveSelection = async (
    selectionData: SelectionFormData,
    projectUpdated: boolean = false
  ) => {
    loading.value = true;
    error.value = null;

    try {
      if (selection.value) {
        // Update existing selection
        const result = await selectionService.updateSelection(
          selection.value.id,
          selectionData,
          projectUpdated
        );

        // Refresh selection data
        await fetchSelection();

        return result;
      } else {
        // Create new selection
        const result = await selectionService.createSelection(
          {
            project_id: projectId,
            ...selectionData,
            extra_media_price: selectionData.extra_media_price ?? null,
          },
          projectUpdated
        );

        // Refresh selection data
        await fetchSelection();

        return result;
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Unknown error");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const uploadImages = async (files: File[]) => {
    if (!selection.value) {
      throw new Error("No selection found");
    }

    loading.value = true;
    error.value = null;

    try {
      const uploadedImages = await selectionService.uploadImages(
        selection.value.id,
        files
      );

      // Refresh selection data to get updated image count
      await fetchSelection();

      return uploadedImages;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Unknown error");
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

      // Refresh selection data
      await fetchSelection();
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Unknown error");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const toggleImageSelection = async (imageId: string, selected: boolean) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await selectionService.toggleImageSelection(
        imageId,
        selected
      );

      // Refresh selection data to get updated counts
      await fetchSelection();

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Unknown error");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteSelection = async () => {
    if (!selection.value) {
      throw new Error("No selection found");
    }

    loading.value = true;
    error.value = null;

    try {
      await selectionService.deleteSelection(selection.value.id);
      selection.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Unknown error");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getStatusOptions = () => {
    return selectionService.getStatusOptions();
  };

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    selection: readonly(selection),

    // Computed
    imageCount,
    selectedCount,
    hasImages,
    hasSelectedImages,
    maxMediaSelection,
    extraMediaPrice,
    formattedExtraMediaPrice,

    // Methods
    fetchSelection,
    saveSelection,
    uploadImages,
    deleteImage,
    toggleImageSelection,
    deleteSelection,
    getStatusOptions,
  };
};
