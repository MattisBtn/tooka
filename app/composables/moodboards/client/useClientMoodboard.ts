import type {
  ClientMoodboardAccess,
  MoodboardComment,
  MoodboardImage,
  MoodboardImageWithInteractions,
} from "~/types/moodboard";
import { useClientMoodboardImages } from "./useClientMoodboardImages";
import { useMoodboardAuth } from "./useMoodboardAuth";

export const useClientMoodboard = async (moodboardId: string) => {
  const loading = ref(true);
  const loadingMore = ref(false);
  const error = ref<Error | null>(null);
  const moodboardData = ref<ClientMoodboardAccess | null>(null);
  const images = ref<MoodboardImageWithInteractions[]>([]);
  const hasMore = ref(true);
  const currentPage = ref(1);

  // Use moodboard authentication composable
  const moodboardAuth = useMoodboardAuth(moodboardId);

  // Use image management composable
  const imageManager = useClientMoodboardImages();
  const { useImageReactions } = imageManager;

  // Initialize image interactions
  const reactions = useImageReactions(moodboardId);

  // Computed properties
  const project = computed(() => moodboardData.value?.project || null);
  const moodboard = computed(() => moodboardData.value?.moodboard || null);
  const needsPassword = computed(
    () => project.value?.hasPassword && !moodboardAuth.isAuthenticated.value
  );

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
    imagesList: readonly MoodboardImage[]
  ): MoodboardImageWithInteractions[] => {
    return imagesList.map((image) => {
      const imageWithComments = image as MoodboardImage & {
        comments?: readonly MoodboardComment[];
      };
      return {
        ...image,
        reactions: reactions.getReactionCounts(image.id),
        userReaction: reactions.getReaction(image.id),
        comments: imageWithComments.comments
          ? Array.from(imageWithComments.comments)
          : [],
      };
    });
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
      server: true,
      lazy: false,
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

  // Set initial data and enhance images with interactions
  if (data.value) {
    moodboardData.value = data.value;

    // Enhance images with interaction data
    if (data.value.moodboard.images && data.value.moodboard.images.length > 0) {
      const enhancedImages = enhanceImagesWithInteractions(
        Array.from(data.value.moodboard.images)
      );
      images.value = enhancedImages;
    } else {
      images.value = [];
    }

    hasMore.value = data.value.moodboard.hasMore || false;
    currentPage.value = data.value.moodboard.currentPage || 1;

    // Initialize authentication
    if (!data.value.project.hasPassword) {
      // No password required, authenticate immediately using a dummy verify function
      await moodboardAuth.authenticate("", async () => true);
    } else {
      // Try to restore from stored session
      await moodboardAuth.initializeAuth();
    }
  }

  if (fetchError.value) {
    error.value = fetchError.value;
  }

  loading.value = pending.value;

  // Load more images for infinite scroll
  const loadMore = async () => {
    if (
      loadingMore.value ||
      !hasMore.value ||
      !moodboardAuth.isAuthenticated.value
    )
      return;

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
        // Enhance new images with interaction data
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

    return await moodboardAuth.authenticate(password, serverVerify);
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

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        if (uploadProgress.value < 85) {
          uploadProgress.value += Math.random() * 15;
        }
      }, 300);

      // Upload to server API
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

      // Add new images to the list with interaction data
      if (response.images && response.images.length > 0) {
        const enhancedNewImages = enhanceImagesWithInteractions(
          response.images
        );
        images.value = [...images.value, ...enhancedNewImages];
      }

      // Small delay to show 100% before hiding
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
      const newComment = await imageManager
        .useImageComments(moodboardId)
        .addComment(imageId, comment);

      // Update the image in the list
      const imageIndex = images.value.findIndex((img) => img.id === imageId);
      if (imageIndex !== -1 && images.value[imageIndex]) {
        const currentComments = images.value[imageIndex]!.comments || [];
        images.value[imageIndex]!.comments = [...currentComments, newComment];
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
  const reactToImage = async (
    imageId: string,
    reaction: "love" | "like" | "dislike"
  ) => {
    if (!canInteract.value) return;

    try {
      // Set reaction locally (mocked)
      reactions.setReaction(imageId, reaction);

      // Update the image in the list
      const imageIndex = images.value.findIndex((img) => img.id === imageId);
      if (imageIndex !== -1 && images.value[imageIndex]) {
        images.value[imageIndex]!.reactions =
          reactions.getReactionCounts(imageId);
        images.value[imageIndex]!.userReaction = reactions.getReaction(imageId);
      }
    } catch (err) {
      console.error("Error setting reaction:", err);
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
      // Refresh the page data
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
          body: {
            comment: revisionComment.value,
          },
        }
      );
      // Refresh the page data
      await reloadNuxtApp();
    } catch (error) {
      console.error("Failed to request revisions:", error);
    } finally {
      requestingRevisions.value = false;
      showRequestRevisionsDialog.value = false;
      revisionComment.value = "";
    }
  };

  // Action handlers for components
  const handleValidate = () => {
    showValidateDialog.value = true;
  };

  const handleRequestRevisions = () => {
    showRequestRevisionsDialog.value = true;
  };

  return {
    // State
    project: readonly(project),
    moodboard: readonly(moodboard),
    images: readonly(images),
    loading: readonly(loading),
    loadingMore: readonly(loadingMore),
    error: readonly(error),
    isAuthenticated: moodboardAuth.isAuthenticated,
    authError: moodboardAuth.authError,
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

    // Client actions
    validateMoodboard,
    requestRevisions,
    uploadImages,
    addComment,
    reactToImage,

    // Action handlers
    handleValidate,
    handleRequestRevisions,

    // Auth methods
    logout: moodboardAuth.logout,
  };
};
