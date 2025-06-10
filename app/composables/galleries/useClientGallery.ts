import type { ClientGalleryAccess, GalleryImage } from "~/types/gallery";

export const useClientGallery = async (galleryId: string) => {
  const loading = ref(true);
  const loadingMore = ref(false);
  const error = ref<Error | null>(null);
  const galleryData = ref<ClientGalleryAccess | null>(null);
  const isAuthenticated = ref(false);
  const authError = ref<string | null>(null);
  const images = ref<GalleryImage[]>([]);
  const hasMore = ref(true);
  const currentPage = ref(1);

  // Computed properties
  const project = computed(() => galleryData.value?.project || null);
  const gallery = computed(() => galleryData.value?.gallery || null);
  const needsPassword = computed(
    () => project.value?.hasPassword && !isAuthenticated.value
  );

  // Initial fetch of gallery data (without images for faster loading)
  const {
    data,
    pending,
    error: fetchError,
  } = await useFetch<ClientGalleryAccess>(`/api/gallery/client/${galleryId}`, {
    query: { page: 1, pageSize: 20 },
    server: true,
    lazy: false,
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

  // Set initial data
  if (data.value) {
    galleryData.value = data.value;
    images.value = [...(data.value.gallery.images || [])];
    hasMore.value = data.value.gallery.hasMore || false;
    currentPage.value = data.value.gallery.currentPage || 1;

    // If no password required, authenticate immediately
    if (!data.value.project.hasPassword) {
      isAuthenticated.value = true;
    }
  }

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
    try {
      authError.value = null;

      const verificationResult = await $fetch<{ valid: boolean }>(
        `/api/gallery/client/${galleryId}/verify`,
        {
          method: "POST",
          body: { password },
        }
      );

      if (verificationResult.valid) {
        isAuthenticated.value = true;
        authError.value = null;
        return true;
      } else {
        authError.value = "Mot de passe incorrect";
        return false;
      }
    } catch {
      authError.value = "Erreur lors de la vérification du mot de passe";
      return false;
    }
  };

  return {
    // State
    project: readonly(project),
    gallery: readonly(gallery),
    images: readonly(images),
    loading: readonly(loading),
    loadingMore: readonly(loadingMore),
    error: readonly(error),
    isAuthenticated: readonly(isAuthenticated),
    authError: readonly(authError),
    hasMore: readonly(hasMore),

    // Computed
    needsPassword,

    // Actions
    verifyPassword,
    loadMore,
  };
};
