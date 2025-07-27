export interface IAvatarConfig {
  MAX_FILE_SIZE: number;
  ALLOWED_TYPES: string[];
  BUCKET_NAME: string;
  MIN_WIDTH: number;
  MIN_HEIGHT: number;
  MAX_WIDTH: number;
  MAX_HEIGHT: number;
}

export interface IAvatarUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface IAvatarValidationResult {
  valid: boolean;
  error?: string;
}

export interface IAvatarRepository {
  upload(file: File, filePath: string): Promise<IAvatarUploadResult>;
  delete(filePath: string): Promise<void>;
  getPublicUrl(filePath: string): string;
  listUserFiles(userId: string): Promise<string[]>;
}

export interface IAvatarUploadData {
  file: File;
  userId: string;
  fileName?: string;
}

export interface IAvatarFileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

// Configuration par défaut
export const DEFAULT_AVATAR_CONFIG: IAvatarConfig = {
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  BUCKET_NAME: "avatars",
  MIN_WIDTH: 50,
  MIN_HEIGHT: 50,
  MAX_WIDTH: 2048,
  MAX_HEIGHT: 2048,
};
