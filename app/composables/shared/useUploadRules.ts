export const useUploadRules = () => {
  const imageUploadRules = {
    accept: "image/jpeg, image/png, image/webp",
    maxFiles: 50,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    description:
      "Formats supportés: JPG, PNG, WebP • Max 50 images • 10 MB par image",
  };

  return {
    imageUploadRules,
  };
};
