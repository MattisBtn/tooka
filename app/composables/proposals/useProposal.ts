import { proposalService } from "~/services/proposalService";
import type {
  ProjectPaymentData,
  Proposal,
  ProposalFormData,
} from "~/types/proposal";

export const useProposal = (projectId: string) => {
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const proposal = ref<Proposal | null>(null);
  const isEditMode = computed(() => !!proposal.value);

  // Fetch proposal for project
  const fetchProposal = async () => {
    if (!projectId) return;

    loading.value = true;
    error.value = null;

    try {
      const data = await proposalService.getProposalByProjectId(projectId);
      proposal.value = data;
      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch proposal");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Save proposal (create or update)
   */
  const saveProposal = async (
    formData: ProposalFormData,
    projectData: ProjectPaymentData,
    shouldValidate: boolean = false
  ) => {
    loading.value = true;
    error.value = null;

    try {
      // Prepare proposal data (without payment fields)
      const proposalData = {
        project_id: projectId,
        content_json: formData.content_json,
        content_html: formData.content_html,
        price: formData.price,
        deposit_required: formData.deposit_required,
        deposit_amount: formData.deposit_amount || null,
        contract_url: formData.contract_url || null,
        quote_url: formData.quote_url || null,
        status: "draft" as const,
        revision_last_comment: null,
      };

      let result;
      if (isEditMode.value && proposal.value) {
        result = await proposalService.updateProposal(
          proposal.value.id,
          proposalData,
          shouldValidate
        );
        proposal.value = result.proposal;
      } else {
        result = await proposalService.createProposal(
          proposalData,
          shouldValidate
        );
        proposal.value = result.proposal;
      }

      // Update project payment data if needed
      if (
        projectData.payment_method ||
        projectData.bank_iban ||
        projectData.bank_bic ||
        projectData.bank_beneficiary
      ) {
        const { projectService } = await import("~/services/projectService");
        await projectService.updateProject(projectId, projectData);
      }

      return result;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to save proposal");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Confirm payment (photographe action)
  const confirmPayment = async () => {
    if (!proposal.value) return;

    loading.value = true;
    error.value = null;

    try {
      const updatedProposal = await proposalService.confirmPayment(
        proposal.value.id
      );
      proposal.value = updatedProposal;
      return updatedProposal;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to confirm payment");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Upload file
  const uploadFile = async (file: File, type: "contract" | "quote") => {
    loading.value = true;
    error.value = null;

    try {
      const url = await proposalService.uploadFile(file, projectId, type);
      return url;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to upload file");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete proposal
  const deleteProposal = async () => {
    if (!proposal.value) return;

    loading.value = true;
    error.value = null;

    try {
      await proposalService.deleteProposal(proposal.value.id);
      proposal.value = null;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete proposal");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Get status options
  const getStatusOptions = () => proposalService.getStatusOptions();

  // Get signed URL for file access
  const getFileSignedUrl = async (filePath: string) => {
    if (!filePath) return null;

    try {
      return await proposalService.getSignedUrl(filePath);
    } catch (err) {
      console.error("Failed to get signed URL:", err);
      return null;
    }
  };

  // Delete file from storage
  const deleteFile = async (filePath: string) => {
    loading.value = true;
    error.value = null;

    try {
      await proposalService.deleteFile(filePath);
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete file");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Computed properties
  const hasProposal = computed(() => !!proposal.value);
  const isCompleted = computed(() => proposal.value?.status === "completed");
  const isDraft = computed(() => proposal.value?.status === "draft");
  const isAwaitingClient = computed(
    () => proposal.value?.status === "awaiting_client"
  );
  const isRevisionRequested = computed(
    () => proposal.value?.status === "revision_requested"
  );
  const isPaymentPending = computed(
    () => proposal.value?.status === "payment_pending"
  );

  // Format price
  const formattedPrice = computed(() => {
    if (!proposal.value?.price) return "Non défini";

    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(proposal.value.price);
  });

  // Format deposit amount
  const formattedDepositAmount = computed(() => {
    if (!proposal.value?.deposit_amount) return "Aucun acompte";

    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(proposal.value.deposit_amount);
  });

  // Computed properties for file access
  const contractFileUrl = computed(async () => {
    if (!proposal.value?.contract_url) return null;
    return await getFileSignedUrl(proposal.value.contract_url);
  });

  const quoteFileUrl = computed(async () => {
    if (!proposal.value?.quote_url) return null;
    return await getFileSignedUrl(proposal.value.quote_url);
  });

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    proposal: readonly(proposal),

    // Computed
    isEditMode,
    hasProposal,
    isCompleted,
    isDraft,
    isAwaitingClient,
    isRevisionRequested,
    isPaymentPending,
    formattedPrice,
    formattedDepositAmount,
    contractFileUrl,
    quoteFileUrl,

    // Actions
    fetchProposal,
    saveProposal,
    confirmPayment,
    uploadFile,
    deleteProposal,
    getStatusOptions,
    getFileSignedUrl,
    deleteFile,
  };
};
