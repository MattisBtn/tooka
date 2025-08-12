import type {
  MoodboardImageWithInteractions,
  ReactionType,
} from "~/types/moodboard";

export const useClientMoodboardActions = () => {
  const store = useClientMoodboardStore();

  // Action states
  const validatingMoodboard = ref(false);
  const requestingRevisions = ref(false);
  const uploadingImages = ref(false);
  const uploadProgress = ref(0);

  // Modal states
  const showValidateDialog = ref(false);
  const showRequestRevisionsDialog = ref(false);
  const revisionComment = ref("");

  // Client actions
  const uploadImages = async (files: File[]) => {
    if (!store.moodboard || !store.canInteract || !store.moodboardId) {
      throw new Error("Impossible d'ajouter des images à ce moodboard");
    }

    try {
      uploadingImages.value = true;
      uploadProgress.value = 0;

      const progressInterval = setInterval(() => {
        if (uploadProgress.value < 85) {
          uploadProgress.value += Math.random() * 15;
        }
      }, 300);

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await $fetch<{
        images: MoodboardImageWithInteractions[];
      }>(`/api/moodboard/client/${store.moodboardId}/upload`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      uploadProgress.value = 100;

      if (response.images && response.images.length > 0) {
        // Add new images to existing ones instead of full reload
        store.addImages(response.images);
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

  const addComment = async (imageId: string, comment: string) => {
    if (!store.moodboardId) return;

    try {
      await $fetch(`/api/moodboard/client/${store.moodboardId}/comment`, {
        method: "POST",
        body: { imageId, content: comment },
      });

      // Update locally instead of making another API call
      await store.updateImageComments(imageId, comment);

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

  const reactToImage = async (imageId: string, reaction: ReactionType) => {
    if (!store.canInteract || !store.moodboardId) return;

    // Find the image in the store to check if user has already reacted
    const image = store.images.find((img) => img.id === imageId);
    const hasUserReaction = (image?.reactions?.[reaction] || 0) > 0;

    try {
      const action = hasUserReaction ? "remove" : "add";

      await $fetch(`/api/moodboard/client/${store.moodboardId}/reaction`, {
        method: "POST",
        body: { imageId, reaction, action },
      });

      // Update locally instead of making another API call
      await store.updateImageReactions(imageId, reaction, action);
    } catch (err) {
      console.error("Error setting reaction:", err);
    }
  };

  const validateMoodboard = async () => {
    if (!store.moodboard || !store.moodboardId) return;

    try {
      validatingMoodboard.value = true;
      await $fetch(`/api/moodboard/client/${store.moodboardId}/validate`, {
        method: "POST",
      });

      // Update moodboard status locally instead of full reload
      store.updateMoodboardStatus("completed");

      const toast = useToast();
      toast.add({
        title: "Moodboard validé",
        description: "Le moodboard a été validé avec succès",
        icon: "i-lucide-check-circle",
        color: "success",
      });
    } catch (error) {
      console.error("Failed to validate moodboard:", error);
      const toast = useToast();
      toast.add({
        title: "Erreur",
        description: "Impossible de valider le moodboard",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
    } finally {
      validatingMoodboard.value = false;
      showValidateDialog.value = false;
    }
  };

  const requestRevisions = async () => {
    if (!store.moodboard || !store.moodboardId) return;

    try {
      requestingRevisions.value = true;
      const response = await $fetch<{
        success: boolean;
        message: string;
        moodboard: {
          id: string;
          status: string;
          revision_last_comment?: string | null;
        };
        comment: string | null;
      }>(`/api/moodboard/client/${store.moodboardId}/request-revisions`, {
        method: "POST",
        body: { comment: revisionComment.value },
      });

      // Update moodboard status and comment locally instead of full reload
      store.updateMoodboardStatus("revision_requested");
      if (response.moodboard.revision_last_comment) {
        store.updateMoodboardRevisionComment(
          response.moodboard.revision_last_comment
        );
      }

      const toast = useToast();
      toast.add({
        title: "Révisions demandées",
        description: "Votre demande de révisions a été envoyée",
        icon: "i-lucide-message-circle",
        color: "success",
      });
    } catch (error) {
      console.error("Failed to request revisions:", error);
      const toast = useToast();
      toast.add({
        title: "Erreur",
        description: "Impossible d'envoyer la demande de révisions",
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
    // Action states - use store.loadingMore instead of local state
    validatingMoodboard: readonly(validatingMoodboard),
    requestingRevisions: readonly(requestingRevisions),
    uploadingImages: readonly(uploadingImages),
    uploadProgress: readonly(uploadProgress),

    // Modal states
    showValidateDialog,
    showRequestRevisionsDialog,
    revisionComment,

    // Actions
    uploadImages,
    addComment,
    reactToImage,
    validateMoodboard,
    requestRevisions,
  };
};
