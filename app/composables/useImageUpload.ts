/**
 * Generic Image Upload Composable
 * Handles drag & drop, file validation, and preview generation
 */

interface UseImageUploadOptions {
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  initialFiles?: File[];
}

export const useImageUpload = (options: UseImageUploadOptions = {}) => {
  const {
    maxFiles = 200,
    maxFileSize = 10 * 1024 * 1024, // 10MB
    initialFiles = [],
  } = options;

  // Reactive state
  const selectedFiles = ref<File[]>([...initialFiles]);
  const errors = ref<string[]>([]);
  const isDragOver = ref(false);

  // File validation
  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return `${file.name}: Type de fichier non supporté (images uniquement)`;
    }

    if (file.size > maxFileSize) {
      return `${file.name}: Fichier trop volumineux (max ${formatFileSize(
        maxFileSize
      )})`;
    }

    return null;
  };

  // Add files with validation
  const addFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    // Check total file count
    if (selectedFiles.value.length + fileArray.length > maxFiles) {
      newErrors.push(`Nombre maximum d'images dépassé (max ${maxFiles})`);
      return;
    }

    // Validate each file
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        // Check for duplicates
        const isDuplicate = selectedFiles.value.some(
          (existingFile) =>
            existingFile.name === file.name && existingFile.size === file.size
        );
        if (!isDuplicate) {
          validFiles.push(file);
        } else {
          newErrors.push(`${file.name}: Image déjà sélectionnée`);
        }
      }
    }

    // Update state
    errors.value = newErrors;
    selectedFiles.value.push(...validFiles);

    // Clear errors after a delay if files were successfully added
    if (validFiles.length > 0 && newErrors.length === 0) {
      setTimeout(() => {
        errors.value = [];
      }, 3000);
    }
  };

  // Remove a specific file
  const removeFile = (index: number) => {
    selectedFiles.value.splice(index, 1);
    errors.value = []; // Clear errors when manually removing files
  };

  // Clear all files
  const clearFiles = () => {
    selectedFiles.value = [];
    errors.value = [];
  };

  // Handle file input change
  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      addFiles(target.files);
      target.value = ""; // Reset input
    }
  };

  // Handle drag and drop
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    isDragOver.value = true;
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    isDragOver.value = false;
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    isDragOver.value = false;
    if (event.dataTransfer?.files) {
      addFiles(event.dataTransfer.files);
    }
  };

  // Utility methods
  const getFilePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Update files from external source
  const updateFiles = (newFiles: File[]) => {
    selectedFiles.value = [...newFiles];
  };

  // Cleanup object URLs
  const cleanup = () => {
    selectedFiles.value.forEach((file) => {
      try {
        URL.revokeObjectURL(getFilePreview(file));
      } catch {
        // Ignore errors during cleanup
      }
    });
  };

  return {
    // State
    selectedFiles: readonly(selectedFiles),
    errors: readonly(errors),
    isDragOver: readonly(isDragOver),

    // Methods
    addFiles,
    removeFile,
    clearFiles,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    updateFiles,
    cleanup,

    // Utilities
    getFilePreview,
    formatFileSize,

    // Config
    maxFiles,
    maxFileSize,
  };
};
