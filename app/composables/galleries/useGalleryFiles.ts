import { galleryService } from "~/services/galleryService";

export const useGalleryFiles = () => {
  const loading = ref(false);
  const error = ref<Error | null>(null);

  // Cache for signed URLs to avoid regenerating them frequently
  const urlCache = new Map<string, { url: string; expires: number }>();

  /**
   * Get signed URL with caching
   */
  const getSignedUrl = async (
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string | null> => {
    if (!filePath) return null;

    // Check cache first
    const cached = urlCache.get(filePath);
    const now = Date.now();

    if (cached && cached.expires > now) {
      return cached.url;
    }

    loading.value = true;
    error.value = null;

    try {
      const signedUrl = await galleryService.getImageSignedUrl(
        filePath,
        expiresIn
      );

      // Cache the URL (expire 5 minutes before actual expiry for safety)
      urlCache.set(filePath, {
        url: signedUrl,
        expires: now + (expiresIn - 300) * 1000,
      });

      return signedUrl;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to get image URL");
      console.error("Failed to get signed URL:", err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Download image with proper filename
   */
  const downloadImage = async (filePath: string, filename?: string) => {
    const signedUrl = await getSignedUrl(filePath);
    if (!signedUrl) return;

    try {
      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error("Failed to download image");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename || extractFilenameFromPath(filePath);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to download image");
      throw err;
    }
  };

  /**
   * Open image in new tab
   */
  const openImage = async (filePath: string) => {
    const signedUrl = await getSignedUrl(filePath);
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    }
  };

  /**
   * Delete image and clear cache
   */
  const deleteImage = async (imageId: string) => {
    loading.value = true;
    error.value = null;

    try {
      await galleryService.deleteImage(imageId);
      // Clear all cached URLs since we don't know which one was deleted
      urlCache.clear();
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete image");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Upload images to gallery
   */
  const uploadImages = async (galleryId: string, files: File[]) => {
    loading.value = true;
    error.value = null;

    try {
      const uploadedImages = await galleryService.uploadImages(
        galleryId,
        files
      );
      return uploadedImages;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to upload images");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Clear URL cache
   */
  const clearCache = () => {
    urlCache.clear();
  };

  /**
   * Extract filename from storage path
   */
  const extractFilenameFromPath = (filePath: string): string => {
    const parts = filePath.split("/");
    const filename = parts[parts.length - 1];

    if (!filename) {
      return "unknown_image";
    }

    // Remove timestamp prefix if present
    const match = filename.match(/^image_\d+\.(.+)$/);
    if (match && match[1]) {
      return `image.${match[1]}`;
    }

    return filename;
  };

  /**
   * Get image display name
   */
  const getImageDisplayName = (filePath: string): string => {
    const filename = extractFilenameFromPath(filePath);
    return `Image - ${filename}`;
  };

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    getSignedUrl,
    downloadImage,
    openImage,
    deleteImage,
    uploadImages,
    clearCache,

    // Utilities
    extractFilenameFromPath,
    getImageDisplayName,
  };
};
