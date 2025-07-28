import { computed, readonly, ref } from "vue";
import type { Database } from "~/types/database.types";
import type {
  GalleryFormData,
  GalleryPricing,
  GalleryWithDetails,
  ProjectPaymentData,
} from "~/types/gallery";

type GalleryData = Database["public"]["Tables"]["galleries"]["Row"];

export const useGalleryManager = (projectId: string) => {
  // State
  const loading = ref(false);
  const error = ref<string | null>(null);
  const gallery = ref<GalleryWithDetails | null>(null);
  const pricing = ref<GalleryPricing | null>(null);
  const project = ref<{
    id: string;
    payment_method: "stripe" | "bank_transfer" | null;
    bank_iban: string | null;
    bank_bic: string | null;
    bank_beneficiary: string | null;
  } | null>(null);

  // Computed properties
  const exists = computed(() => !!gallery.value);
  const isEditing = computed(() => false); // Pas d'état d'édition dans ce manager
  const canEdit = computed(() => {
    if (!gallery.value) return true;
    return (
      gallery.value.status === "draft" ||
      gallery.value.status === "revision_requested"
    );
  });

  const imageCount = computed(() => gallery.value?.imageCount || 0);
  const hasImages = computed(() => imageCount.value > 0);

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

  const statusInfo = computed(() => {
    if (!gallery.value) return null;

    const statusOptions: Record<
      string,
      { color: string; label: string; icon: string }
    > = {
      draft: { color: "neutral", label: "Brouillon", icon: "i-lucide-images" },
      awaiting_client: {
        color: "warning",
        label: "En attente client",
        icon: "i-lucide-clock",
      },
      revision_requested: {
        color: "info",
        label: "Révision demandée",
        icon: "i-lucide-edit",
      },
      payment_pending: {
        color: "warning",
        label: "Paiement en attente",
        icon: "i-lucide-credit-card",
      },
      completed: {
        color: "success",
        label: "Terminée",
        icon: "i-lucide-check-circle",
      },
    };

    return statusOptions[gallery.value.status] || null;
  });

  // Actions
  const load = async (): Promise<GalleryWithDetails | null> => {
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

      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const save = async (
    galleryData: GalleryFormData,
    projectData?: ProjectPaymentData,
    files?: File[]
  ): Promise<{ gallery: GalleryData; projectUpdated: boolean }> => {
    loading.value = true;
    error.value = null;

    try {
      const { galleryService } = await import("~/services/galleryService");

      const data = {
        project_id: projectId,
        payment_required: galleryData.payment_required,
        selection_id: galleryData.selection_id || null,
        status: galleryData.status,
      };

      let result;
      if (gallery.value?.id) {
        // Mise à jour
        result = await galleryService.updateGallery(
          gallery.value.id,
          data,
          galleryData.status === "awaiting_client"
        );
      } else {
        // Création
        result = await galleryService.createGallery(
          data,
          galleryData.status === "awaiting_client"
        );
      }

      // Mettre à jour le projet si nécessaire
      if (projectData) {
        const { projectService } = await import("~/services/projectService");
        await projectService.updateProject(projectId, projectData);
      }

      // Upload des images si fournies
      if (files && files.length > 0 && result.gallery.id) {
        await galleryService.uploadImages(result.gallery.id, files);
      }

      // Recharger les données
      await load();

      return {
        gallery: result.gallery,
        projectUpdated: result.projectUpdated,
      };
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const remove = async (): Promise<void> => {
    if (!gallery.value) return;

    loading.value = true;
    error.value = null;

    try {
      const { galleryService } = await import("~/services/galleryService");
      await galleryService.deleteGallery(gallery.value.id);

      gallery.value = null;
      pricing.value = null;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Erreur lors de la suppression";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const uploadImages = async (files: File[]): Promise<void> => {
    if (!gallery.value?.id) return;

    loading.value = true;
    error.value = null;

    try {
      const { galleryService } = await import("~/services/galleryService");
      await galleryService.uploadImages(gallery.value.id, files);

      // Recharger les données
      await load();
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Erreur lors de l'upload";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteImage = async (imageId: string): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const { galleryService } = await import("~/services/galleryService");
      await galleryService.deleteImage(imageId);

      // Recharger les données
      await load();
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Erreur lors de la suppression";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const confirmPayment = async (): Promise<void> => {
    if (!gallery.value) return;

    loading.value = true;
    error.value = null;

    try {
      const { galleryService } = await import("~/services/galleryService");
      await galleryService.confirmPayment(gallery.value.id);

      // Recharger les données
      await load();
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : "Erreur lors de la confirmation du paiement";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    gallery: readonly(gallery),
    pricing: readonly(pricing),
    project: readonly(project),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    load,
    save,
    remove,
    uploadImages,
    deleteImage,
    confirmPayment,

    // Computed
    exists,
    isEditing,
    canEdit,
    imageCount,
    hasImages,
    formattedBasePrice,
    formattedDepositPaid,
    formattedRemainingAmount,
    statusInfo,
  };
};
