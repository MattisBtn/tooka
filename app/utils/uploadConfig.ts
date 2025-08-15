// Configuration centralisée pour les règles d'upload
// Variables d'environnement avec valeurs par défaut

export const uploadConfig = {
  // Moodboard configuration
  moodboard: {
    maxFiles: parseInt(process.env.NUXT_MOODBOARD_MAX_FILES || "50"),
    maxFileSize: parseInt(
      process.env.NUXT_MOODBOARD_MAX_FILE_SIZE || "10485760"
    ), // 10MB en bytes
    acceptedFormats:
      process.env.NUXT_ACCEPTED_IMAGE_FORMATS ||
      "image/jpeg, image/png, image/webp",
    description:
      "Formats supportés: JPG, PNG, WebP • Max 50 images • 10 MB par image",
  },

  // Selection configuration (supports RAW formats)
  selection: {
    maxFiles: parseInt(process.env.NUXT_SELECTION_MAX_FILES || "200"),
    maxFileSize: parseInt(
      process.env.NUXT_SELECTION_MAX_FILE_SIZE || "104857600"
    ), // 100MB en bytes
    acceptedFormats: process.env.NUXT_ACCEPTED_IMAGE_FORMATS || "image/*",
    rawFormats:
      process.env.NUXT_ACCEPTED_RAW_FORMATS ||
      ".nef,.dng,.raw,.cr2,.arw,.raf,.orf,.rw2,.crw,.pef,.srw,.x3f",
    description:
      "Formats supportés: JPG, PNG, WebP, ARW, CR2, DNG, NEF, RAW • Max 200 images • 100 MB par image",
  },

  // Gallery configuration
  gallery: {
    maxFiles: parseInt(process.env.NUXT_GALLERY_MAX_FILES || "200"),
    maxFileSize: parseInt(
      process.env.NUXT_GALLERY_MAX_FILE_SIZE || "104857600"
    ), // 100MB en bytes
    acceptedFormats: process.env.NUXT_ACCEPTED_IMAGE_FORMATS || "image/*",
    description:
      "Formats supportés: JPG, PNG, WebP • Max 200 images • 100 MB par image",
  },
};

// Helper function to get full accepted formats for selection (images + RAW)
export const getSelectionAcceptedFormats = () => {
  return `${uploadConfig.selection.acceptedFormats},${uploadConfig.selection.rawFormats}`;
};

// Helper function to format file size for display
export const formatFileSize = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return `${mb} MB`;
};
