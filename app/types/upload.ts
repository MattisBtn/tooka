/**
 * Generic upload types and interfaces
 * Used by both gallery and moodboard upload systems
 */

// Upload progress types
export interface UploadFileStatus {
  file: File;
  filename: string;
  status: "pending" | "uploading" | "success" | "error" | "cancelled";
  progress: number; // 0-100
  error?: string;
  retryCount?: number;
  uploadedUrl?: string;
}

export interface UploadProgress {
  isUploading: boolean;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  cancelledFiles: number;
  currentFiles: UploadFileStatus[];
  overallProgress: number; // 0-100
  estimatedTimeRemaining?: number; // in seconds
  uploadSpeed?: number; // files per second
  canCancel: boolean;
  startTime?: number;
}

export interface UploadResult<T = any> {
  success: boolean;
  uploadedImages: T[];
  failedUploads: Array<{
    filename: string;
    error: string;
  }>;
  totalAttempted: number;
  totalSucceeded: number;
  totalFailed: number;
}

export interface UploadOptions {
  maxConcurrent?: number; // Maximum concurrent uploads (default: 4)
  maxRetries?: number; // Maximum retry attempts per file (default: 2)
  chunkSize?: number; // For future chunked uploads
  onProgress?: (progress: UploadProgress) => void;
  onFileComplete?: (fileStatus: UploadFileStatus) => void;
  signal?: AbortSignal; // For cancellation
}

// Upload configuration for different contexts
export interface UploadConfig {
  bucketName: string;
  pathPrefix: (userId: string, entityId: string) => string;
  maxFileSize?: number; // in bytes (default: 100MB)
  allowedTypes?: string[]; // MIME types (default: image/*)
}

// Default configurations
export const GALLERY_UPLOAD_CONFIG: UploadConfig = {
  bucketName: "gallery-images",
  pathPrefix: (userId: string, galleryId: string) =>
    `${userId}/galleries/${galleryId}`,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: ["image/*"],
};

export const MOODBOARD_UPLOAD_CONFIG: UploadConfig = {
  bucketName: "moodboard-images",
  pathPrefix: (userId: string, moodboardId: string) =>
    `${userId}/moodboards/${moodboardId}`,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: ["image/*"],
};
