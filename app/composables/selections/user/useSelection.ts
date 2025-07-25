import type { ComputedRef, Ref } from "vue";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { selectionService } from "~/services/selectionService";
import type {
  SelectionFormData,
  SelectionImage,
  SelectionImageRealtimePayload,
  SelectionWithDetails,
} from "~/types/selection";

// Utility function to calculate conversion summary
export const useConversionSummary = (
  images:
    | Ref<readonly SelectionImage[] | undefined>
    | ComputedRef<readonly SelectionImage[] | undefined>
) => {
  return computed(() => {
    if (!images.value) {
      return { total: 0, completed: 0, processing: 0, pending: 0, failed: 0 };
    }

    const summary = {
      total: 0,
      completed: 0,
      processing: 0,
      pending: 0,
      failed: 0,
    };

    images.value.forEach((image) => {
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
  });
};

export const useSelection = (projectId: string) => {
  // State
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const selection = ref<SelectionWithDetails | null>(null);
  const isInitialized = ref(false);

  // Realtime subscription
  let realtimeSubscription: {
    unsubscribe: () => Promise<"ok" | "timed out" | "error">;
  } | null = null;

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

  // Conversion status tracking
  const conversionSummary = useConversionSummary(
    computed(() => selection.value?.images)
  );

  const hasConversionsInProgress = computed(() => {
    return (
      conversionSummary.value.processing > 0 ||
      conversionSummary.value.pending > 0
    );
  });

  const canPerformActions = computed(() => {
    return !loading.value && !hasConversionsInProgress.value;
  });

  // Format extra media price
  const formattedExtraMediaPrice = computed(() => {
    if (!extraMediaPrice.value) return null;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(extraMediaPrice.value);
  });

  // Real-time subscription management
  const manageRealtimeSubscription = async (selectionId?: string) => {
    // Cleanup existing subscription
    if (realtimeSubscription) {
      await realtimeSubscription.unsubscribe();
      realtimeSubscription = null;
    }

    // Setup new subscription if selectionId provided
    if (selectionId) {
      realtimeSubscription = selectionService.subscribeToSelectionImages(
        selectionId,
        handleRealtimeUpdate
      );
    }
  };

  const handleRealtimeUpdate = (payload: SelectionImageRealtimePayload) => {
    if (!selection.value?.images) return;

    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case "INSERT": {
        // Add new image to local state
        const currentImages = Array.from(selection.value.images);
        currentImages.push(newRecord);
        selection.value = {
          ...selection.value,
          images: currentImages,
          imageCount: (selection.value.imageCount || 0) + 1,
        };
        break;
      }

      case "UPDATE": {
        // Update existing image in local state
        const currentImages = Array.from(selection.value.images);
        const imageIndex = currentImages.findIndex(
          (img) => img.id === newRecord.id
        );
        if (imageIndex !== -1) {
          currentImages[imageIndex] = newRecord;

          // Calculate selected count change
          let selectedCountChange = 0;
          if (oldRecord.is_selected !== newRecord.is_selected) {
            selectedCountChange = newRecord.is_selected ? 1 : -1;
          }

          selection.value = {
            ...selection.value,
            images: currentImages,
            selectedCount: Math.max(
              0,
              (selection.value.selectedCount || 0) + selectedCountChange
            ),
          };
        }
        break;
      }

      case "DELETE": {
        // Remove image from local state
        const currentImages = Array.from(selection.value.images);
        const filteredImages = currentImages.filter(
          (img) => img.id !== oldRecord.id
        );

        selection.value = {
          ...selection.value,
          images: filteredImages,
          imageCount: Math.max(0, (selection.value.imageCount || 0) - 1),
          selectedCount: oldRecord.is_selected
            ? Math.max(0, (selection.value.selectedCount || 0) - 1)
            : selection.value.selectedCount || 0,
        };
        break;
      }
    }
  };

  // Methods
  const fetchSelection = async () => {
    if (loading.value) return; // Prevent concurrent fetches

    loading.value = true;
    error.value = null;

    try {
      const data = await selectionService.getSelectionByProjectId(projectId);
      selection.value = data;
      isInitialized.value = true;

      // Setup realtime subscription if selection exists
      await manageRealtimeSubscription(data?.id);
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Unknown error");
      console.error("Error fetching selection:", err);
    } finally {
      loading.value = false;
    }
  };

  // Ensure data is loaded only when needed
  const ensureInitialized = async () => {
    if (!isInitialized.value) {
      await fetchSelection();
    }
  };

  const saveSelection = async (
    selectionData: SelectionFormData,
    projectUpdated: boolean = false
  ) => {
    loading.value = true;
    error.value = null;

    try {
      let result;
      if (selection.value) {
        // Update existing selection
        result = await selectionService.updateSelection(
          selection.value.id,
          selectionData,
          projectUpdated
        );
      } else {
        // Create new selection
        result = await selectionService.createSelection(
          {
            project_id: projectId,
            ...selectionData,
            extra_media_price: selectionData.extra_media_price ?? null,
          },
          projectUpdated
        );
      }

      // Refresh selection data
      await fetchSelection();

      return result;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Unknown error");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const uploadImages = async (files: File[], selectionId?: string) => {
    const targetSelectionId = selectionId || selection.value?.id;

    if (!targetSelectionId) {
      throw new Error("No selection found");
    }

    loading.value = true;
    error.value = null;

    try {
      const uploadedImages = await selectionService.uploadImages(
        targetSelectionId,
        files
      );

      // Note: Real-time subscription will automatically update local state
      // No need to manually refresh selection data

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
      // Real-time subscription will update local state automatically
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
      await manageRealtimeSubscription(); // Cleanup realtime subscription
      await selectionService.deleteSelection(selection.value.id);
      selection.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Unknown error");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const downloadImage = async (
    filePath: string,
    filename?: string,
    forceDownload = true
  ) => {
    try {
      await selectionService.downloadImage(filePath, filename, forceDownload);
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Unknown error");
      throw err;
    }
  };

  const retryConversion = async (imageId: string) => {
    try {
      await selectionService.retryConversion(imageId);
      // Real-time subscription will update the conversion status
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Unknown error");
      throw err;
    }
  };

  const convertAllImages = async () => {
    if (!selection.value) {
      throw new Error("No selection found");
    }

    try {
      await selectionService.convertSelectionImages(selection.value.id);
      // Real-time subscription will update the conversion statuses
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Unknown error");
      throw err;
    }
  };

  const getStatusOptions = () => {
    return selectionService.getStatusOptions();
  };

  // Lifecycle hooks - Remove automatic fetch on mount
  onMounted(() => {
    // Don't fetch automatically - let parent components control when to load
    // This prevents redundant calls when multiple watchers are involved
  });

  onUnmounted(() => {
    manageRealtimeSubscription(); // Cleanup realtime subscription on unmount
  });

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    selection: readonly(selection),
    isInitialized: readonly(isInitialized),

    // Computed
    imageCount,
    selectedCount,
    hasImages,
    hasSelectedImages,
    maxMediaSelection,
    extraMediaPrice,
    formattedExtraMediaPrice,
    conversionSummary,
    hasConversionsInProgress,
    canPerformActions,

    // Methods
    fetchSelection,
    ensureInitialized, // New method for controlled initialization
    saveSelection,
    uploadImages,
    deleteImage,
    deleteSelection,
    downloadImage,
    retryConversion,
    convertAllImages,
    getStatusOptions,
  };
};
