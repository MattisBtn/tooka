import { proposalService } from "~/services/proposalService";

export const useProposalFiles = () => {
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
      const signedUrl = await proposalService.getSignedUrl(filePath, expiresIn);

      // Cache the URL (expire 5 minutes before actual expiry for safety)
      urlCache.set(filePath, {
        url: signedUrl,
        expires: now + (expiresIn - 300) * 1000,
      });

      return signedUrl;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to get file URL");
      console.error("Failed to get signed URL:", err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Download file with proper filename
   */
  const downloadFile = async (filePath: string, filename?: string) => {
    const signedUrl = await getSignedUrl(filePath);
    if (!signedUrl) return;

    try {
      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error("Failed to download file");

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
        err instanceof Error ? err : new Error("Failed to download file");
      throw err;
    }
  };

  /**
   * Open file in new tab
   */
  const openFile = async (filePath: string) => {
    const signedUrl = await getSignedUrl(filePath);
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    }
  };

  /**
   * Delete file and clear cache
   */
  const deleteFile = async (filePath: string) => {
    loading.value = true;
    error.value = null;

    try {
      await proposalService.deleteFile(filePath);
      urlCache.delete(filePath);
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete file");
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
      return "unknown_file";
    }

    // Remove timestamp prefix if present (e.g., "contract_1703123456789.pdf" -> "contract.pdf")
    const match = filename.match(/^(contract|quote)_\d+\.(.+)$/);
    if (match && match[1] && match[2]) {
      return `${match[1]}.${match[2]}`;
    }

    return filename;
  };

  /**
   * Get file type from path
   */
  const getFileType = (filePath: string): "contract" | "quote" | "unknown" => {
    if (filePath.includes("/contract_")) return "contract";
    if (filePath.includes("/quote_")) return "quote";
    return "unknown";
  };

  /**
   * Get file display name
   */
  const getFileDisplayName = (filePath: string): string => {
    const type = getFileType(filePath);
    const filename = extractFilenameFromPath(filePath);

    switch (type) {
      case "contract":
        return `Contrat - ${filename}`;
      case "quote":
        return `Devis - ${filename}`;
      default:
        return filename;
    }
  };

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    getSignedUrl,
    downloadFile,
    openFile,
    deleteFile,
    clearCache,

    // Utilities
    extractFilenameFromPath,
    getFileType,
    getFileDisplayName,
  };
};
