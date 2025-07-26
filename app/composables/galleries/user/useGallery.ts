import { galleryService } from "~/services/galleryService";
import type {
  GalleryFormData,
  GalleryPricing,
  GalleryWithDetails,
} from "~/types/gallery";

export const useGallery = (projectId: string) => {
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const gallery = ref<GalleryWithDetails | null>(null);
  const pricing = ref<GalleryPricing | null>(null);
  const isEditMode = computed(() => !!gallery.value);

  // Fetch gallery for project
  const fetchGallery = async () => {
    if (!projectId) return;

    loading.value = true;
    error.value = null;

    try {
      const data = await galleryService.getGalleryByProjectId(projectId);
      gallery.value = data;

      // Fetch pricing information
      if (data) {
        const pricingData = await galleryService.calculateGalleryPricing(
          projectId
        );
        pricing.value = pricingData;
      }

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch gallery");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Create or update gallery
  const saveGallery = async (
    formData: GalleryFormData,
    shouldValidate: boolean = false
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const galleryData = {
        project_id: projectId,
        payment_required: formData.payment_required,
        selection_id: formData.selection_id || null,
        status: formData.status,
      };

      let result;
      if (isEditMode.value && gallery.value) {
        result = await galleryService.updateGallery(
          gallery.value.id,
          galleryData,
          shouldValidate
        );
        gallery.value = { ...gallery.value, ...result.gallery };
      } else {
        result = await galleryService.createGallery(
          galleryData,
          shouldValidate
        );
        gallery.value = {
          ...result.gallery,
          images: [],
          imageCount: 0,
        };
      }

      return result;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to save gallery");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Upload images to gallery
  const uploadImages = async (files: File[]) => {
    if (!gallery.value) {
      throw new Error("Gallery must be created first");
    }

    loading.value = true;
    error.value = null;

    try {
      const uploadedImages = await galleryService.uploadImages(
        gallery.value.id,
        files
      );

      // Refresh gallery data to get updated image count
      await fetchGallery();

      return uploadedImages;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to upload images");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete image from gallery
  const deleteImage = async (imageId: string) => {
    loading.value = true;
    error.value = null;

    try {
      await galleryService.deleteImage(imageId);

      // Refresh gallery data
      await fetchGallery();
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete image");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete gallery
  const deleteGallery = async () => {
    if (!gallery.value) return;

    loading.value = true;
    error.value = null;

    try {
      await galleryService.deleteGallery(gallery.value.id);
      gallery.value = null;
      pricing.value = null;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete gallery");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Confirm payment (photographe action)
  const confirmPayment = async () => {
    if (!gallery.value) return;

    loading.value = true;
    error.value = null;

    try {
      const updatedGallery = await galleryService.confirmPayment(
        gallery.value.id
      );
      gallery.value = { ...gallery.value, ...updatedGallery };
      return updatedGallery;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to confirm payment");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Get status options
  const getStatusOptions = () => galleryService.getStatusOptions();

  // Get signed URL for image access
  const getImageSignedUrl = async (filePath: string) => {
    if (!filePath) return null;

    try {
      return await galleryService.getImageSignedUrl(filePath);
    } catch (err) {
      console.error("Failed to get signed URL:", err);
      return null;
    }
  };

  // Computed properties
  const hasGallery = computed(() => !!gallery.value);
  const isCompleted = computed(() => gallery.value?.status === "completed");
  const isDraft = computed(() => gallery.value?.status === "draft");
  const isAwaitingClient = computed(
    () => gallery.value?.status === "awaiting_client"
  );
  const isPaymentPending = computed(
    () => gallery.value?.status === "payment_pending"
  );
  const imageCount = computed(() => gallery.value?.imageCount || 0);
  const hasImages = computed(() => imageCount.value > 0);

  // Format pricing
  const formattedRemainingAmount = computed(() => {
    if (!pricing.value?.remainingAmount) return "Gratuit";

    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(pricing.value.remainingAmount);
  });

  const formattedBasePrice = computed(() => {
    if (!pricing.value?.basePrice) return "Non défini";

    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(pricing.value.basePrice);
  });

  const formattedDepositPaid = computed(() => {
    if (!pricing.value?.depositPaid) return "Aucun acompte";

    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(pricing.value.depositPaid);
  });

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    gallery: readonly(gallery),
    pricing: readonly(pricing),

    // Computed
    isEditMode,
    hasGallery,
    isCompleted,
    isDraft,
    isAwaitingClient,
    isPaymentPending,
    imageCount,
    hasImages,
    formattedRemainingAmount,
    formattedBasePrice,
    formattedDepositPaid,

    // Actions
    fetchGallery,
    saveGallery,
    uploadImages,
    deleteImage,
    deleteGallery,
    confirmPayment,
    getStatusOptions,
    getImageSignedUrl,
  };
};
