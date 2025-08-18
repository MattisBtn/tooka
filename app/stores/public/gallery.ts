import { defineStore } from "pinia";
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
  const currentPage = ref(1);
  const totalImages = ref(0);
  const pageSize = ref(20);

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
      project.value?.remainingAmount && project.value.remainingAmount > 0
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
    error.value = null;
    currentPage.value = 1;
    totalImages.value = 0;
    imageSignedUrls.value.clear();
    auth.value = null;
  };

  const loadGallery = async (id: string) => {
    if (loading.value) return;

    galleryId.value = id;
    loading.value = true;
    error.value = null;

    initializeAuth();

    try {
      const response = await $fetch<ClientGalleryAccess>(
        `/api/gallery/client/${id}`,
        { query: { page: 1, pageSize: 20 } }
      );

      project.value = response.project;
      gallery.value = response.gallery;
      images.value = [...(response.gallery.images || [])];
      currentPage.value = 1;
      totalImages.value = response.gallery.imageCount || 0;

      // Store signed URLs
      imageSignedUrls.value.clear();
      (response.gallery.images || []).forEach((image) => {
        if (image.signed_url) {
          imageSignedUrls.value.set(image.file_url, image.signed_url);
        }
      });

      if (response.project.hasPassword && auth.value) {
        auth.value.initializeAuth();
      }
    } catch (err: unknown) {
      let errorMessage = "Erreur lors du chargement";

      if (err instanceof Error) {
        if (err.message.includes("404") || err.message.includes("not found")) {
          errorMessage = "Galerie non trouvée";
        } else if (
          err.message.includes("403") ||
          err.message.includes("forbidden")
        ) {
          errorMessage = "Galerie non accessible";
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
    if (loading.value || !galleryId.value) return;

    loading.value = true;

    try {
      const response = await $fetch<ClientGalleryAccess>(
        `/api/gallery/client/${galleryId.value}`,
        {
          query: { page, pageSize: pageSize.value },
        }
      );

      // Update all properties atomically
      images.value = [...(response.gallery.images || [])];
      currentPage.value = page;
      totalImages.value = response.gallery.imageCount || 0;

      // Store signed URLs for new images
      imageSignedUrls.value.clear();
      (response.gallery.images || []).forEach((image) => {
        if (image.signed_url) {
          imageSignedUrls.value.set(image.file_url, image.signed_url);
        }
      });
    } catch (err) {
      console.error("Failed to load page:", err);
    } finally {
      loading.value = false;
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

  const updateGalleryStatus = (
    status:
      | "draft"
      | "awaiting_client"
      | "revision_requested"
      | "completed"
      | "payment_pending"
  ) => {
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
    error: readonly(error),
    currentPage: readonly(currentPage),
    totalImages: readonly(totalImages),
    pageSize: readonly(pageSize),
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
    loadPage,
    updateGalleryStatus,
    updateGalleryRevisionComment,
    getImageSignedUrl,
  };
});
