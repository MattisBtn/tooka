import { defineStore } from "pinia";
import type {
  ClientMoodboardAccess,
  MoodboardImageWithInteractions,
} from "~/types/moodboard";

export const useClientMoodboardStore = defineStore("clientMoodboard", () => {
  // Core state
  const moodboardId = ref<string | null>(null);
  const project = ref<ClientMoodboardAccess["project"] | null>(null);
  const moodboard = ref<ClientMoodboardAccess["moodboard"] | null>(null);
  const images = ref<MoodboardImageWithInteractions[]>([]);
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
  const needsPassword = computed(
    () => project.value?.hasPassword && !isAuthenticated.value
  );

  const isAuthenticated = computed(() => {
    if (project.value && !project.value.hasPassword) {
      return true;
    }
    if (!auth.value) return false;
    return auth.value.isAuthenticated;
  });

  const authError = computed(() => {
    if (!auth.value) return null;
    return auth.value.authError;
  });

  const canInteract = computed(() => {
    if (!moodboard.value) return false;
    return (
      moodboard.value.status !== "completed" &&
      moodboard.value.status !== "revision_requested"
    );
  });

  // Initialize auth when moodboardId changes
  const initializeAuth = () => {
    if (moodboardId.value) {
      auth.value = useClientAuth("moodboard", moodboardId.value);
      auth.value?.initializeAuth();
    }
  };

  // Actions
  const reset = () => {
    moodboardId.value = null;
    project.value = null;
    moodboard.value = null;
    images.value = [];
    loading.value = false;
    error.value = null;
    currentPage.value = 1;
    totalImages.value = 0;
    imageSignedUrls.value.clear();
    auth.value = null;
  };

  const loadMoodboard = async (id: string) => {
    if (loading.value) return;

    moodboardId.value = id;
    loading.value = true;
    error.value = null;

    initializeAuth();

    try {
      const response = await $fetch<ClientMoodboardAccess>(
        `/api/moodboard/client/${id}`,
        { query: { page: 1, pageSize: 20 } }
      );

      project.value = response.project;
      moodboard.value = response.moodboard;
      images.value = [...(response.moodboard.images || [])];
      currentPage.value = 1;
      totalImages.value = response.moodboard.imageCount || 0;

      // Store signed URLs
      imageSignedUrls.value.clear();
      (response.moodboard.images || []).forEach((image) => {
        const imageWithUrl = image as MoodboardImageWithInteractions;
        if (imageWithUrl.signed_url) {
          imageSignedUrls.value.set(image.file_url, imageWithUrl.signed_url);
        }
      });

      if (response.project.hasPassword && auth.value) {
        auth.value.initializeAuth();
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("404")) {
        error.value = new Error("Moodboard non trouvé");
      } else if (err instanceof Error && err.message.includes("403")) {
        error.value = new Error("Moodboard non accessible");
      } else {
        error.value = new Error("Erreur lors du chargement");
      }
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadPage = async (page: number) => {
    if (loading.value || !moodboardId.value) return;

    loading.value = true;

    try {
      const response = await $fetch<ClientMoodboardAccess>(
        `/api/moodboard/client/${moodboardId.value}`,
        {
          query: { page, pageSize: pageSize.value },
        }
      );

      // Update all properties atomically
      images.value = [...(response.moodboard.images || [])];
      currentPage.value = page;
      totalImages.value = response.moodboard.imageCount || 0;

      // Store signed URLs for new images
      imageSignedUrls.value.clear();
      (response.moodboard.images || []).forEach((image) => {
        const imageWithUrl = image as MoodboardImageWithInteractions;
        if (imageWithUrl.signed_url) {
          imageSignedUrls.value.set(image.file_url, imageWithUrl.signed_url);
        }
      });
    } catch (err) {
      console.error("Failed to load page:", err);
    } finally {
      loading.value = false;
    }
  };

  const verifyPassword = async (password: string) => {
    if (!moodboardId.value || !auth.value) return false;

    const serverVerify = async (pwd: string) => {
      const response = await $fetch<{ valid: boolean }>(
        `/api/moodboard/client/${moodboardId.value}/verify`,
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

  const updateMoodboardStatus = (
    status:
      | "draft"
      | "awaiting_client"
      | "revision_requested"
      | "completed"
  ) => {
    if (moodboard.value) {
      moodboard.value.status = status;
    }
  };

  const updateMoodboardRevisionComment = (comment: string) => {
    if (moodboard.value) {
      moodboard.value.revision_last_comment = comment;
    }
  };

  // Get signed URL for an image
  const getImageSignedUrl = (fileUrl: string) => {
    return imageSignedUrls.value.get(fileUrl) || null;
  };

  return {
    // State
    moodboardId: readonly(moodboardId),
    project: readonly(project),
    moodboard: readonly(moodboard),
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

    // Computed
    canInteract,

    // Actions
    reset,
    loadMoodboard,
    loadPage,
    updateMoodboardStatus,
    updateMoodboardRevisionComment,
    getImageSignedUrl,
  };
});
