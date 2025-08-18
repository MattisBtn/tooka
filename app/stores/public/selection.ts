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
  const currentPage = ref(1);
  const totalImages = ref(0);
  const pageSize = ref(20);

  // Image signed URLs management
  const imageSignedUrls = ref<Map<string, string>>(new Map());

  // Selected images tracking
  const selectedImages = ref<Set<string>>(new Set());

  // Auth state - use composable for persistence
  const auth = ref<ReturnType<typeof useClientAuth> | null>(null);

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

  const selectedCount = computed(() => selectedImages.value.size);

  const maxAllowed = computed(() => {
    return selection.value?.max_media_selection || Infinity;
  });

  const extraCount = computed(() => {
    if (maxAllowed.value === Infinity) return 0;
    return Math.max(0, selectedCount.value - maxAllowed.value);
  });

  const extraPrice = computed(() => {
    if (!selection.value?.extra_media_price || extraCount.value === 0) return 0;
    return extraCount.value * selection.value.extra_media_price;
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
    error.value = null;
    currentPage.value = 1;
    totalImages.value = 0;
    imageSignedUrls.value.clear();
    selectedImages.value.clear();
    auth.value = null;
  };

  const loadSelection = async (id: string) => {
    if (loading.value) return;

    selectionId.value = id;
    loading.value = true;
    error.value = null;

    initializeAuth();

    try {
      const response = await $fetch<ClientSelectionAccess>(
        `/api/selection/client/${id}`,
        { query: { page: 1, pageSize: 20 } }
      );

      project.value = response.project;
      selection.value = response.selection;
      images.value = [...(response.selection.images || [])];
      currentPage.value = 1;
      totalImages.value = response.selection.imageCount || 0;

      // Store signed URLs
      imageSignedUrls.value.clear();
      (response.selection.images || []).forEach((image) => {
        if (image.signed_url) {
          imageSignedUrls.value.set(image.file_url, image.signed_url);
        }
      });

      // Initialize selected images
      selectedImages.value.clear();
      (response.selection.images || []).forEach((image) => {
        if (image.userSelected) {
          selectedImages.value.add(image.id);
        }
      });

      if (response.project.hasPassword && auth.value) {
        auth.value.initializeAuth();
      }
    } catch (err) {
      let errorMessage = "Erreur lors du chargement";

      if (err instanceof Error) {
        if (err.message.includes("404") || err.message.includes("not found")) {
          errorMessage = "Sélection non trouvée";
        } else if (
          err.message.includes("403") ||
          err.message.includes("forbidden")
        ) {
          errorMessage = "Sélection non accessible";
        } else if (
          err.message.includes("401") ||
          err.message.includes("unauthorized")
        ) {
          errorMessage = "Accès non autorisé";
        } else if (
          err.message.includes("500") ||
          err.message.includes("server")
        ) {
          errorMessage = "Erreur serveur";
        }
      }

      error.value = new Error(errorMessage);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadPage = async (page: number) => {
    if (loading.value || !selectionId.value) return;

    loading.value = true;

    try {
      const response = await $fetch<ClientSelectionAccess>(
        `/api/selection/client/${selectionId.value}`,
        {
          query: { page, pageSize: pageSize.value },
        }
      );

      // Update all properties atomically
      images.value = [...(response.selection.images || [])];
      currentPage.value = page;
      totalImages.value = response.selection.imageCount || 0;

      // Store signed URLs for new images
      imageSignedUrls.value.clear();
      (response.selection.images || []).forEach((image) => {
        if (image.signed_url) {
          imageSignedUrls.value.set(image.file_url, image.signed_url);
        }
      });

      // Synchronize new images selections
      (response.selection.images || []).forEach((image) => {
        if (image.userSelected) {
          selectedImages.value.add(image.id);
        }
      });
    } catch (err) {
      console.error("Failed to load page:", err);
    } finally {
      loading.value = false;
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

  const toggleImageSelection = async (imageId: string) => {
    if (!canInteract.value) return;

    // Toggle selection locally only
    if (selectedImages.value.has(imageId)) {
      selectedImages.value.delete(imageId);
    } else {
      selectedImages.value.add(imageId);
    }

    // Update local image state
    const imageIndex = images.value.findIndex((img) => img.id === imageId);
    if (imageIndex !== -1 && images.value[imageIndex]) {
      images.value[imageIndex].userSelected = selectedImages.value.has(imageId);
      // Trigger reactivity
      images.value = [...images.value];
    }
  };

  const validateSelectionWithImages = async () => {
    if (!selectionId.value || !canInteract.value) return false;

    try {
      const selectedImageIds = Array.from(selectedImages.value);

      const response = await $fetch<{ success: boolean; selection: any }>(
        `/api/selection/client/${selectionId.value}/validate`,
        {
          method: "POST",
          body: { selectedImages: selectedImageIds },
        }
      );

      if (response.success) {
        // Update selection status to completed
        updateSelectionStatus("completed");

        // Update images to reflect server state
        images.value = images.value.map((img) => ({
          ...img,
          userSelected: selectedImageIds.includes(img.id),
        }));

        return true;
      }

      return false;
    } catch (err) {
      console.error("Failed to validate selection:", err);
      return false;
    }
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
    selectionId: readonly(selectionId),
    project: readonly(project),
    selection: readonly(selection),
    images: readonly(images),
    loading: readonly(loading),
    error: readonly(error),
    currentPage: readonly(currentPage),
    totalImages: readonly(totalImages),
    pageSize: readonly(pageSize),
    imageSignedUrls: readonly(imageSignedUrls),
    selectedImages: readonly(selectedImages),

    // Auth
    isAuthenticated,
    authError,
    needsPassword,
    verifyPassword,
    logout,

    // Computed
    canInteract,
    selectedCount,
    maxAllowed,
    extraCount,
    extraPrice,

    // Actions
    reset,
    loadSelection,
    loadPage,
    toggleImageSelection,
    validateSelectionWithImages,
    updateSelectionStatus,
    updateSelectionRevisionComment,
    getImageSignedUrl,
  };
});
