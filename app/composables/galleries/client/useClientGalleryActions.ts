export const useClientGalleryActions = () => {
  const store = useClientGalleryStore();

  // Action states
  const validatingGallery = ref(false);
  const requestingRevisions = ref(false);
  const downloadingGallery = ref(false);
  const confirmingPayment = ref(false);

  // Modal states
  const showValidateDialog = ref(false);
  const showPaymentDialog = ref(false);
  const showRequestRevisionsDialog = ref(false);

  // Form state
  const revisionComment = ref("");

  // Image URL management - cache pour éviter de redemander les URLs
  const urlCache = new Map<string, { url: string; expires: number }>();
  const loadingImages = new Set<string>();

  const getImageSignedUrl = async (
    galleryId: string,
    filePath: string
  ): Promise<string | null> => {
    if (!galleryId || !filePath) return null;

    // Check cache first
    const cacheKey = `${galleryId}:${filePath}`;
    const cached = urlCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expires > now) {
      return cached.url;
    }

    // Prevent duplicate requests
    if (loadingImages.has(cacheKey)) {
      // Wait for ongoing request
      await new Promise((resolve) => setTimeout(resolve, 100));
      const retryCache = urlCache.get(cacheKey);
      if (retryCache && retryCache.expires > now) {
        return retryCache.url;
      }
    }

    try {
      loadingImages.add(cacheKey);

      // Encode filePath pour l'URL
      const encodedFilePath = encodeURIComponent(filePath);

      const response = await $fetch<{ signedUrl: string }>(
        `/api/gallery/client/${galleryId}/image/${encodedFilePath}`
      );

      const signedUrl = response.signedUrl;

      // Cache for 50 minutes (signed URLs expire after 1 hour)
      urlCache.set(cacheKey, {
        url: signedUrl,
        expires: now + 50 * 60 * 1000,
      });

      return signedUrl;
    } catch (error) {
      console.error("Failed to get signed URL:", error);
      return null;
    } finally {
      loadingImages.delete(cacheKey);
    }
  };

  // Client actions
  const validateGallery = async () => {
    if (!store.gallery) return;

    try {
      validatingGallery.value = true;
      await $fetch(`/api/gallery/client/${store.gallery.id}/validate`, {
        method: "POST",
      });

      // Update gallery status locally instead of full reload
      store.updateGalleryStatus("completed");

      const toast = useToast();
      toast.add({
        title: "Galerie validée",
        description: "La galerie a été validée avec succès",
        icon: "i-lucide-check-circle",
        color: "success",
      });
    } catch (error) {
      console.error("Failed to validate gallery:", error);
      const toast = useToast();
      toast.add({
        title: "Erreur",
        description: "Impossible de valider la galerie",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
    } finally {
      validatingGallery.value = false;
      showValidateDialog.value = false;
    }
  };

  const requestRevisions = async () => {
    if (!store.gallery) return;

    try {
      requestingRevisions.value = true;
      const response = await $fetch<{
        success: boolean;
        message: string;
        gallery: {
          id: string;
          status: string;
          revision_last_comment?: string | null;
        };
        comment: string | null;
      }>(`/api/gallery/client/${store.gallery.id}/request-revisions`, {
        method: "POST",
        body: { comment: revisionComment.value },
      });

      // Update gallery status and comment locally instead of full reload
      store.updateGalleryStatus("revision_requested");
      if (response.gallery.revision_last_comment) {
        store.updateGalleryRevisionComment(
          response.gallery.revision_last_comment
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

  const confirmPayment = async () => {
    if (!store.gallery || !store.hasRemainingAmount) return;

    try {
      confirmingPayment.value = true;
      await $fetch<{ success: boolean; message: string }>(
        `/api/gallery/client/${store.gallery.id}/payment`,
        {
          method: "POST",
          body: { method: "bank_transfer" },
        }
      );

      // Update gallery status locally instead of full reload
      store.updateGalleryStatus("payment_pending");

      const toast = useToast();
      toast.add({
        title: "Paiement confirmé",
        description: "Le paiement a été confirmé avec succès",
        icon: "i-lucide-check-circle",
        color: "success",
      });
    } catch (error) {
      console.error("Failed to confirm payment:", error);
      const toast = useToast();
      toast.add({
        title: "Erreur",
        description: "Impossible de confirmer le paiement",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
      throw error;
    } finally {
      confirmingPayment.value = false;
      showPaymentDialog.value = false;
    }
  };

  const downloadGallery = async () => {
    if (!store.gallery) return;

    try {
      downloadingGallery.value = true;
      const response = await fetch(
        `/api/gallery/client/${store.gallery.id}/download`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `galerie_${store.gallery.id}.zip`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      const toast = useToast();
      toast.add({
        title: "Téléchargement réussi",
        description: "La galerie a été téléchargée",
        icon: "i-lucide-download",
        color: "success",
      });
    } catch (error) {
      console.error("Failed to download gallery:", error);
      const toast = useToast();
      toast.add({
        title: "Erreur",
        description: "Impossible de télécharger la galerie",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
    } finally {
      downloadingGallery.value = false;
    }
  };

  // Clear URL cache
  const clearCache = () => {
    urlCache.clear();
    loadingImages.clear();
  };

  // Load more action
  const loadMore = async () => {
    if (!store.hasMore || !store.isAuthenticated || store.loadingMore) {
      return false;
    }
    return await store.loadMore();
  };

  return {
    // Action states
    validatingGallery: readonly(validatingGallery),
    requestingRevisions: readonly(requestingRevisions),
    downloadingGallery: readonly(downloadingGallery),
    confirmingPayment: readonly(confirmingPayment),

    // Modal states
    showValidateDialog,
    showPaymentDialog,
    showRequestRevisionsDialog,
    revisionComment,

    // Actions
    getImageSignedUrl,
    validateGallery,
    requestRevisions,
    confirmPayment,
    downloadGallery,
    loadMore,
    clearCache,
  };
};
