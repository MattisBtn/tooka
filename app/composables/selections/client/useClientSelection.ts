import type {
  ClientSelectionAccess,
  SelectionImage,
  SelectionImageWithSelection,
} from "~/types/selection";

export const useClientSelection = async (selectionId: string) => {
  const loading = ref(true);
  const loadingMore = ref(false);
  const error = ref<Error | null>(null);
  const selectionData = ref<ClientSelectionAccess | null>(null);
  const images = ref<SelectionImageWithSelection[]>([]);
  const hasMore = ref(true);
  const currentPage = ref(1);

  // Use simplified auth
  const auth = useClientAuth("selection", selectionId);

  // User selections management with localStorage
  const USER_SELECTIONS_KEY = `selection_user_selections_${selectionId}`;

  const getUserSelections = (): Record<string, boolean> => {
    if (!import.meta.client) return {};
    try {
      const stored = localStorage.getItem(USER_SELECTIONS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveUserSelection = (imageId: string, selected: boolean) => {
    if (!import.meta.client) return;
    try {
      const selections = getUserSelections();
      if (selected) {
        selections[imageId] = true;
      } else {
        // Remove selection by creating new object without this key
        const { [imageId]: _, ...newSelections } = selections;
        localStorage.setItem(
          USER_SELECTIONS_KEY,
          JSON.stringify(newSelections)
        );
        return;
      }
      localStorage.setItem(USER_SELECTIONS_KEY, JSON.stringify(selections));
    } catch {
      // Ignore storage errors
    }
  };

  const getUserSelection = (imageId: string): boolean => {
    const selections = getUserSelections();
    return selections[imageId] || false;
  };

  // Initial fetch of selection data
  const {
    data,
    pending,
    error: fetchError,
  } = await useFetch<ClientSelectionAccess>(
    `/api/selection/client/${selectionId}`,
    {
      query: { page: 1, pageSize: 20 },
      key: `selection-client-${selectionId}`,
      server: false,
      onResponseError({ response }) {
        if (response.status === 404) {
          error.value = new Error("Sélection non trouvée");
        } else if (response.status === 403) {
          error.value = new Error("Sélection non accessible");
        } else {
          error.value = new Error("Erreur lors du chargement");
        }
      },
    }
  );

  // Computed properties
  const project = computed(() => data.value?.project || null);
  const selection = computed(() => data.value?.selection || null);

  // Simple logic: if no password required, always authenticated
  const isAuthenticated = computed(() => {
    return !project.value?.hasPassword || auth.isAuthenticated.value;
  });

  const needsPassword = computed(() => {
    return project.value?.hasPassword && !auth.isAuthenticated.value;
  });

  // Check if user can interact with selection
  const canInteract = computed(() => {
    if (!selection.value) return false;
    return (
      selection.value.status !== "completed" &&
      selection.value.status !== "revision_requested"
    );
  });

  // Calculate selection counts and pricing
  const selectedCount = computed(() => {
    return images.value.filter((image) => image.userSelected).length;
  });

  const maxAllowed = computed(() => {
    const limit = selection.value?.max_media_selection || 0;
    return limit === -1 ? Infinity : limit; // -1 means unlimited
  });

  const extraCount = computed(() => {
    if (maxAllowed.value === Infinity) return 0; // No extra count for unlimited selection
    return Math.max(0, selectedCount.value - maxAllowed.value);
  });

  const extraPrice = computed(() => {
    if (!selection.value?.extra_media_price || maxAllowed.value === Infinity)
      return 0;
    return extraCount.value * selection.value.extra_media_price;
  });

  const canSelectMore = computed(() => {
    if (maxAllowed.value === Infinity) return canInteract.value; // Unlimited selection
    return canInteract.value && selectedCount.value < maxAllowed.value;
  });

  // Helper function to enhance images with user selections
  const enhanceImagesWithSelections = (
    imagesList: readonly SelectionImage[],
    selectionStatus?: string
  ): SelectionImageWithSelection[] => {
    const currentStatus = selectionStatus || selection.value?.status;

    return imagesList.map((image) => ({
      ...image,
      // For completed/revision_requested selections, use database state
      // For draft/awaiting_client, prioritize localStorage over database
      userSelected:
        currentStatus === "completed" || currentStatus === "revision_requested"
          ? image.is_selected // Use database state for finalized selections
          : getUserSelection(image.id) || image.is_selected, // Use localStorage first, fallback to database
    }));
  };

  // Watch for data changes and update state
  watch(
    data,
    (newData) => {
      if (newData) {
        selectionData.value = newData;

        // Clear localStorage if selection is finalized (to avoid conflicts with DB state)
        if (
          newData.selection.status === "completed" ||
          newData.selection.status === "revision_requested"
        ) {
          if (import.meta.client) {
            localStorage.removeItem(USER_SELECTIONS_KEY);
          }
        }

        if (newData.selection.images && newData.selection.images.length > 0) {
          const enhancedImages = enhanceImagesWithSelections(
            Array.from(newData.selection.images),
            newData.selection.status
          );
          images.value = enhancedImages;
        } else {
          images.value = [];
        }

        hasMore.value = newData.selection.hasMore || false;
        currentPage.value = newData.selection.currentPage || 1;
      }

      // Initialize auth for password-protected projects
      if (newData?.project.hasPassword) {
        auth.initializeAuth();
      }
    },
    { immediate: true }
  );

  if (fetchError.value) {
    error.value = fetchError.value;
  }

  loading.value = pending.value;

  // Load more images for infinite scroll
  const loadMore = async () => {
    if (loadingMore.value || !hasMore.value || !isAuthenticated.value) return;

    try {
      loadingMore.value = true;
      const nextPage = currentPage.value + 1;

      const response = await $fetch<ClientSelectionAccess>(
        `/api/selection/client/${selectionId}`,
        {
          query: { page: nextPage, pageSize: 20 },
        }
      );

      if (response.selection.images && response.selection.images.length > 0) {
        // Update selection status first in case it changed
        if (response.selection) {
          selectionData.value = {
            ...selectionData.value!,
            selection: response.selection,
          };
        }

        const enhancedNewImages = enhanceImagesWithSelections(
          Array.from(response.selection.images),
          response.selection.status
        );

        images.value = [...images.value, ...enhancedNewImages];
        hasMore.value = response.selection.hasMore || false;
        currentPage.value = nextPage;
      }
    } catch (err) {
      console.error("Failed to load more images:", err);
    } finally {
      loadingMore.value = false;
    }
  };

  // Password verification
  const verifyPassword = async (password: string) => {
    const serverVerify = async (pwd: string) => {
      const verificationResult = await $fetch<{ valid: boolean }>(
        `/api/selection/client/${selectionId}/verify`,
        {
          method: "POST",
          body: { password: pwd },
        }
      );
      return verificationResult.valid;
    };

    return await auth.verifyPassword(password, serverVerify);
  };

  // Action states
  const validatingSelection = ref(false);
  const requestingRevisions = ref(false);

  // Modal states
  const showValidateDialog = ref(false);
  const showRequestRevisionsDialog = ref(false);

  // Form state
  const revisionComment = ref("");

  // Toggle image selection (client-side only)
  const toggleImageSelection = async (imageId: string) => {
    if (!canInteract.value) return;

    const imageIndex = images.value.findIndex((img) => img.id === imageId);
    if (imageIndex === -1) return;

    const currentlySelected = images.value[imageIndex]!.userSelected;
    const newSelectedState = !currentlySelected;

    // Update UI and localStorage immediately (no HTTP request)
    images.value[imageIndex]!.userSelected = newSelectedState;
    saveUserSelection(imageId, newSelectedState);
  };

  // Client action methods
  const validateSelection = async () => {
    if (!selection.value) return;

    try {
      validatingSelection.value = true;

      // Get current user selections
      const userSelections = getUserSelections();
      const selectedImageIds = Object.keys(userSelections).filter(
        (id) => userSelections[id]
      );

      await $fetch(`/api/selection/client/${selection.value.id}/validate`, {
        method: "POST",
        body: { selectedImages: selectedImageIds },
      });

      await reloadNuxtApp();
    } catch (error) {
      console.error("Failed to validate selection:", error);
      const toast = useToast();
      toast.add({
        title: "Erreur",
        description: "Impossible de valider la sélection",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
    } finally {
      validatingSelection.value = false;
      showValidateDialog.value = false;
    }
  };

  const requestRevisions = async () => {
    if (!selection.value) return;

    try {
      requestingRevisions.value = true;
      await $fetch(
        `/api/selection/client/${selection.value.id}/request-revisions`,
        {
          method: "POST",
          body: { comment: revisionComment.value },
        }
      );
      await reloadNuxtApp();
    } catch (error) {
      console.error("Failed to request revisions:", error);
      const toast = useToast();
      toast.add({
        title: "Erreur",
        description: "Impossible de demander des révisions",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
    } finally {
      requestingRevisions.value = false;
      showRequestRevisionsDialog.value = false;
      revisionComment.value = "";
    }
  };

  return {
    // State
    project: readonly(project),
    selection: readonly(selection),
    images: readonly(images),
    loading: readonly(loading),
    loadingMore: readonly(loadingMore),
    error: readonly(error),
    isAuthenticated,
    authError: auth.authError,
    hasMore: readonly(hasMore),
    canInteract: readonly(canInteract),

    // Selection calculations
    selectedCount: readonly(selectedCount),
    maxAllowed: readonly(maxAllowed),
    extraCount: readonly(extraCount),
    extraPrice: readonly(extraPrice),
    canSelectMore: readonly(canSelectMore),

    // Action states
    validatingSelection: readonly(validatingSelection),
    requestingRevisions: readonly(requestingRevisions),

    // Modal states
    showValidateDialog,
    showRequestRevisionsDialog,

    // Form state
    revisionComment,

    // Computed
    needsPassword,

    // Actions
    verifyPassword,
    loadMore,
    toggleImageSelection,
    validateSelection,
    requestRevisions,

    // Auth methods
    logout: auth.logout,
  };
};
