import {
  formatFileSize,
  getSelectionAcceptedFormats,
  uploadConfig,
} from "~/utils/uploadConfig";

export const useUploadRules = () => {
  const imageUploadRules = {
    accept: uploadConfig.moodboard.acceptedFormats,
    maxFiles: uploadConfig.moodboard.maxFiles,
    maxFileSize: uploadConfig.moodboard.maxFileSize,
    description: uploadConfig.moodboard.description,
  };

  const selectionUploadRules = {
    accept: getSelectionAcceptedFormats(),
    maxFiles: uploadConfig.selection.maxFiles,
    maxFileSize: uploadConfig.selection.maxFileSize,
    description: uploadConfig.selection.description,
  };

  const galleryUploadRules = {
    accept: uploadConfig.gallery.acceptedFormats,
    maxFiles: uploadConfig.gallery.maxFiles,
    maxFileSize: uploadConfig.gallery.maxFileSize,
    description: uploadConfig.gallery.description,
  };

  return {
    imageUploadRules,
    selectionUploadRules,
    galleryUploadRules,
    uploadConfig,
    formatFileSize,
  };
};
