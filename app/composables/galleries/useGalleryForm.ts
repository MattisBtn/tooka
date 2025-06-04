import {
  galleryFormSchema,
  type Gallery,
  type GalleryFormData,
  type GalleryImage,
  type GalleryPricing,
} from "~/types/gallery";

export const useGalleryForm = (
  gallery?: Gallery,
  existingImages?: GalleryImage[],
  pricing?: GalleryPricing
) => {
  const isEditMode = computed(() => !!gallery);

  // Form state
  const state = reactive<GalleryFormData>({
    payment_required:
      gallery?.payment_required ?? pricing?.paymentRequired ?? true,
    selection_id: gallery?.selection_id || null,
    status: gallery?.status || "draft",
  });

  // File upload states
  const selectedFiles = ref<File[]>([]);
  const uploading = ref(false);
  const uploadProgress = ref(0);

  // Existing images management
  const images = ref<GalleryImage[]>([...(existingImages || [])]);

  // Validation schema
  const schema = galleryFormSchema;

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
      const { useGalleryFiles } = await import("./useGalleryFiles");
      const { deleteImage } = useGalleryFiles();

      await deleteImage(imageId);

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

  // Reset form
  const resetForm = () => {
    selectedFiles.value = [];
    uploadProgress.value = 0;
    uploading.value = false;
  };

  // Computed pricing display
  const formattedBasePrice = computed(() => {
    if (!pricing?.basePrice) return "Non défini";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(pricing.basePrice);
  });

  const formattedDepositPaid = computed(() => {
    if (!pricing?.depositPaid) return "Aucun acompte";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(pricing.depositPaid);
  });

  const formattedRemainingAmount = computed(() => {
    if (!pricing?.remainingAmount) return "Gratuit";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(pricing.remainingAmount);
  });

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
    formattedBasePrice,
    formattedDepositPaid,
    formattedRemainingAmount,

    // Actions
    addFiles,
    removeFile,
    clearFiles,
    removeExistingImage,
    resetForm,
  };
};
