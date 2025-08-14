/**
 * Generic upload service utilities
 * Provides reusable upload logic with progress tracking
 */

import type {
  UploadConfig,
  UploadFileStatus,
  UploadOptions,
  UploadProgress,
  UploadResult,
} from "~/types/upload";

export interface ImageCreateData {
  [key: string]: any;
}

export interface ImageRepository<T> {
  create(data: ImageCreateData): Promise<T>;
}

/**
 * Generic upload function with progress tracking and parallel processing
 */
export async function uploadImagesWithProgress<T>(
  entityId: string,
  files: File[],
  config: UploadConfig,
  imageRepository: ImageRepository<T>,
  imageDataFactory: (entityId: string, filePath: string) => ImageCreateData,
  options: UploadOptions = {}
): Promise<UploadResult<T>> {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  if (!user.value) {
    throw new Error("Vous devez être connecté pour uploader des images");
  }

  if (!files.length) {
    throw new Error("Aucun fichier sélectionné");
  }

  // Setup options with defaults
  const {
    maxConcurrent = 4,
    maxRetries = 2,
    onProgress,
    onFileComplete,
    signal,
  } = options;

  // Initialize progress tracking
  const startTime = Date.now();
  const fileStatuses: UploadFileStatus[] = files.map((file) => ({
    file,
    filename: file.name,
    status: "pending",
    progress: 0,
    retryCount: 0,
  }));

  const updateProgress = () => {
    const completed = fileStatuses.filter((f) => f.status === "success").length;
    const failed = fileStatuses.filter((f) => f.status === "error").length;
    const cancelled = fileStatuses.filter(
      (f) => f.status === "cancelled"
    ).length;
    const uploading = fileStatuses.filter(
      (f) => f.status === "uploading"
    ).length;

    const overallProgress = Math.round((completed / files.length) * 100);
    const elapsedTime = (Date.now() - startTime) / 1000;
    const uploadSpeed = completed > 0 ? completed / elapsedTime : 0;
    const estimatedTimeRemaining =
      uploadSpeed > 0
        ? Math.round((files.length - completed) / uploadSpeed)
        : undefined;

    const progress: UploadProgress = {
      isUploading:
        uploading > 0 || fileStatuses.some((f) => f.status === "pending"),
      totalFiles: files.length,
      completedFiles: completed,
      failedFiles: failed,
      cancelledFiles: cancelled,
      currentFiles: [...fileStatuses],
      overallProgress,
      estimatedTimeRemaining,
      uploadSpeed: uploadSpeed * 1000, // Convert to files per second
      canCancel: !signal?.aborted,
      startTime,
    };

    onProgress?.(progress);
  };

  // Upload single file with retry logic
  const uploadSingleFile = async (
    fileStatus: UploadFileStatus
  ): Promise<T | null> => {
    const { file } = fileStatus;

    // Check for cancellation
    if (signal?.aborted) {
      fileStatus.status = "cancelled";
      updateProgress();
      return null;
    }

    // Validate file type
    const allowedTypes = config.allowedTypes || ["image/*"];
    const isValidType = allowedTypes.some((type) => {
      if (type.endsWith("/*")) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isValidType) {
      fileStatus.status = "error";
      fileStatus.error = "Type de fichier non supporté";
      updateProgress();
      onFileComplete?.(fileStatus);
      return null;
    }

    // Validate file size
    const maxSize = config.maxFileSize || 100 * 1024 * 1024; // 100MB default
    if (file.size > maxSize) {
      fileStatus.status = "error";
      fileStatus.error = `Fichier trop volumineux (max ${Math.round(
        maxSize / 1024 / 1024
      )}MB)`;
      updateProgress();
      onFileComplete?.(fileStatus);
      return null;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        fileStatus.status = "uploading";
        fileStatus.retryCount = attempt;
        updateProgress();

        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `${config.pathPrefix(
          user.value!.id,
          entityId
        )}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(config.bucketName)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        // Create database record
        const imageData = imageDataFactory(entityId, filePath);
        const image = await imageRepository.create(imageData);

        fileStatus.status = "success";
        fileStatus.progress = 100;
        fileStatus.uploadedUrl = filePath;
        updateProgress();
        onFileComplete?.(fileStatus);

        return image;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Erreur inconnue");

        // If it's the last attempt or we're cancelled, mark as failed
        if (attempt === maxRetries || signal?.aborted) {
          fileStatus.status = signal?.aborted ? "cancelled" : "error";
          fileStatus.error = lastError.message;
          updateProgress();
          onFileComplete?.(fileStatus);
          return null;
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }

    return null;
  };

  // Process uploads in chunks to limit concurrent uploads
  const results: (T | null)[] = [];
  const chunks = [];

  for (let i = 0; i < files.length; i += maxConcurrent) {
    chunks.push(fileStatuses.slice(i, i + maxConcurrent));
  }

  // Initial progress update
  updateProgress();

  // Process each chunk sequentially, but files within chunk in parallel
  for (const chunk of chunks) {
    if (signal?.aborted) break;

    const chunkResults = await Promise.allSettled(chunk.map(uploadSingleFile));

    results.push(
      ...chunkResults.map((result) =>
        result.status === "fulfilled" ? result.value : null
      )
    );
  }

  // Final progress update
  updateProgress();

  // Compile results
  const uploadedImages = results.filter((img): img is T => img !== null);
  const failedUploads = fileStatuses
    .filter((f) => f.status === "error")
    .map((f) => ({
      filename: f.filename,
      error: f.error || "Erreur inconnue",
    }));

  const result: UploadResult<T> = {
    success: uploadedImages.length > 0,
    uploadedImages,
    failedUploads,
    totalAttempted: files.length,
    totalSucceeded: uploadedImages.length,
    totalFailed: failedUploads.length,
  };

  // Throw error only if no images were uploaded successfully
  if (uploadedImages.length === 0 && files.length > 0) {
    throw new Error(
      `Aucune image n'a pu être uploadée. Erreurs: ${failedUploads
        .map((f) => f.error)
        .join(", ")}`
    );
  }

  return result;
}
