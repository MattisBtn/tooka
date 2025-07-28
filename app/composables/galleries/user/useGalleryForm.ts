import {
  galleryFormSchema,
  type Gallery,
  type GalleryFormData,
  type GalleryImage,
  type GalleryPricing,
  type ProjectPaymentData,
} from "~/types/gallery";

// Interface pour les infos de paiement de la proposition
interface ProposalPaymentInfo {
  payment_method: "stripe" | "bank_transfer" | null;
  deposit_required: boolean;
  deposit_amount: number | null;
}

// Interface pour les données du projet
interface Project {
  id: string;
  payment_method: "stripe" | "bank_transfer" | null;
  bank_iban: string | null;
  bank_bic: string | null;
  bank_beneficiary: string | null;
}

export const useGalleryForm = (
  gallery?: Gallery,
  existingImages?: GalleryImage[],
  pricing?: GalleryPricing,
  proposalPaymentInfo?: ProposalPaymentInfo,
  project?: Project
) => {
  const isEditMode = computed(() => !!gallery);

  // Form state
  const state = reactive<GalleryFormData>({
    payment_required:
      gallery?.payment_required ??
      (pricing ? pricing.remainingAmount > 0 : true),
    selection_id: gallery?.selection_id || null,
    status: gallery?.status || "draft",
  });

  // Project payment state (données de paiement du projet)
  const projectState = reactive<ProjectPaymentData>({
    payment_method: project?.payment_method || null,
    bank_iban: project?.bank_iban || null,
    bank_bic: project?.bank_bic || null,
    bank_beneficiary: project?.bank_beneficiary || null,
  });

  // Payment method info from proposal
  const paymentMethodInfo = computed(() => {
    if (!proposalPaymentInfo?.payment_method) return null;

    const methodLabels = {
      stripe: "Carte bancaire (Stripe)",
      bank_transfer: "Virement bancaire",
    };

    return {
      method: proposalPaymentInfo.payment_method,
      label: methodLabels[proposalPaymentInfo.payment_method],
    };
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

  // Check if payment information is required but missing
  const isPaymentInfoRequired = computed(() => {
    return state.payment_required && pricing && pricing.remainingAmount > 0;
  });

  const isPaymentInfoMissing = computed(() => {
    if (!isPaymentInfoRequired.value) return false;

    // Si payment_method est bank_transfer, vérifier que les coordonnées bancaires sont renseignées
    if (projectState.payment_method === "bank_transfer") {
      return (
        !projectState.bank_iban ||
        !projectState.bank_bic ||
        !projectState.bank_beneficiary
      );
    }

    // Si payment_method n'est pas défini, les informations sont manquantes
    return !projectState.payment_method;
  });

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
    projectState,
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
    paymentMethodInfo,
    isPaymentInfoRequired,
    isPaymentInfoMissing,

    // Pricing data
    pricing: readonly(ref(pricing)),

    // Actions
    addFiles,
    removeFile,
    clearFiles,
    removeExistingImage,
    resetForm,
  };
};
