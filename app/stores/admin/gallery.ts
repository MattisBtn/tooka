import { defineStore } from "pinia";
import type {
  Gallery,
  GalleryFormData,
  GalleryPricing,
  GalleryUploadResult,
  GalleryWithDetails,
  ProjectPaymentData,
} from "~/types/gallery";
import type { UploadOptions, UploadProgress } from "~/types/upload";

export const useGalleryStore = defineStore("gallery", () => {
  // Core State
  const gallery = ref<GalleryWithDetails | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const isInitialized = ref(false);

  // Pricing State
  const pricing = ref<GalleryPricing | null>(null);

  // Project State
  const project = ref<{
    id: string;
    payment_method: "stripe" | "bank_transfer" | null;
    bank_iban: string | null;
    bank_bic: string | null;
    bank_beneficiary: string | null;
  } | null>(null);

  // Upload State
  const uploadProgress = ref<UploadProgress>({
    isUploading: false,
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
    cancelledFiles: 0,
    currentFiles: [],
    overallProgress: 0,
    canCancel: false,
  });
  const uploadController = ref<AbortController | null>(null);
  const showUploadProgress = ref(false);

  // Modal State
  const showForm = ref(false);
  const selectedGallery = ref<GalleryWithDetails | undefined>(undefined);
  const showDeleteModal = ref(false);
  const galleryToDelete = ref<Gallery | null>(null);
  const deletionLoading = ref(false);
  const formLoading = ref(false);

  // Computed
  const exists = computed(() => !!gallery.value);
  const canEdit = computed(() => {
    if (!gallery.value) return true;
    return (
      gallery.value.status === "draft" ||
      gallery.value.status === "revision_requested"
    );
  });

  const imageCount = computed(() => gallery.value?.images?.length || 0);
  const hasImages = computed(() => imageCount.value > 0);
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);

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

  const formattedRemainingAmount = computed(() => {
    if (!pricing.value?.remainingAmount) return "Gratuit";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(pricing.value.remainingAmount);
  });

  // Upload Actions
  const resetUploadState = () => {
    uploadProgress.value = {
      isUploading: false,
      totalFiles: 0,
      completedFiles: 0,
      failedFiles: 0,
      cancelledFiles: 0,
      currentFiles: [],
      overallProgress: 0,
      canCancel: false,
    };
    uploadController.value = null;
    showUploadProgress.value = false;
  };

  const updateUploadProgress = (progress: UploadProgress) => {
    uploadProgress.value = {
      ...progress,
      currentFiles: [...progress.currentFiles], // Create a mutable copy
    };
  };

  const startUpload = () => {
    uploadController.value = new AbortController();
    showUploadProgress.value = true;
  };

  const finishUpload = () => {
    uploadController.value = null;
    showUploadProgress.value = false;
  };

  const uploadImagesWithProgress = async (
    galleryId: string,
    files: File[]
  ): Promise<GalleryUploadResult> => {
    if (!files.length) {
      throw new Error("Aucun fichier à uploader");
    }

    try {
      startUpload();
      resetUploadState();

      const { galleryService } = await import("~/services/galleryService");

      const options: UploadOptions = {
        maxConcurrent: 4,
        maxRetries: 2,
        onProgress: updateUploadProgress,
        signal: uploadController.value?.signal,
      };

      const result = await galleryService.uploadImagesWithProgress(
        galleryId,
        files,
        options
      );

      return result;
    } finally {
      finishUpload();
    }
  };

  // Actions
  const reset = () => {
    gallery.value = null;
    pricing.value = null;
    project.value = null;
    error.value = null;
    isInitialized.value = false;
    resetUploadState();
  };

  const loadGallery = async (projectId: string) => {
    if (loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const { galleryService } = await import("~/services/galleryService");
      const { projectService } = await import("~/services/projectService");

      const data = await galleryService.getGalleryByProjectId(projectId);

      if (data) {
        gallery.value = data;

        // Fetch pricing information
        const pricingData = await galleryService.calculateGalleryPricing(
          projectId
        );
        pricing.value = pricingData;
      } else {
        gallery.value = null;
        pricing.value = null;
      }

      // Always load project data for payment information
      const projectData = await projectService.getProjectById(projectId);
      if (projectData) {
        project.value = {
          id: projectData.id,
          payment_method: projectData.payment_method,
          bank_iban: projectData.bank_iban,
          bank_bic: projectData.bank_bic,
          bank_beneficiary: projectData.bank_beneficiary,
        };
      }

      isInitialized.value = true;
      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to load gallery");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createGallery = async (
    projectId: string,
    galleryData: GalleryFormData,
    projectData?: ProjectPaymentData,
    files?: File[]
  ) => {
    formLoading.value = true;
    error.value = null;

    try {
      const { galleryService } = await import("~/services/galleryService");
      const { projectService } = await import("~/services/projectService");

      const project = await projectService.getProjectById(projectId);
      const isFree = !project?.initial_price || project.initial_price === 0;

      const data = {
        project_id: projectId,
        selection_id: galleryData.selection_id || null,
        requires_client_validation: galleryData.requires_client_validation,
        status: galleryData.status,
        revision_last_comment: null,
      };

      const result = await galleryService.createGallery(
        data,
        galleryData.status === "awaiting_client"
      );

      // Update project if needed (only for non-free projects)
      if (!isFree && projectData) {
        await projectService.updateProject(projectId, projectData);
      }

      // Upload images if provided with progress tracking
      if (files && files.length > 0) {
        await uploadImagesWithProgress(result.gallery.id, files);
      }

      // Reload data
      await loadGallery(projectId);

      // Check and update project status automatically
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();
      await projectSetupStore.checkAndUpdateProjectStatus();

      // Close form after successful creation
      showForm.value = false;

      return result;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to create gallery");
      throw err;
    } finally {
      formLoading.value = false;
    }
  };

  const updateGallery = async (
    galleryId: string,
    galleryData: GalleryFormData,
    projectData?: ProjectPaymentData,
    files?: File[]
  ) => {
    formLoading.value = true;
    error.value = null;

    try {
      const { galleryService } = await import("~/services/galleryService");
      const { projectService } = await import("~/services/projectService");

      const project = await projectService.getProjectById(
        gallery.value!.project_id
      );
      const isFree = !project?.initial_price || project.initial_price === 0;

      const data = {
        selection_id: galleryData.selection_id || null,
        requires_client_validation: galleryData.requires_client_validation,
        status: galleryData.status,
        revision_last_comment: null,
      };

      const result = await galleryService.updateGallery(
        galleryId,
        data,
        galleryData.status === "awaiting_client"
      );

      // Update project if needed (only for non-free projects)
      if (!isFree && projectData && gallery.value?.project_id) {
        await projectService.updateProject(
          gallery.value.project_id,
          projectData
        );
      }

      // Upload images if provided with progress tracking
      if (files && files.length > 0) {
        await uploadImagesWithProgress(galleryId, files);
      }

      // Reload data
      if (gallery.value?.project_id) {
        await loadGallery(gallery.value.project_id);
      }

      // Check and update project status automatically
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();
      await projectSetupStore.checkAndUpdateProjectStatus();

      // Close form after successful update
      showForm.value = false;

      return result;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to update gallery");
      throw err;
    } finally {
      formLoading.value = false;
    }
  };

  const deleteGallery = async (galleryId: string) => {
    deletionLoading.value = true;
    error.value = null;

    try {
      const { galleryService } = await import("~/services/galleryService");
      await galleryService.deleteGallery(galleryId);

      gallery.value = null;
      pricing.value = null;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete gallery");
      throw err;
    } finally {
      deletionLoading.value = false;
    }
  };

  const deleteImage = async (imageId: string) => {
    loading.value = true;
    error.value = null;

    try {
      const { galleryService } = await import("~/services/galleryService");
      await galleryService.deleteImage(imageId);

      // Reload data
      if (gallery.value?.project_id) {
        await loadGallery(gallery.value.project_id);
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete image");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const confirmPayment = async (galleryId: string) => {
    loading.value = true;
    error.value = null;

    try {
      const { galleryService } = await import("~/services/galleryService");
      const { projectService } = await import("~/services/projectService");

      await galleryService.confirmPayment(galleryId);

      // Update project remaining_amount to 0 since this is the final payment
      // Only for non-free projects
      if (gallery.value?.project_id) {
        const project = await projectService.getProjectById(
          gallery.value.project_id
        );
        const isFree = !project?.initial_price || project.initial_price === 0;

        if (!isFree) {
          await projectService.updateProject(gallery.value.project_id, {
            remaining_amount: 0,
          });
        }
      }

      // Reload data
      if (gallery.value?.project_id) {
        await loadGallery(gallery.value.project_id);
      }

      // Check and update project status automatically
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();
      await projectSetupStore.refreshProject();
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to confirm payment");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const sendToClient = async (galleryId: string) => {
    loading.value = true;
    error.value = null;

    try {
      const { galleryService } = await import("~/services/galleryService");
      // The service will determine the final status based on requires_client_validation
      const updatedGallery = await galleryService.updateGallery(
        galleryId,
        {},
        true // shouldValidate = true to trigger "send to client" logic
      );
      gallery.value = updatedGallery.gallery;

      return {
        gallery: updatedGallery.gallery,
        projectUpdated: updatedGallery.projectUpdated,
      };
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to send to client");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Modal Actions
  const openForm = () => {
    selectedGallery.value = gallery.value || undefined;
    showForm.value = true;
  };

  const closeForm = () => {
    showForm.value = false;
    selectedGallery.value = undefined;
  };

  const openDeleteModal = (gallery: Gallery) => {
    galleryToDelete.value = gallery;
    showDeleteModal.value = true;
  };

  const closeDeleteModal = () => {
    showDeleteModal.value = false;
    galleryToDelete.value = null;
    deletionLoading.value = false;
  };

  return {
    // State (readonly for external access)
    gallery: gallery,
    pricing: pricing,
    project: project,
    loading: loading,
    error: error,
    isInitialized: isInitialized,

    // Upload State
    uploadProgress: uploadProgress,
    showUploadProgress: showUploadProgress,

    // Modal State
    showForm,
    selectedGallery: selectedGallery,
    showDeleteModal,
    galleryToDelete: galleryToDelete,
    deletionLoading: deletionLoading,
    formLoading: formLoading,

    // Computed
    exists,
    canEdit,
    imageCount,
    hasImages,
    isLoading,
    hasError,
    formattedBasePrice,
    formattedDepositPaid,
    formattedRemainingAmount,

    // Actions
    reset,
    loadGallery,
    createGallery,
    updateGallery,
    deleteGallery,
    deleteImage,
    confirmPayment,
    sendToClient,
    openForm,
    closeForm,
    openDeleteModal,
    closeDeleteModal,

    // Upload Actions
    resetUploadState,
    startUpload,
    finishUpload,
    uploadImagesWithProgress,
  };
});
