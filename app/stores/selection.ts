import { defineStore } from "pinia";
import { selectionService } from "~/services/selectionService";
import type {
  SelectionFormData,
  SelectionWithDetails,
} from "~/types/selection";

export const useSelectionStore = defineStore("selection", () => {
  const selection = ref<SelectionWithDetails | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const showForm = ref(false);
  const formLoading = ref(false);

  // Getters
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);
  const exists = computed(() => selection.value !== null);
  const canEdit = computed(
    () =>
      !selection.value ||
      selection.value.status === "draft" ||
      selection.value.status === "revision_requested"
  );
  const imageCount = computed(() => selection.value?.imageCount || 0);
  const selectedCount = computed(() => selection.value?.selectedCount || 0);
  const hasImages = computed(() => imageCount.value > 0);
  const formattedExtraMediaPrice = computed(() => {
    if (!selection.value?.extra_media_price) return null;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(selection.value.extra_media_price / 100);
  });

  // Actions
  const reset = () => {
    selection.value = null;
    loading.value = false;
    error.value = null;
    showForm.value = false;
    formLoading.value = false;
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
      };

      const result = await selectionService.createSelection(
        data,
        selectionData.status === "awaiting_client"
      );
      selection.value = result.selection;

      // Upload images if provided
      if (selectedFiles && selectedFiles.length > 0) {
        const uploadedImages = await selectionService.uploadImages(
          result.selection.id,
          selectedFiles
        );
        // Update selection directly with new images instead of reloading
        const existingImages = selection.value?.images || [];
        selection.value = {
          ...selection.value!,
          images: [...existingImages, ...uploadedImages],
          imageCount: existingImages.length + uploadedImages.length,
        };
      }

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
      };

      const result = await selectionService.updateSelection(
        selectionId,
        data,
        selectionData.status === "awaiting_client"
      );
      selection.value = result.selection;

      // Upload images if provided
      if (selectedFiles && selectedFiles.length > 0) {
        const uploadedImages = await selectionService.uploadImages(
          result.selection.id,
          selectedFiles
        );
        // Update selection directly with new images instead of reloading
        const existingImages = selection.value?.images || [];
        selection.value = {
          ...selection.value!,
          images: [...existingImages, ...uploadedImages],
          imageCount: existingImages.length + uploadedImages.length,
        };
      }

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
    reset,
    loadSelection,
    createSelection,
    updateSelection,
    deleteSelection,
    deleteImage,
    openForm: () => (showForm.value = true),
    closeForm: () => (showForm.value = false),
  };
});
