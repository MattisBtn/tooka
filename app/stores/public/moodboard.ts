import { defineStore } from "pinia";
import type {
  ClientMoodboardAccess,
  MoodboardComment,
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
  const currentPage = ref(1);
  const totalImages = ref(0);
  const pageSize = ref(20);

  // Filter state
  const activeFilters = ref<{
    commented: boolean;
    love: boolean;
    like: boolean;
    dislike: boolean;
  }>({
    commented: false,
    love: false,
    like: false,
    dislike: false,
  });

  // Image signed URLs management
  const imageSignedUrls = ref<Map<string, string>>(new Map());

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
    error.value = null;
    currentPage.value = 1;
    totalImages.value = 0;
    activeFilters.value = {
      commented: false,
      love: false,
      like: false,
      dislike: false,
    };
    imageSignedUrls.value.clear();
    auth.value = null;
  };

  const loadMoodboard = async (id: string) => {
    if (loading.value) return;

    moodboardId.value = id;
    loading.value = true;
    error.value = null;

    initializeAuth();

    try {
      const response = await $fetch<ClientMoodboardAccess>(
        `/api/moodboard/client/${id}`,
        {
          query: {
            page: 1,
            pageSize: 20,
            ...buildFilterQuery(),
          },
        }
      );

      project.value = response.project;
      moodboard.value = response.moodboard;
      images.value = [...(response.moodboard.images || [])];
      currentPage.value = 1;
      totalImages.value = response.moodboard.imageCount || 0;

      // Store signed URLs
      imageSignedUrls.value.clear();
      (response.moodboard.images || []).forEach((image) => {
        const imageWithUrl = image as MoodboardImageWithInteractions;
        if (imageWithUrl.signed_url) {
          imageSignedUrls.value.set(image.file_url, imageWithUrl.signed_url);
        }
      });

      if (response.project.hasPassword && auth.value) {
        auth.value.initializeAuth();
      }
    } catch (err) {
      let errorMessage = "Erreur lors du chargement";

      if (err instanceof Error) {
        if (err.message.includes("404") || err.message.includes("not found")) {
          errorMessage = "Moodboard non trouvé";
        } else if (
          err.message.includes("403") ||
          err.message.includes("forbidden")
        ) {
          errorMessage = "Moodboard non accessible";
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
    if (loading.value || !moodboardId.value) return;

    loading.value = true;

    try {
      const response = await $fetch<ClientMoodboardAccess>(
        `/api/moodboard/client/${moodboardId.value}`,
        {
          query: {
            page,
            pageSize: pageSize.value,
            ...buildFilterQuery(),
          },
        }
      );

      // Update all properties atomically
      images.value = [...(response.moodboard.images || [])];
      currentPage.value = page;
      totalImages.value = response.moodboard.imageCount || 0;

      // Store signed URLs for new images
      imageSignedUrls.value.clear();
      (response.moodboard.images || []).forEach((image) => {
        const imageWithUrl = image as MoodboardImageWithInteractions;
        if (imageWithUrl.signed_url) {
          imageSignedUrls.value.set(image.file_url, imageWithUrl.signed_url);
        }
      });
    } catch (err) {
      console.error("Failed to load page:", err);
    } finally {
      loading.value = false;
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
    status: "draft" | "awaiting_client" | "revision_requested" | "completed"
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

  // Update image reaction locally (optimistic update)
  const updateImageReaction = (
    imageId: string,
    reaction: "love" | "like" | "dislike",
    increment: boolean = true
  ) => {
    const imageIndex = images.value.findIndex((img) => img.id === imageId);
    if (imageIndex === -1) return;

    const currentImage = images.value[imageIndex];
    if (!currentImage) return;

    // Ensure reactions object exists
    if (!currentImage.reactions) {
      currentImage.reactions = { love: 0, like: 0, dislike: 0 };
    }

    // Update reaction count
    if (increment) {
      currentImage.reactions[reaction] =
        (currentImage.reactions[reaction] || 0) + 1;
    } else {
      currentImage.reactions[reaction] = Math.max(
        0,
        (currentImage.reactions[reaction] || 0) - 1
      );
    }
  };

  // Rollback image reaction (in case of API error)
  const rollbackImageReaction = (
    imageId: string,
    reaction: "love" | "like" | "dislike",
    wasIncrement: boolean
  ) => {
    updateImageReaction(imageId, reaction, !wasIncrement);
  };

  // Add comment locally (optimistic update)
  const addCommentToImage = (imageId: string, content: string) => {
    const imageIndex = images.value.findIndex((img) => img.id === imageId);
    if (imageIndex === -1) return null;

    const currentImage = images.value[imageIndex];
    if (!currentImage) return null;

    // Create optimistic comment with temporary ID
    const tempComment = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      image_id: imageId,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    // Ensure comments array exists
    if (!currentImage.comments) {
      currentImage.comments = [];
    }

    // Add comment to the array
    currentImage.comments = [...currentImage.comments, tempComment];

    return tempComment.id;
  };

  // Remove comment locally (rollback)
  const removeCommentFromImage = (imageId: string, tempCommentId: string) => {
    const imageIndex = images.value.findIndex((img) => img.id === imageId);
    if (imageIndex === -1) return;

    const currentImage = images.value[imageIndex];
    if (!currentImage || !currentImage.comments) return;

    // Remove the temporary comment
    currentImage.comments = currentImage.comments.filter(
      (comment) => comment.id !== tempCommentId
    );
  };

  // Update comment with real data from server
  const updateCommentInImage = (
    imageId: string,
    tempCommentId: string,
    realComment: MoodboardComment
  ) => {
    const imageIndex = images.value.findIndex((img) => img.id === imageId);
    if (imageIndex === -1) return;

    const currentImage = images.value[imageIndex];
    if (!currentImage || !currentImage.comments) return;

    // Replace temporary comment with real one
    const commentIndex = currentImage.comments.findIndex(
      (comment) => comment.id === tempCommentId
    );

    if (commentIndex !== -1) {
      currentImage.comments[commentIndex] = realComment;
    }
  };

  // Build filter query parameters
  const buildFilterQuery = () => {
    const query: Record<string, string> = {};
    if (activeFilters.value.commented) query.commented = "true";
    if (activeFilters.value.love) query.love = "true";
    if (activeFilters.value.like) query.like = "true";
    if (activeFilters.value.dislike) query.dislike = "true";
    return query;
  };

  // Filter management
  const toggleFilter = async (filter: keyof typeof activeFilters.value) => {
    activeFilters.value[filter] = !activeFilters.value[filter];
    // Reload first page with new filters
    await loadPage(1);
  };

  const clearAllFilters = async () => {
    activeFilters.value = {
      commented: false,
      love: false,
      like: false,
      dislike: false,
    };
    // Reload first page without filters
    await loadPage(1);
  };

  // Get signed URL for an image
  const getImageSignedUrl = (fileUrl: string) => {
    return imageSignedUrls.value.get(fileUrl) || null;
  };

  return {
    // State
    moodboardId: readonly(moodboardId),
    project: readonly(project),
    moodboard: readonly(moodboard),
    images: readonly(images),
    loading: readonly(loading),
    error: readonly(error),
    currentPage: readonly(currentPage),
    totalImages: readonly(totalImages),
    pageSize: readonly(pageSize),
    activeFilters: readonly(activeFilters),
    imageSignedUrls: readonly(imageSignedUrls),

    // Auth
    isAuthenticated,
    authError,
    needsPassword,
    verifyPassword,
    logout,

    // Computed
    canInteract,

    // Actions
    reset,
    loadMoodboard,
    loadPage,
    updateMoodboardStatus,
    updateMoodboardRevisionComment,
    updateImageReaction,
    rollbackImageReaction,
    addCommentToImage,
    removeCommentFromImage,
    updateCommentInImage,
    toggleFilter,
    clearAllFilters,
    getImageSignedUrl,
  };
});
