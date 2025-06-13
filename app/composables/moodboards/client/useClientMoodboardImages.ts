import type { MoodboardComment } from "~/types/moodboard";

export const useClientMoodboardImages = () => {
  // Cache pour éviter de redemander les URLs
  const urlCache = new Map<string, { url: string; expires: number }>();
  const loadingImages = new Set<string>();

  /**
   * Get signed URL for moodboard image (client access)
   */
  const getImageSignedUrl = async (
    moodboardId: string,
    filePath: string
  ): Promise<string | null> => {
    if (!moodboardId || !filePath) return null;

    // Check cache first
    const cacheKey = `${moodboardId}:${filePath}`;
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
        `/api/moodboard/client/${moodboardId}/image/${encodedFilePath}`
      );

      const signedUrl = response.signedUrl;

      // Cache for 50 minutes (signed URLs expire after 1 hour)
      urlCache.set(cacheKey, {
        url: signedUrl,
        expires: now + 50 * 60 * 1000,
      });

      return signedUrl;
    } catch (error) {
      console.error("[DEBUG] Client - Failed to get signed URL:", error);
      return null;
    } finally {
      loadingImages.delete(cacheKey);
    }
  };

  /**
   * Use intersection observer for lazy loading images
   */
  const useLazyImageLoading = (moodboardId: string, filePath: string) => {
    const imageUrl = ref<string | null>(null);
    const loading = ref(false);
    const error = ref(false);
    const imageRef = ref<HTMLElement | null>(null);
    const observerSet = ref(false);

    const loadImage = async () => {
      if (loading.value || imageUrl.value) return;

      try {
        loading.value = true;
        error.value = false;
        const url = await getImageSignedUrl(moodboardId, filePath);
        if (url) {
          imageUrl.value = url;
        } else {
          error.value = true;
        }
      } catch (err) {
        console.error("Failed to load image:", err);
        error.value = true;
      } finally {
        loading.value = false;
      }
    };

    const checkIfInViewport = (element: HTMLElement): boolean => {
      const rect = element.getBoundingClientRect();
      const windowHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const windowWidth =
        window.innerWidth || document.documentElement.clientWidth;

      return (
        rect.top < windowHeight + 100 && // 100px buffer below viewport
        rect.bottom > -100 && // 100px buffer above viewport
        rect.left < windowWidth &&
        rect.right > 0
      );
    };

    // Store observer reference for cleanup
    let currentObserver: IntersectionObserver | null = null;

    const cleanup = () => {
      if (currentObserver) {
        currentObserver.disconnect();
        currentObserver = null;
      }
    };

    // Watch for imageRef changes and set up observer
    watch(
      imageRef,
      (newRef, oldRef) => {
        // Cleanup previous observer
        if (oldRef && currentObserver) {
          cleanup();
          observerSet.value = false;
        }

        if (!newRef || !import.meta.client || observerSet.value) return;

        observerSet.value = true;

        // Check immediately if element is in viewport
        if (checkIfInViewport(newRef)) {
          loadImage();
          return;
        }

        // Only set up observer if IntersectionObserver is supported
        if ("IntersectionObserver" in window) {
          // Create intersection observer
          currentObserver = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting && !imageUrl.value && !loading.value) {
                  loadImage();
                  cleanup(); // Clean up after loading
                }
              });
            },
            {
              threshold: 0, // Trigger as soon as any part becomes visible
              rootMargin: "100px", // Load images 100px before they enter viewport
            }
          );

          currentObserver.observe(newRef);
        } else {
          // Fallback for browsers without IntersectionObserver
          loadImage();
        }
      },
      { immediate: true }
    );

    // Setup cleanup on unmount at the composable level
    onUnmounted(() => {
      cleanup();
    });

    return {
      imageUrl: readonly(imageUrl),
      loading: readonly(loading),
      error: readonly(error),
      imageRef,
    };
  };

  /**
   * Manage image reactions (mocked for now)
   */
  const useImageReactions = (moodboardId: string) => {
    const REACTIONS_KEY = `moodboard_reactions_${moodboardId}`;

    // Local reactions storage (mocked)
    const reactions = ref<Record<string, "love" | "like" | "dislike">>({});

    // Load reactions from localStorage
    const loadReactions = () => {
      if (!import.meta.client) return;

      try {
        const stored = localStorage.getItem(REACTIONS_KEY);
        if (stored) {
          reactions.value = JSON.parse(stored);
        }
      } catch (error) {
        console.warn("Failed to load reactions:", error);
      }
    };

    // Save reactions to localStorage
    const saveReactions = () => {
      if (!import.meta.client) return;

      try {
        localStorage.setItem(REACTIONS_KEY, JSON.stringify(reactions.value));
      } catch (error) {
        console.warn("Failed to save reactions:", error);
      }
    };

    // Set reaction for an image
    const setReaction = (
      imageId: string,
      reaction: "love" | "like" | "dislike"
    ) => {
      if (reactions.value[imageId] === reaction) {
        // Remove reaction if clicking the same one
        const { [imageId]: _, ...newReactions } = reactions.value;
        reactions.value = newReactions;
      } else {
        // Set new reaction
        reactions.value[imageId] = reaction;
      }
      saveReactions();
    };

    // Get reaction for an image
    const getReaction = (
      imageId: string
    ): "love" | "like" | "dislike" | null => {
      return reactions.value[imageId] || null;
    };

    // Get reaction counts (mocked)
    const getReactionCounts = (imageId: string) => {
      const reaction = reactions.value[imageId];
      return {
        love: reaction === "love" ? 1 : 0,
        like: reaction === "like" ? 1 : 0,
        dislike: reaction === "dislike" ? 1 : 0,
      };
    };

    // Initialize reactions
    onMounted(() => {
      loadReactions();
    });

    return {
      reactions: readonly(reactions),
      setReaction,
      getReaction,
      getReactionCounts,
    };
  };

  /**
   * Manage image comments (real implementation)
   */
  const useImageComments = (moodboardId: string) => {
    // Add comment to an image
    const addComment = async (imageId: string, content: string) => {
      try {
        const response = await $fetch<{ comment: MoodboardComment }>(
          `/api/moodboard/client/${moodboardId}/comment`,
          {
            method: "POST",
            body: {
              imageId,
              content,
            },
          }
        );

        return response.comment;
      } catch (error) {
        console.error("Failed to add comment:", error);
        throw error;
      }
    };

    return {
      addComment,
    };
  };

  /**
   * Clear URL cache
   */
  const clearCache = () => {
    urlCache.clear();
    loadingImages.clear();
  };

  return {
    getImageSignedUrl,
    useLazyImageLoading,
    useImageReactions,
    useImageComments,
    clearCache,
  };
};
