import { defineStore } from "pinia";
import type { Tables } from "~/types/database.types";
import type {
  Gallery,
  GalleryFormData,
  GalleryImage,
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

  // Project and Proposal State
  const project = ref<Partial<Tables<"projects">> | null>(null);
  const proposal = ref<Partial<Tables<"proposals">> | null>(null);

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

  // Pricing computed properties - use Supabase calculated values
  const pricing = computed(() => {
    if (!project.value) {
      return {
        basePrice: 0,
        depositPaid: 0,
        remainingAmount: 0,
      };
    }

    // Always use the project's remaining_amount calculated by Supabase
    const basePrice = project.value.initial_price ?? 0;
    const remainingAmount = project.value.remaining_amount ?? basePrice;

    // Calculate deposit paid based on the actual remaining amount
    const depositPaid = Math.max(0, basePrice - remainingAmount);

    return {
      basePrice,
      depositPaid,
      remainingAmount: Math.max(0, remainingAmount),
    };
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
    project.value = null;
    proposal.value = null;
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

      // Try to get existing gallery with details
      const data = await galleryService.getGalleryByProjectIdWithDetails(
        projectId
      );

      if (data) {
        // Gallery exists
        gallery.value = data.gallery;
        project.value = data.project;
        proposal.value = data.proposal;
      } else {
        // No gallery exists yet, load project data for creation
        const projectData =
          await galleryService.getProjectDataForGalleryCreation(projectId);
        gallery.value = null;
        project.value = projectData.project;
        proposal.value = projectData.proposal;
      }

      isInitialized.value = true;
      return data?.gallery || null;
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

      // Use local state for project info
      const isFree =
        !project.value?.initial_price || project.value.initial_price === 0;

      const data = {
        project_id: projectId,
        selection_id: galleryData.selection_id || null,
        requires_client_validation: galleryData.requires_client_validation,
        status: galleryData.status,
        revision_last_comment: null,
        completed_at: null,
      };

      const result = await galleryService.createGallery(
        data,
        galleryData.status === "awaiting_client"
      );

      // Update project payment_method if needed (only for non-free projects)
      if (!isFree && projectData?.payment_method && project.value) {
        await projectService.updateProject(projectId, {
          payment_method: projectData.payment_method,
        });

        // Update local state
        project.value.payment_method = projectData.payment_method;
      }

      // Upload images if provided with progress tracking
      let uploadedImages: GalleryImage[] = [];
      if (files && files.length > 0) {
        const uploadResult = await uploadImagesWithProgress(
          result.gallery.id,
          files
        );
        uploadedImages = uploadResult.uploadedImages;
      }

      // Update gallery state directly with images instead of reloading
      gallery.value = {
        ...result.gallery,
        images: uploadedImages,
        imageCount: uploadedImages.length,
      };

      // Update project data optimistically in projectSetup store
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();
      projectSetupStore.updateProjectModule("gallery", result.gallery);

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

      // Use local state for project info
      const isFree =
        !project.value?.initial_price || project.value.initial_price === 0;

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

      // Update project payment_method if needed (only for non-free projects)
      if (
        !isFree &&
        projectData?.payment_method &&
        gallery.value?.project_id &&
        project.value
      ) {
        await projectService.updateProject(gallery.value.project_id, {
          payment_method: projectData.payment_method,
        });

        // Update local state
        project.value.payment_method = projectData.payment_method;
      }

      // Upload images if provided with progress tracking
      let uploadedImages: GalleryImage[] = [];
      if (files && files.length > 0) {
        const uploadResult = await uploadImagesWithProgress(galleryId, files);
        uploadedImages = uploadResult.uploadedImages;
      }

      // Update gallery state directly with new images
      if (gallery.value) {
        const existingImages = gallery.value.images || [];
        gallery.value = {
          ...result.gallery,
          images: [...existingImages, ...uploadedImages],
          imageCount: existingImages.length + uploadedImages.length,
        };
      }

      // Update project data optimistically in projectSetup store
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();
      projectSetupStore.updateProjectModule("gallery", result.gallery);

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
      const { projectService } = await import("~/services/projectService");

      // Get project ID before deleting gallery
      const projectId = gallery.value?.project_id;

      await galleryService.deleteGallery(galleryId);

      // Clean up project payment_method if no proposal exists
      if (projectId) {
        const projectData = await projectService.getProjectWithProposal(
          projectId
        );
        if (projectData && !projectData.proposal) {
          // No proposal exists, clean up payment_method from project
          await projectService.updateProject(projectId, {
            payment_method: null,
          });
        }
      }

      // Clear local state
      gallery.value = null;
      project.value = null;
      proposal.value = null;

      // Update project data optimistically in projectSetup store
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();
      projectSetupStore.updateProjectModule("gallery", null);
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

      // Update gallery directly instead of reloading
      if (gallery.value) {
        const updatedImages = (gallery.value.images || []).filter(
          (img) => img.id !== imageId
        );
        gallery.value = {
          ...gallery.value,
          images: updatedImages,
          imageCount: updatedImages.length,
        };
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

      const updatedGallery = await galleryService.confirmPayment(galleryId);

      // Update local state
      if (gallery.value) {
        gallery.value = {
          ...gallery.value,
          ...updatedGallery,
        };
      }

      // Update project data optimistically in projectSetup store
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();
      projectSetupStore.updateProjectModule("gallery", updatedGallery);

      return updatedGallery;
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
      const result = await galleryService.updateGallery(
        galleryId,
        {
          requires_client_validation: gallery.value?.requires_client_validation,
        },
        true // shouldValidate = true to trigger "send to client" logic
      );

      // Update local state
      if (gallery.value) {
        gallery.value = {
          ...gallery.value,
          ...result.gallery,
        };
      }

      // Update project data optimistically in projectSetup store
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();
      projectSetupStore.updateProjectModule("gallery", result.gallery);

      return result;
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
    project: project,
    proposal: proposal,
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
    pricing,
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
