import { defineStore } from "pinia";
import type {
  ClientSelectionAccess,
  SelectionImageWithSelection,
} from "~/types/selection";

export const useClientSelectionStore = defineStore("clientSelection", () => {
  // Core state
  const selectionId = ref<string | null>(null);
  const project = ref<ClientSelectionAccess["project"] | null>(null);
  const selection = ref<ClientSelectionAccess["selection"] | null>(null);
  const images = ref<SelectionImageWithSelection[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const hasMore = ref(true);
  const currentPage = ref(1);
  const loadingMore = ref(false);

  // Auth state - use composable for persistence
  const auth = ref<ReturnType<typeof useClientAuth> | null>(null);

  // Selection state
  const selectedImages = ref<Set<string>>(new Set());
  const maxAllowed = ref<number>(Infinity);
  const extraPricePerImage = ref<number>(0);

  // Image signed URLs management
  const imageSignedUrls = ref<Map<string, string>>(new Map());

  // Computed
  const needsPassword = computed(
    () => project.value?.hasPassword && !isAuthenticated.value
  );

  const isAuthenticated = computed(() => {
    if (project.value && !project.value.hasPassword) {
      return true;
    }
    if (!auth.value) return false;
    return auth.value.isAuthenticated;
  });

  const authError = computed(() => {
    if (!auth.value) return null;
    return auth.value.authError;
  });

  const canInteract = computed(() => {
    if (!selection.value) return false;
    return (
      selection.value.status !== "completed" &&
      selection.value.status !== "revision_requested"
    );
  });

  // Selection calculations
  const selectedCount = computed(() => selectedImages.value.size);

  const extraCount = computed(() => {
    if (maxAllowed.value === Infinity) return 0;
    return Math.max(0, selectedCount.value - maxAllowed.value);
  });

  const extraPrice = computed(() => {
    return extraCount.value * extraPricePerImage.value;
  });

  // Initialize auth when selectionId changes
  const initializeAuth = () => {
    if (selectionId.value) {
      auth.value = useClientAuth("selection", selectionId.value);
      auth.value?.initializeAuth();
    }
  };

  // Actions
  const reset = () => {
    selectionId.value = null;
    project.value = null;
    selection.value = null;
    images.value = [];
    loading.value = false;
    loadingMore.value = false;
    error.value = null;
    hasMore.value = true;
    currentPage.value = 1;
    selectedImages.value.clear();
    maxAllowed.value = Infinity;
    extraPricePerImage.value = 0;
    auth.value = null;
  };

  const loadSelection = async (id: string, page = 1) => {
    if (loading.value) return;

    selectionId.value = id;
    loading.value = true;
    error.value = null;

    // Initialize auth
    initializeAuth();

    try {
      const response = await $fetch<ClientSelectionAccess>(
        `/api/selection/client/${id}`,
        {
          query: { page, pageSize: 50 },
        }
      );

      project.value = response.project;
      selection.value = response.selection;
      images.value = Array.from(response.selection.images || []);
      hasMore.value = response.selection.hasMore || false;
      currentPage.value = response.selection.currentPage || 1;

      // Store signed URLs
      imageSignedUrls.value.clear();
      if (response.selection.images) {
        response.selection.images.forEach((image) => {
          if (image.signed_url) {
            imageSignedUrls.value.set(image.file_url, image.signed_url);
          }
        });
      }

      // Set selection limits from project
      maxAllowed.value = response.project.maxImages ?? Infinity;
      extraPricePerImage.value = response.project.extraImagePrice ?? 0;

      // Synchronize server selections with local state
      selectedImages.value.clear();
      if (response.selection.images) {
        response.selection.images.forEach((image) => {
          if (image.userSelected) {
            selectedImages.value.add(image.id);
          }
        });
      }

      // Initialize auth for password-protected projects
      if (response.project.hasPassword && auth.value) {
        auth.value.initializeAuth();
      }

      return response;
    } catch (err) {
      if (err instanceof Error && err.message.includes("404")) {
        error.value = new Error("Sélection non trouvée");
      } else if (err instanceof Error && err.message.includes("403")) {
        error.value = new Error("Sélection non accessible");
      } else {
        error.value = new Error("Erreur lors du chargement");
      }
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadMore = async () => {
    // Protection against multiple simultaneous calls
    if (
      !hasMore.value ||
      !isAuthenticated.value ||
      !selectionId.value ||
      loadingMore.value
    ) {
      return false;
    }

    loadingMore.value = true;

    try {
      const nextPage = currentPage.value + 1;
      const response = await $fetch<ClientSelectionAccess>(
        `/api/selection/client/${selectionId.value}`,
        {
          query: { page: nextPage, pageSize: 20 },
        }
      );

      if (response.selection.images && response.selection.images.length > 0) {
        images.value = [...images.value, ...response.selection.images];
        hasMore.value = response.selection.hasMore || false;
        currentPage.value = nextPage;

        // Store signed URLs for new images
        response.selection.images.forEach((image) => {
          if (image.signed_url) {
            imageSignedUrls.value.set(image.file_url, image.signed_url);
          }
        });

        // Synchronize new images selections
        response.selection.images.forEach((image) => {
          if (image.userSelected) {
            selectedImages.value.add(image.id);
          }
        });

        return true;
      } else {
        hasMore.value = false;
        return false;
      }
    } catch (err) {
      console.error("Failed to load more images:", err);
      return false;
    } finally {
      loadingMore.value = false;
    }
  };

  const verifyPassword = async (password: string) => {
    if (!selectionId.value || !auth.value) return false;

    const serverVerify = async (pwd: string) => {
      const response = await $fetch<{ valid: boolean }>(
        `/api/selection/client/${selectionId.value}/verify`,
        {
          method: "POST",
          body: { password: pwd },
        }
      );
      return response.valid;
    };

    return await auth.value.verifyPassword(password, serverVerify);
  };

  const logout = () => {
    if (auth.value) {
      auth.value.logout();
    }
  };

  // Selection management
  const toggleImageSelection = (imageId: string) => {
    if (!canInteract.value) return;

    if (selectedImages.value.has(imageId)) {
      selectedImages.value.delete(imageId);
    } else {
      selectedImages.value.add(imageId);
    }
  };

  const isImageSelected = (imageId: string) => {
    return selectedImages.value.has(imageId);
  };

  const clearSelections = () => {
    selectedImages.value.clear();
  };

  const updateSelectionStatus = (
    status: "draft" | "awaiting_client" | "revision_requested" | "completed"
  ) => {
    if (selection.value) {
      selection.value.status = status;
    }
  };

  const updateSelectionRevisionComment = (comment: string) => {
    if (selection.value) {
      selection.value.revision_last_comment = comment;
    }
  };

  // Get signed URL for an image
  const getImageSignedUrl = (fileUrl: string) => {
    return imageSignedUrls.value.get(fileUrl) || null;
  };

  return {
    // State
    selectionId: selectionId,
    project: project,
    selection: selection,
    images: images,
    loading: loading,
    loadingMore: loadingMore,
    error: error,
    hasMore: hasMore,
    currentPage: currentPage,
    isAuthenticated,
    authError,

    // Selection state
    selectedImages: selectedImages,
    maxAllowed: maxAllowed,
    extraPricePerImage: extraPricePerImage,
    imageSignedUrls: imageSignedUrls,

    // Computed
    needsPassword,
    canInteract,
    selectedCount,
    extraCount,
    extraPrice,

    // Actions
    reset,
    loadSelection,
    loadMore,
    verifyPassword,
    logout,
    toggleImageSelection,
    isImageSelected,
    clearSelections,
    updateSelectionStatus,
    updateSelectionRevisionComment,
    getImageSignedUrl,
  };
});
