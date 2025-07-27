import type {
  ClientMoodboardAccess,
  MoodboardComment,
  MoodboardImage,
  MoodboardImageWithInteractions,
  ReactionType,
} from "~/types/moodboard";

export const useClientMoodboard = async (moodboardId: string) => {
  const loading = ref(true);
  const loadingMore = ref(false);
  const error = ref<Error | null>(null);
  const moodboardData = ref<ClientMoodboardAccess | null>(null);
  const images = ref<MoodboardImageWithInteractions[]>([]);
  const hasMore = ref(true);
  const currentPage = ref(1);

  // Use simplified auth
  const auth = useClientAuth("moodboard", moodboardId);

  // Simple reactions management with localStorage
  const USER_REACTIONS_KEY = `moodboard_user_reactions_${moodboardId}`;

  const getUserReactions = () => {
    if (!import.meta.client) return {};
    try {
      const stored = localStorage.getItem(USER_REACTIONS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveUserReaction = (imageId: string, reaction: ReactionType | null) => {
    if (!import.meta.client) return;
    try {
      const reactions = getUserReactions();
      if (reaction) {
        reactions[imageId] = reaction;
        localStorage.setItem(USER_REACTIONS_KEY, JSON.stringify(reactions));
      } else {
        // Remove reaction by creating new object without this key
        const { [imageId]: _, ...newReactions } = reactions;
        localStorage.setItem(USER_REACTIONS_KEY, JSON.stringify(newReactions));
      }
    } catch {
      // Ignore storage errors
    }
  };

  const getUserReaction = (imageId: string): ReactionType | null => {
    const reactions = getUserReactions();
    return reactions[imageId] || null;
  };

  // Initial fetch of moodboard data
  const {
    data,
    pending,
    error: fetchError,
  } = await useFetch<ClientMoodboardAccess>(
    `/api/moodboard/client/${moodboardId}`,
    {
      query: { page: 1, pageSize: 20 },
      key: `moodboard-client-${moodboardId}`,
      server: false,
      onResponseError({ response }) {
        if (response.status === 404) {
          error.value = new Error("Moodboard non trouvé");
        } else if (response.status === 403) {
          error.value = new Error("Moodboard non accessible");
        } else {
          error.value = new Error("Erreur lors du chargement");
        }
      },
    }
  );

  // Computed properties
  const project = computed(() => data.value?.project || null);
  const moodboard = computed(() => data.value?.moodboard || null);

  // Simple logic: if no password required, always authenticated
  const isAuthenticated = computed(() => {
    return !project.value?.hasPassword || auth.isAuthenticated.value;
  });

  const needsPassword = computed(() => {
    return project.value?.hasPassword && !auth.isAuthenticated.value;
  });

  // Check if user can interact with moodboard
  const canInteract = computed(() => {
    if (!moodboard.value) return false;
    return (
      moodboard.value.status !== "completed" &&
      moodboard.value.status !== "revision_requested"
    );
  });

  // Helper function to enhance images with interactions
  const enhanceImagesWithInteractions = (
    imagesList: readonly (MoodboardImage & {
      reactions?: { love: number; like: number; dislike: number };
      comments?: readonly MoodboardComment[];
    })[]
  ): MoodboardImageWithInteractions[] => {
    return imagesList.map((image) => ({
      ...image,
      reactions: image.reactions || { love: 0, like: 0, dislike: 0 },
      userReaction: getUserReaction(image.id),
      comments: image.comments ? Array.from(image.comments) : [],
    }));
  };

  // Watch for data changes and update state
  watch(
    data,
    (newData) => {
      if (newData) {
        moodboardData.value = newData;

        if (newData.moodboard.images && newData.moodboard.images.length > 0) {
          const enhancedImages = enhanceImagesWithInteractions(
            Array.from(newData.moodboard.images)
          );
          images.value = enhancedImages;
        } else {
          images.value = [];
        }

        hasMore.value = newData.moodboard.hasMore || false;
        currentPage.value = newData.moodboard.currentPage || 1;
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

      const response = await $fetch<ClientMoodboardAccess>(
        `/api/moodboard/client/${moodboardId}`,
        {
          query: { page: nextPage, pageSize: 20 },
        }
      );

      if (response.moodboard.images && response.moodboard.images.length > 0) {
        const enhancedNewImages = enhanceImagesWithInteractions(
          Array.from(response.moodboard.images)
        );

        images.value = [...images.value, ...enhancedNewImages];
        hasMore.value = response.moodboard.hasMore || false;
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
        `/api/moodboard/client/${moodboardId}/verify`,
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
  const validatingMoodboard = ref(false);
  const requestingRevisions = ref(false);
  const uploadingImages = ref(false);
  const uploadProgress = ref(0);

  // Modal states
  const showValidateDialog = ref(false);
  const showRequestRevisionsDialog = ref(false);

  // Form state
  const revisionComment = ref("");

  // Upload images to moodboard
  const uploadImages = async (files: File[]) => {
    if (!moodboard.value || !canInteract.value) {
      throw new Error("Impossible d'ajouter des images à ce moodboard");
    }

    try {
      uploadingImages.value = true;
      uploadProgress.value = 0;

      // Simulate progress
      const progressInterval = setInterval(() => {
        if (uploadProgress.value < 85) {
          uploadProgress.value += Math.random() * 15;
        }
      }, 300);

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await $fetch<{ images: MoodboardImage[] }>(
        `/api/moodboard/client/${moodboardId}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      clearInterval(progressInterval);
      uploadProgress.value = 100;

      if (response.images && response.images.length > 0) {
        const enhancedNewImages = enhanceImagesWithInteractions(
          response.images
        );
        images.value = [...images.value, ...enhancedNewImages];
      }

      setTimeout(() => {
        uploadingImages.value = false;
        uploadProgress.value = 0;
      }, 1000);

      const toast = useToast();
      toast.add({
        title: "Images ajoutées",
        description: `${files.length} image${
          files.length > 1 ? "s" : ""
        } ajoutée${files.length > 1 ? "s" : ""} avec succès`,
        icon: "i-lucide-check-circle",
        color: "success",
      });
    } catch (err) {
      console.error("Error uploading images:", err);
      uploadingImages.value = false;
      uploadProgress.value = 0;

      const toast = useToast();
      toast.add({
        title: "Erreur d'upload",
        description:
          err instanceof Error
            ? err.message
            : "Une erreur est survenue lors de l'upload.",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
    }
  };

  // Add comment to image
  const addComment = async (imageId: string, comment: string) => {
    try {
      const response = await $fetch<{ comment: MoodboardComment }>(
        `/api/moodboard/client/${moodboardId}/comment`,
        {
          method: "POST",
          body: { imageId, content: comment },
        }
      );

      // Update the image in the list
      const imageIndex = images.value.findIndex((img) => img.id === imageId);
      if (imageIndex !== -1 && images.value[imageIndex]) {
        const currentComments = images.value[imageIndex]!.comments || [];
        images.value[imageIndex]!.comments = [
          ...currentComments,
          response.comment,
        ];
      }

      const toast = useToast();
      toast.add({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été ajouté avec succès",
        icon: "i-lucide-message-circle",
        color: "success",
      });
    } catch (err) {
      console.error("Error adding comment:", err);
      const toast = useToast();
      toast.add({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
    }
  };

  // React to image
  const reactToImage = async (imageId: string, reaction: ReactionType) => {
    if (!canInteract.value) return;

    const currentUserReaction = getUserReaction(imageId);
    const wasRemoving = currentUserReaction === reaction;

    try {
      if (wasRemoving) {
        // Remove reaction locally
        saveUserReaction(imageId, null);
        const imageIndex = images.value.findIndex((img) => img.id === imageId);
        if (imageIndex !== -1 && images.value[imageIndex]) {
          images.value[imageIndex]!.userReaction = null;
        }
      } else {
        // Add new reaction
        saveUserReaction(imageId, reaction);

        const response = await $fetch(
          `/api/moodboard/client/${moodboardId}/reaction`,
          {
            method: "POST",
            body: { imageId, reaction },
          }
        );

        if (response.success) {
          const imageIndex = images.value.findIndex(
            (img) => img.id === imageId
          );
          if (imageIndex !== -1 && images.value[imageIndex]) {
            images.value[imageIndex]!.userReaction = reaction;
            if (images.value[imageIndex]!.reactions) {
              images.value[imageIndex]!.reactions[reaction]++;
              if (currentUserReaction && currentUserReaction !== reaction) {
                images.value[imageIndex]!.reactions[currentUserReaction] =
                  Math.max(
                    0,
                    images.value[imageIndex]!.reactions[currentUserReaction] - 1
                  );
              }
            }
          }
        } else {
          saveUserReaction(imageId, currentUserReaction);
        }
      }
    } catch (err) {
      console.error("Error setting reaction:", err);
      saveUserReaction(imageId, currentUserReaction);
    }
  };

  // Client actions methods
  const validateMoodboard = async () => {
    if (!moodboard.value) return;

    try {
      validatingMoodboard.value = true;
      await $fetch(`/api/moodboard/client/${moodboard.value.id}/validate`, {
        method: "POST",
      });
      await reloadNuxtApp();
    } catch (error) {
      console.error("Failed to validate moodboard:", error);
    } finally {
      validatingMoodboard.value = false;
      showValidateDialog.value = false;
    }
  };

  const requestRevisions = async () => {
    if (!moodboard.value) return;

    try {
      requestingRevisions.value = true;
      await $fetch(
        `/api/moodboard/client/${moodboard.value.id}/request-revisions`,
        {
          method: "POST",
          body: { comment: revisionComment.value },
        }
      );
      await reloadNuxtApp();
    } catch (error) {
      console.error("Failed to request revisions:", error);
    } finally {
      requestingRevisions.value = false;
      showRequestRevisionsDialog.value = false;
      revisionComment.value = "";
    }
  };

  return {
    // State
    project: readonly(project),
    moodboard: readonly(moodboard),
    images: readonly(images),
    loading: readonly(loading),
    loadingMore: readonly(loadingMore),
    error: readonly(error),
    isAuthenticated,
    authError: auth.authError,
    hasMore: readonly(hasMore),
    canInteract: readonly(canInteract),

    // Action states
    validatingMoodboard: readonly(validatingMoodboard),
    requestingRevisions: readonly(requestingRevisions),
    uploadingImages: readonly(uploadingImages),
    uploadProgress: readonly(uploadProgress),

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
    validateMoodboard,
    requestRevisions,
    uploadImages,
    addComment,
    reactToImage,

    // Auth methods
    logout: auth.logout,
  };
};
