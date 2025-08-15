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

    // Use the store method that handles the API call
    await store.toggleImageSelection(imageId);
  };

  const validateSelection = async () => {
    if (!store.selectionId || !store.canInteract) return;

    try {
      validatingSelection.value = true;

      await $fetch(`/api/selection/client/${store.selectionId}/validate`, {
        method: "POST",
      });

      store.updateSelectionStatus("completed");
      showValidateDialog.value = false;

      const toast = useToast();
      toast.add({
        title: "Sélection validée",
        description: "Votre sélection a été validée avec succès",
        icon: "i-lucide-check-circle",
        color: "success",
      });
    } catch (err) {
      console.error("Error validating selection:", err);
      const toast = useToast();
      toast.add({
        title: "Erreur",
        description: "Impossible de valider la sélection",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
    } finally {
      validatingSelection.value = false;
    }
  };

  const requestRevisions = async () => {
    if (!store.selectionId || !store.canInteract) return;

    try {
      requestingRevisions.value = true;

      await $fetch(
        `/api/selection/client/${store.selectionId}/request-revisions`,
        {
          method: "POST",
          body: { comment: revisionComment.value },
        }
      );

      store.updateSelectionStatus("revision_requested");
      store.updateSelectionRevisionComment(revisionComment.value);
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
