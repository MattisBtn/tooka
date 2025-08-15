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
    return selection.value?.maxAllowed || Infinity;
  });

  const extraCount = computed(() => {
    if (maxAllowed.value === Infinity) return 0;
    return Math.max(0, selectedCount.value - maxAllowed.value);
  });

  const extraPrice = computed(() => {
    if (!selection.value?.extraImagePrice || extraCount.value === 0) return 0;
    return extraCount.value * selection.value.extraImagePrice;
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

    try {
      const response = await $fetch<{ selected: boolean }>(
        `/api/selection/client/${selectionId.value}/toggle-selection`,
        {
          method: "POST",
          body: { imageId },
        }
      );

      if (response.selected) {
        selectedImages.value.add(imageId);
      } else {
        selectedImages.value.delete(imageId);
      }

      // Update local image state
      const imageIndex = images.value.findIndex((img) => img.id === imageId);
      if (imageIndex !== -1) {
        images.value[imageIndex].userSelected = response.selected;
        // Trigger reactivity
        images.value = [...images.value];
      }
    } catch (err) {
      console.error("Failed to toggle image selection:", err);
    }
  };

  const updateSelectionStatus = (
    status:
      | "draft"
      | "awaiting_client"
      | "revision_requested"
      | "completed"
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
    updateSelectionStatus,
    updateSelectionRevisionComment,
    getImageSignedUrl,
  };
});
