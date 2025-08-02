import { defineStore } from "pinia";
import type {
  ClientMoodboardAccess,
  MoodboardImageWithInteractions,
} from "~/types/moodboard";

export const useClientMoodboardStore = defineStore("clientMoodboard", () => {
  // Core state
  const moodboardId = ref<string | null>(null);
  const project = ref<ClientMoodboardAccess["project"] | null>(null);
  const moodboard = ref<ClientMoodboardAccess["moodboard"] | null>(null);
  const images = ref<MoodboardImageWithInteractions[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const hasMore = ref(true);
  const currentPage = ref(1);
  const loadingMore = ref(false); // Separate loading state for pagination

  // Auth state - use composable for persistence
  const auth = ref<ReturnType<typeof useClientAuth> | null>(null);

  // Computed
  const needsPassword = computed(
    () => project.value?.hasPassword && !isAuthenticated.value
  );

  const isAuthenticated = computed(() => {
    if (!auth.value) return false;
    return auth.value.isAuthenticated;
  });

  const authError = computed(() => {
    if (!auth.value) return null;
    return auth.value.authError;
  });

  const canInteract = computed(() => {
    if (!moodboard.value) return false;
    return (
      moodboard.value.status !== "completed" &&
      moodboard.value.status !== "revision_requested"
    );
  });

  // Initialize auth when moodboardId changes
  const initializeAuth = () => {
    if (moodboardId.value) {
      auth.value = useClientAuth("moodboard", moodboardId.value);
      auth.value?.initializeAuth();
    }
  };

  // Actions
  const reset = () => {
    moodboardId.value = null;
    project.value = null;
    moodboard.value = null;
    images.value = [];
    loading.value = false;
    loadingMore.value = false;
    error.value = null;
    hasMore.value = true;
    currentPage.value = 1;
    auth.value = null;
  };

  const loadMoodboard = async (id: string, page = 1) => {
    if (loading.value) return;

    moodboardId.value = id;
    loading.value = true;
    error.value = null;

    // Initialize auth
    initializeAuth();

    try {
      const response = await $fetch<ClientMoodboardAccess>(
        `/api/moodboard/client/${id}`,
        {
          query: { page, pageSize: 50 },
        }
      );

      project.value = response.project;
      moodboard.value = response.moodboard;
      images.value = Array.from(response.moodboard.images || []);
      hasMore.value = response.moodboard.hasMore || false;
      currentPage.value = response.moodboard.currentPage || 1;

      // Initialize auth for password-protected projects
      if (response.project.hasPassword && auth.value) {
        auth.value.initializeAuth();
      }

      return response;
    } catch (err) {
      if (err instanceof Error && err.message.includes("404")) {
        error.value = new Error("Moodboard non trouvé");
      } else if (err instanceof Error && err.message.includes("403")) {
        error.value = new Error("Moodboard non accessible");
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
      !moodboardId.value ||
      loadingMore.value
    ) {
      return false;
    }

    loadingMore.value = true;

    try {
      const nextPage = currentPage.value + 1;
      const response = await $fetch<ClientMoodboardAccess>(
        `/api/moodboard/client/${moodboardId.value}`,
        {
          query: { page: nextPage, pageSize: 20 },
        }
      );

      if (response.moodboard.images && response.moodboard.images.length > 0) {
        images.value = [...images.value, ...response.moodboard.images];
        hasMore.value = response.moodboard.hasMore || false;
        currentPage.value = nextPage;
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
    if (!moodboardId.value || !auth.value) return false;

    const serverVerify = async (pwd: string) => {
      const response = await $fetch<{ valid: boolean }>(
        `/api/moodboard/client/${moodboardId.value}/verify`,
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

  const updateMoodboardStatus = (
    status:
      | "draft"
      | "awaiting_client"
      | "revision_requested"
      | "completed"
      | "payment_pending"
  ) => {
    if (moodboard.value) {
      moodboard.value.status = status;
    }
  };

  const updateMoodboardRevisionComment = (comment: string) => {
    if (moodboard.value) {
      moodboard.value.revision_last_comment = comment;
    }
  };

  // Optimized update methods to avoid full reloads
  const addImages = (newImages: MoodboardImageWithInteractions[]) => {
    images.value = [...images.value, ...newImages];
  };

  const updateImageComments = async (imageId: string, newComment?: string) => {
    const imageIndex = images.value.findIndex((img) => img.id === imageId);
    if (imageIndex !== -1) {
      const image = images.value[imageIndex];
      if (image && newComment) {
        // Add new comment locally
        const comment = {
          id: `temp-${Date.now()}`,
          content: newComment,
          created_at: new Date().toISOString(),
          image_id: imageId,
        };
        image.comments = [...(image.comments || []), comment];
      }
      // Trigger reactivity
      images.value = [...images.value];
    }
  };

  const updateImageReactions = async (
    imageId: string,
    reaction: "love" | "like" | "dislike",
    action: "add" | "remove"
  ) => {
    const imageIndex = images.value.findIndex((img) => img.id === imageId);
    if (imageIndex !== -1) {
      const image = images.value[imageIndex];
      if (image) {
        // Initialize reactions if not present
        if (!image.reactions) {
          image.reactions = { love: 0, like: 0, dislike: 0 };
        }

        // Update reaction count locally
        if (action === "add") {
          image.reactions[reaction] = (image.reactions[reaction] || 0) + 1;
        } else {
          image.reactions[reaction] = Math.max(
            0,
            (image.reactions[reaction] || 0) - 1
          );
        }

        // Trigger reactivity
        images.value = [...images.value];
      }
    }
  };

  return {
    // State
    moodboardId: readonly(moodboardId),
    project: readonly(project),
    moodboard: readonly(moodboard),
    images: readonly(images),
    loading: readonly(loading),
    loadingMore: readonly(loadingMore),
    error: readonly(error),
    hasMore: readonly(hasMore),
    currentPage: readonly(currentPage),
    isAuthenticated,
    authError,

    // Computed
    needsPassword,
    canInteract,

    // Actions
    reset,
    loadMoodboard,
    loadMore,
    verifyPassword,
    logout,
    updateMoodboardStatus,
    updateMoodboardRevisionComment,
    addImages,
    updateImageComments,
    updateImageReactions,
  };
});
