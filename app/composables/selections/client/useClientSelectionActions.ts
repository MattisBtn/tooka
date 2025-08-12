export const useClientSelectionActions = () => {
  const store = useClientSelectionStore();

  // Action states
  const validatingSelection = ref(false);
  const requestingRevisions = ref(false);

  // Modal states
  const showValidateDialog = ref(false);
  const showRequestRevisionsDialog = ref(false);
  const revisionComment = ref("");

  // Client actions
  const toggleImageSelection = async (imageId: string) => {
    if (!store.canInteract) return;

    // Toggle selection locally - allow unlimited selection with automatic extra price calculation
    store.toggleImageSelection(imageId);
  };

  const validateSelection = async () => {
    if (!store.selection || !store.selectionId) return;

    try {
      validatingSelection.value = true;

      // Send all local selections to server
      const selectedImageIds = Array.from(store.selectedImages);
      await $fetch(`/api/selection/client/${store.selectionId}/validate`, {
        method: "POST",
        body: { selectedImages: selectedImageIds },
      });

      // Update selection status locally instead of full reload
      store.updateSelectionStatus("completed");

      const toast = useToast();
      toast.add({
        title: "Sélection validée",
        description: "Votre sélection a été validée avec succès",
        icon: "i-lucide-check-circle",
        color: "success",
      });
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
    if (!store.selection || !store.selectionId) return;

    try {
      requestingRevisions.value = true;
      const response = await $fetch<{
        success: boolean;
        message: string;
        selection: {
          id: string;
          status: string;
          revision_last_comment?: string | null;
        };
        comment: string | null;
      }>(`/api/selection/client/${store.selectionId}/request-revisions`, {
        method: "POST",
        body: { comment: revisionComment.value },
      });

      // Update selection status and comment locally instead of full reload
      store.updateSelectionStatus("revision_requested");
      if (response.selection.revision_last_comment) {
        store.updateSelectionRevisionComment(
          response.selection.revision_last_comment
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
    // Action states
    validatingSelection: readonly(validatingSelection),
    requestingRevisions: readonly(requestingRevisions),

    // Modal states
    showValidateDialog,
    showRequestRevisionsDialog,
    revisionComment,

    // Actions
    toggleImageSelection,
    validateSelection,
    requestRevisions,
  };
};
