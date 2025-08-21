import type {
  MoodboardComment,
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
        // Reload current page to show new images
        await store.loadPage(store.currentPage);
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

  const addComment = async (
    imageId: string,
    comment: string,
    onSuccess?: () => void
  ) => {
    if (!store.moodboardId) return;

    // Optimistic update: add comment immediately to UI
    const tempCommentId = store.addCommentToImage(imageId, comment);
    if (!tempCommentId) return;

    try {
      const response = await $fetch<{ comment: MoodboardComment }>(
        `/api/moodboard/client/${store.moodboardId}/comment`,
        {
          method: "POST",
          body: { imageId, content: comment },
        }
      );

      // Replace temporary comment with real one from server
      if (response.comment) {
        store.updateCommentInImage(imageId, tempCommentId, response.comment);
      }

      // Call success callback if provided (e.g., to close modal)
      if (onSuccess) {
        onSuccess();
      }

      const toast = useToast();
      toast.add({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été ajouté avec succès",
        icon: "i-lucide-message-circle",
        color: "success",
      });
    } catch (err) {
      // Rollback: remove the temporary comment
      store.removeCommentFromImage(imageId, tempCommentId);

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

    // Get current reaction count to determine if we're adding or removing
    const currentImage = store.images.find((img) => img.id === imageId);
    const currentCount = currentImage?.reactions?.[reaction] || 0;
    const isAdding = currentCount === 0;

    // Optimistic update: toggle the reaction immediately
    store.updateImageReaction(imageId, reaction, isAdding);

    try {
      const response = await $fetch<{ action: "created" | "removed" }>(
        `/api/moodboard/client/${store.moodboardId}/reaction`,
        {
          method: "POST",
          body: { imageId, reaction, action: "toggle" },
        }
      );

      // Verify the optimistic update was correct
      const expectedAction = isAdding ? "created" : "removed";
      if (response.action !== expectedAction) {
        // If server action differs from our prediction, rollback and apply correct action
        store.rollbackImageReaction(imageId, reaction, isAdding);
        store.updateImageReaction(
          imageId,
          reaction,
          response.action === "created"
        );
      }
    } catch (err) {
      // Rollback on error
      store.rollbackImageReaction(imageId, reaction, isAdding);
      console.error("Error setting reaction:", err);

      const toast = useToast();
      toast.add({
        title: "Erreur",
        description: "Impossible d'enregistrer votre réaction",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
    }
  };

  const validateMoodboard = async () => {
    if (!store.moodboardId || !store.canInteract) return;

    try {
      validatingMoodboard.value = true;

      await $fetch(`/api/moodboard/client/${store.moodboardId}/validate`, {
        method: "POST",
      });

      store.updateMoodboardStatus("completed");
      showValidateDialog.value = false;

      const toast = useToast();
      toast.add({
        title: "Moodboard validé",
        description: "Le moodboard a été validé avec succès",
        icon: "i-lucide-check-circle",
        color: "success",
      });
    } catch (err) {
      console.error("Error validating moodboard:", err);
      const toast = useToast();
      toast.add({
        title: "Erreur",
        description: "Impossible de valider le moodboard",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
    } finally {
      validatingMoodboard.value = false;
    }
  };

  const requestRevisions = async () => {
    if (!store.moodboardId || !store.canInteract) return;

    try {
      requestingRevisions.value = true;

      await $fetch(
        `/api/moodboard/client/${store.moodboardId}/request-revisions`,
        {
          method: "POST",
          body: { comment: revisionComment.value },
        }
      );

      store.updateMoodboardStatus("revision_requested");
      store.updateMoodboardRevisionComment(revisionComment.value);
      showRequestRevisionsDialog.value = false;
      revisionComment.value = "";

      const toast = useToast();
      toast.add({
        title: "Révisions demandées",
        description: "Votre demande de révisions a été envoyée",
        icon: "i-lucide-message-circle",
        color: "success",
      });
    } catch (err) {
      console.error("Error requesting revisions:", err);
      const toast = useToast();
      toast.add({
        title: "Erreur",
        description: "Impossible d'envoyer la demande de révisions",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
    } finally {
      requestingRevisions.value = false;
    }
  };

  return {
    // Action states
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
