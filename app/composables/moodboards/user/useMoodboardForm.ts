import {
  moodboardFormSchema,
  type Moodboard,
  type MoodboardFormData,
  type MoodboardImage,
} from "~/types/moodboard";

export const useMoodboardForm = (
  moodboard?: Moodboard,
  existingImages?: MoodboardImage[]
) => {
  const isEditMode = computed(() => !!moodboard);

  // Form state
  const state = reactive<MoodboardFormData>({
    title: moodboard?.title || "",
    description: moodboard?.description || null,
    status: moodboard?.status || "draft",
  });

  // File upload states
  const selectedFiles = ref<File[]>([]);
  const uploading = ref(false);
  const uploadProgress = ref(0);

  // Existing images management
  const images = ref<MoodboardImage[]>([...(existingImages || [])]);

  // Validation schema
  const schema = moodboardFormSchema;

  // Computed properties
  const hasSelectedFiles = computed(() => selectedFiles.value.length > 0);
  const hasExistingImages = computed(() => images.value.length > 0);
  const totalImageCount = computed(
    () => images.value.length + selectedFiles.value.length
  );

  // File handling
  const addFiles = (files: File[]) => {
    selectedFiles.value.push(...files);
  };

  const removeFile = (index: number) => {
    selectedFiles.value.splice(index, 1);
  };

  const clearFiles = () => {
    selectedFiles.value = [];
  };

  // Existing image management
  const removeExistingImage = async (imageId: string) => {
    try {
      const { moodboardService } = await import("~/services/moodboardService");

      await moodboardService.deleteImage(imageId);

      // Remove from local state
      images.value = images.value.filter((img) => img.id !== imageId);

      const toast = useToast();
      toast.add({
        title: "Image supprimée",
        description: "L'image a été supprimée avec succès.",
        icon: "i-lucide-check-circle",
        color: "success",
      });

      return true;
    } catch (err) {
      console.error("Error deleting image:", err);
      const toast = useToast();
      toast.add({
        title: "Erreur",
        description:
          err instanceof Error
            ? err.message
            : "Une erreur est survenue lors de la suppression.",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
      return false;
    }
  };

  // Update image caption
  const updateImageCaption = async (
    imageId: string,
    caption: string | null
  ) => {
    try {
      const { moodboardService } = await import("~/services/moodboardService");

      await moodboardService.updateImageCaption(imageId, caption);

      // Update local state
      const imageIndex = images.value.findIndex((img) => img.id === imageId);
      if (imageIndex !== -1 && images.value[imageIndex]) {
        images.value[imageIndex].caption = caption;
      }

      const toast = useToast();
      toast.add({
        title: "Légende mise à jour",
        description: "La légende de l'image a été mise à jour.",
        icon: "i-lucide-check-circle",
        color: "success",
      });

      return true;
    } catch (err) {
      console.error("Error updating caption:", err);
      const toast = useToast();
      toast.add({
        title: "Erreur",
        description:
          err instanceof Error
            ? err.message
            : "Une erreur est survenue lors de la mise à jour.",
        icon: "i-lucide-alert-circle",
        color: "error",
      });
      return false;
    }
  };

  // Reset form
  const resetForm = () => {
    selectedFiles.value = [];
    uploadProgress.value = 0;
    uploading.value = false;

    // Reset to initial values
    state.title = moodboard?.title || "";
    state.description = moodboard?.description || null;
    state.status = moodboard?.status || "draft";
  };

  // Validate form before submission
  const validateForm = () => {
    const errors: string[] = [];

    if (!state.title?.trim()) {
      errors.push("Le titre est requis");
    }

    if (state.title && state.title.length > 255) {
      errors.push("Le titre est trop long (max 255 caractères)");
    }

    if (state.description && state.description.length > 1000) {
      errors.push("La description est trop longue (max 1000 caractères)");
    }

    return errors;
  };

  return {
    // State
    state,
    schema,
    isEditMode,
    selectedFiles: readonly(selectedFiles),
    images: readonly(images),
    uploading: readonly(uploading),
    uploadProgress: readonly(uploadProgress),

    // Computed
    hasSelectedFiles,
    hasExistingImages,
    totalImageCount,

    // Actions
    addFiles,
    removeFile,
    clearFiles,
    removeExistingImage,
    updateImageCaption,
    resetForm,
    validateForm,
  };
};
