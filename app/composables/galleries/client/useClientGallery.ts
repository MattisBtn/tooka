import type { ClientGalleryAccess, GalleryImage } from "~/types/gallery";

export const useClientGallery = async (galleryId: string) => {
  const loading = ref(true);
  const loadingMore = ref(false);
  const error = ref<Error | null>(null);
  const galleryData = ref<ClientGalleryAccess | null>(null);
  const images = ref<GalleryImage[]>([]);
  const hasMore = ref(true);
  const currentPage = ref(1);

  // Use simplified auth
  const auth = useClientAuth("gallery", galleryId);

  // Initial fetch of gallery data (without images for faster loading)
  const {
    data,
    pending,
    error: fetchError,
  } = await useFetch<ClientGalleryAccess>(`/api/gallery/client/${galleryId}`, {
    query: { page: 1, pageSize: 20 },
    key: `gallery-client-${galleryId}`,
    server: false,
    onResponseError({ response }) {
      if (response.status === 404) {
        error.value = new Error("Galerie non trouvée");
      } else if (response.status === 403) {
        error.value = new Error("Galerie non accessible");
      } else {
        error.value = new Error("Erreur lors du chargement");
      }
    },
  });

  // Computed properties
  const project = computed(() => data.value?.project || null);
  const gallery = computed(() => data.value?.gallery || null);

  // Simple logic: if no password required, always authenticated
  const isAuthenticated = computed(() => {
    return !project.value?.hasPassword || auth.isAuthenticated.value;
  });

  const needsPassword = computed(() => {
    return project.value?.hasPassword && !auth.isAuthenticated.value;
  });

  // Watch for data changes and update state
  watch(
    data,
    (newData) => {
      if (newData) {
        galleryData.value = newData;
        images.value = [...(newData.gallery.images || [])];
        hasMore.value = newData.gallery.hasMore || false;
        currentPage.value = newData.gallery.currentPage || 1;
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

      const response = await $fetch<ClientGalleryAccess>(
        `/api/gallery/client/${galleryId}`,
        {
          query: { page: nextPage, pageSize: 20 },
        }
      );

      if (response.gallery.images) {
        images.value = [...images.value, ...response.gallery.images];
        hasMore.value = response.gallery.hasMore || false;
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
        `/api/gallery/client/${galleryId}/verify`,
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
  const validatingGallery = ref(false);
  const requestingRevisions = ref(false);
  const downloadingGallery = ref(false);

  // Modal states
  const showValidateDialog = ref(false);
  const showValidateWithPaymentDialog = ref(false);
  const showRequestRevisionsDialog = ref(false);

  // Form state
  const revisionComment = ref("");

  // Client actions methods
  const validateGallery = async () => {
    if (!gallery.value) return;

    try {
      validatingGallery.value = true;
      await $fetch(`/api/gallery/client/${gallery.value.id}/validate`, {
        method: "POST",
      });
      // Refresh the page data
      await reloadNuxtApp();
    } catch (error) {
      console.error("Failed to validate gallery:", error);
    } finally {
      validatingGallery.value = false;
      showValidateDialog.value = false;
    }
  };

  const validateGalleryWithPayment = async () => {
    if (!gallery.value) return;

    try {
      validatingGallery.value = true;
      await $fetch(
        `/api/gallery/client/${gallery.value.id}/validate-with-payment`,
        {
          method: "POST",
        }
      );
      // Refresh the page data
      await reloadNuxtApp();
    } catch (error) {
      console.error("Failed to validate gallery with payment:", error);
    } finally {
      validatingGallery.value = false;
      showValidateWithPaymentDialog.value = false;
    }
  };

  const requestRevisions = async () => {
    if (!gallery.value) return;

    try {
      requestingRevisions.value = true;
      await $fetch(
        `/api/gallery/client/${gallery.value.id}/request-revisions`,
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

  const downloadGallery = async () => {
    if (!gallery.value) return;

    try {
      downloadingGallery.value = true;

      // Use native fetch for file download
      const response = await fetch(
        `/api/gallery/client/${gallery.value.id}/download`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the blob data
      const blob = await response.blob();

      // Extract filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `galerie_${gallery.value.id}.zip`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create download URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download gallery:", error);
      // You could add a toast notification here for user feedback
    } finally {
      downloadingGallery.value = false;
    }
  };

  // Action handlers for components
  const handleValidate = () => {
    showValidateDialog.value = true;
  };

  const handleValidateWithPayment = () => {
    showValidateWithPaymentDialog.value = true;
  };

  const handleRequestRevisions = () => {
    showRequestRevisionsDialog.value = true;
  };

  const handleDownload = () => {
    downloadGallery();
  };

  return {
    // State
    project: readonly(project),
    gallery: readonly(gallery),
    images: readonly(images),
    loading: readonly(loading),
    loadingMore: readonly(loadingMore),
    error: readonly(error),
    isAuthenticated,
    authError: auth.authError,
    hasMore: readonly(hasMore),

    // Action states
    validatingGallery: readonly(validatingGallery),
    requestingRevisions: readonly(requestingRevisions),
    downloadingGallery: readonly(downloadingGallery),

    // Modal states
    showValidateDialog,
    showValidateWithPaymentDialog,
    showRequestRevisionsDialog,

    // Form state
    revisionComment,

    // Computed
    needsPassword,

    // Actions
    verifyPassword,
    loadMore,

    // Client actions
    validateGallery,
    validateGalleryWithPayment,
    requestRevisions,
    downloadGallery,

    // Action handlers
    handleValidate,
    handleValidateWithPayment,
    handleRequestRevisions,
    handleDownload,

    // Auth methods
    logout: auth.logout,
  };
};
