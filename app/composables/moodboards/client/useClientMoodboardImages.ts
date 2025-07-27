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
  const useLazyImageLoading = (
    moodboardId: string,
    filePath: string,
    threshold = 0.1
  ) => {
    const imageUrl = ref<string | null>(null);
    const loading = ref(false);
    const error = ref(false);
    const imageRef = ref<HTMLElement | null>(null);

    const loadImage = async () => {
      if (loading.value || imageUrl.value) return;

      try {
        loading.value = true;
        error.value = false;
        const url = await getImageSignedUrl(moodboardId, filePath);
        imageUrl.value = url;
      } catch (err) {
        console.error("Failed to load image:", err);
        error.value = true;
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      if (!imageRef.value) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold,
          rootMargin: "50px", // Load images 50px before they enter viewport
        }
      );

      observer.observe(imageRef.value);

      onUnmounted(() => {
        observer.disconnect();
      });
    });

    return {
      imageUrl: readonly(imageUrl),
      loading: readonly(loading),
      error: readonly(error),
      imageRef,
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
    clearCache,
  };
};
