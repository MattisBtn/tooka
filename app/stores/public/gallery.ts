import { defineStore } from "pinia";
import { MODULE_STATUS } from "~/types/status";
import type {
  ClientGalleryAccess,
  GalleryImageWithSignedUrl,
} from "~/types/gallery";

export const useClientGalleryStore = defineStore("clientGallery", () => {
  // Core state
  const galleryId = ref<string | null>(null);
  const project = ref<ClientGalleryAccess["project"] | null>(null);
  const gallery = ref<ClientGalleryAccess["gallery"] | null>(null);
  const images = ref<GalleryImageWithSignedUrl[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const hasMore = ref(true);
  const currentPage = ref(1);
  const loadingMore = ref(false);

  // Image signed URLs management
  const imageSignedUrls = ref<Map<string, string>>(new Map());

  // Auth state - use composable for persistence
  const auth = ref<ReturnType<typeof useClientAuth> | null>(null);

  // Computed
  const isAuthenticated = computed(() => {
    if (project.value && !project.value.hasPassword) {
      return true;
    }
    if (!auth.value) return false;
    return auth.value.isAuthenticated;
  });

  const needsPassword = computed(
    () => project.value?.hasPassword && !isAuthenticated.value
  );

  const authError = computed(() => (auth.value ? auth.value.authError : null));

  // Payment method computed
  const isBankTransfer = computed(() => {
    return project.value?.paymentMethod === "bank_transfer";
  });

  const isStripePayment = computed(() => {
    return project.value?.paymentMethod === "stripe";
  });

  const hasRemainingAmount = computed(() => {
    return !!(
      project.value?.remainingAmount &&
      project.value.remainingAmount > 0 &&
      gallery.value?.payment_required
    );
  });

  const formattedRemainingAmount = computed(() => {
    if (!project.value?.remainingAmount) return null;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(project.value.remainingAmount);
  });

  // Initialize auth when galleryId changes
  const initializeAuth = () => {
    if (galleryId.value) {
      auth.value = useClientAuth("gallery", galleryId.value);
      auth.value?.initializeAuth();
    }
  };

  // Actions
  const reset = () => {
    galleryId.value = null;
    project.value = null;
    gallery.value = null;
    images.value = [];
    loading.value = false;
    loadingMore.value = false;
    error.value = null;
    hasMore.value = true;
    currentPage.value = 1;
    imageSignedUrls.value.clear();
    auth.value = null;
  };

  const loadGallery = async (id: string, page = 1) => {
    if (loading.value) return;

    galleryId.value = id;
    loading.value = true;
    error.value = null;

    // Initialize auth
    initializeAuth();

    try {
      const response = await $fetch<ClientGalleryAccess>(
        `/api/gallery/client/${id}`,
        {
          query: { page, pageSize: 20 },
        }
      );

      project.value = response.project;
      gallery.value = response.gallery;
      images.value = Array.from(response.gallery.images || []);
      hasMore.value = response.gallery.hasMore || false;
      currentPage.value = response.gallery.currentPage || 1;

      // Store signed URLs
      imageSignedUrls.value.clear();
      if (response.gallery.images) {
        response.gallery.images.forEach((image) => {
          if (image.signed_url) {
            imageSignedUrls.value.set(image.file_url, image.signed_url);
          }
        });
      }

      // Initialize auth for password-protected projects
      if (response.project.hasPassword && auth.value) {
        auth.value.initializeAuth();
      }

      return response;
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("404")) {
        error.value = new Error("Galerie non trouvée");
      } else if (err instanceof Error && err.message.includes("403")) {
        error.value = new Error("Galerie non accessible");
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
      !galleryId.value ||
      loadingMore.value
    ) {
      return false;
    }

    loadingMore.value = true;

    try {
      const nextPage = currentPage.value + 1;
      const response = await $fetch<ClientGalleryAccess>(
        `/api/gallery/client/${galleryId.value}`,
        {
          query: { page: nextPage, pageSize: 20 },
        }
      );

      if (response.gallery.images && response.gallery.images.length > 0) {
        images.value = [...images.value, ...response.gallery.images];
        hasMore.value = response.gallery.hasMore || false;
        currentPage.value = nextPage;

        // Store signed URLs for new images
        response.gallery.images.forEach((image) => {
          if (image.signed_url) {
            imageSignedUrls.value.set(image.file_url, image.signed_url);
          }
        });

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
    if (!galleryId.value || !auth.value) return false;

    const serverVerify = async (pwd: string) => {
      const response = await $fetch<{ valid: boolean }>(
        `/api/gallery/client/${galleryId.value}/verify`,
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

  const updateGalleryStatus = (status: typeof MODULE_STATUS[keyof typeof MODULE_STATUS]) => {
    if (gallery.value) {
      gallery.value.status = status;
    }
  };

  const updateGalleryRevisionComment = (comment: string) => {
    if (gallery.value) {
      gallery.value.revision_last_comment = comment;
    }
  };

  // Get signed URL for an image
  const getImageSignedUrl = (fileUrl: string) => {
    return imageSignedUrls.value.get(fileUrl) || null;
  };

  return {
    // State
    galleryId: readonly(galleryId),
    project: readonly(project),
    gallery: readonly(gallery),
    images: readonly(images),
    loading: readonly(loading),
    loadingMore: readonly(loadingMore),
    error: readonly(error),
    hasMore: readonly(hasMore),
    currentPage: readonly(currentPage),
    imageSignedUrls: readonly(imageSignedUrls),

    // Auth
    isAuthenticated,
    authError,
    needsPassword,
    verifyPassword,
    logout,

    // Payment
    isBankTransfer,
    isStripePayment,
    hasRemainingAmount,
    formattedRemainingAmount,

    // Actions
    reset,
    loadGallery,
    loadMore,
    updateGalleryStatus,
    updateGalleryRevisionComment,
    getImageSignedUrl,
  };
});
