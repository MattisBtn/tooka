import { defineStore } from "pinia";
import { proposalService } from "~/services/proposalService";
import type {
  ProjectPaymentData,
  Proposal,
  ProposalFormData,
} from "~/types/proposal";
import { formatPrice } from "~/utils/formatters";

export const useProposalStore = defineStore("proposal", () => {
  const proposal = ref<Proposal | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const showForm = ref(false);
  const formLoading = ref(false);

  // Getters
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);
  const exists = computed(() => proposal.value !== null);
  const canEdit = computed(
    () =>
      proposal.value?.status === "draft" ||
      proposal.value?.status === "revision_requested"
  );
  const formattedPrice = computed(() => formatPrice(proposal.value?.price));
  const formattedDepositAmount = computed(() =>
    formatPrice(proposal.value?.deposit_amount)
  );

  // Actions
  const reset = () => {
    proposal.value = null;
    loading.value = false;
    error.value = null;
    showForm.value = false;
    formLoading.value = false;
  };

  const loadProposal = async (projectId: string) => {
    if (loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const data = await proposalService.getProposalByProjectId(projectId);
      proposal.value = data;
      return data;
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        proposal.value = null;
        return null;
      }
      error.value =
        err instanceof Error ? err : new Error("Failed to fetch proposal");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createProposal = async (
    projectId: string,
    proposalData: ProposalFormData,
    projectData?: ProjectPaymentData
  ) => {
    formLoading.value = true;
    error.value = null;

    try {
      const data = {
        project_id: projectId,
        content_json: proposalData.content_json,
        content_html: proposalData.content_html,
        price: proposalData.price,
        deposit_required: proposalData.deposit_required,
        deposit_amount: proposalData.deposit_amount || null,
        contract_url: proposalData.contract_url || null,
        quote_url: proposalData.quote_url || null,
        status: projectData ? ("awaiting_client" as const) : ("draft" as const),
        revision_last_comment: null,
      };

      const result = await proposalService.createProposal(data, !!projectData);
      proposal.value = result.proposal;

      if (projectData) {
        const { projectService } = await import("~/services/projectService");
        await projectService.updateProject(projectId, projectData);
      }

      showForm.value = false;
      return result.proposal;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to create proposal");
      throw err;
    } finally {
      formLoading.value = false;
    }
  };

  const updateProposal = async (
    proposalId: string,
    proposalData: ProposalFormData,
    projectData?: ProjectPaymentData
  ) => {
    formLoading.value = true;
    error.value = null;

    try {
      const data = {
        project_id: proposal.value!.project_id,
        content_json: proposalData.content_json,
        content_html: proposalData.content_html,
        price: proposalData.price,
        deposit_required: proposalData.deposit_required,
        deposit_amount: proposalData.deposit_amount || null,
        contract_url: proposalData.contract_url || null,
        quote_url: proposalData.quote_url || null,
        status: projectData ? ("awaiting_client" as const) : ("draft" as const),
        revision_last_comment: null,
      };

      const result = await proposalService.updateProposal(
        proposalId,
        data,
        !!projectData
      );
      proposal.value = result.proposal;

      if (projectData) {
        const { projectService } = await import("~/services/projectService");
        await projectService.updateProject(
          proposal.value!.project_id,
          projectData
        );
      }

      showForm.value = false;
      return result.proposal;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to update proposal");
      throw err;
    } finally {
      formLoading.value = false;
    }
  };

  const deleteProposal = async (proposalId: string) => {
    loading.value = true;
    error.value = null;

    try {
      await proposalService.deleteProposal(proposalId);
      proposal.value = null;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to delete proposal");
      throw err;
    } finally {
      loading.value = false;
    }
  };

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

  return {
    proposal: readonly(proposal),
    loading: readonly(loading),
    error: readonly(error),
    showForm,
    formLoading: readonly(formLoading),
    isLoading,
    hasError,
    exists,
    canEdit,
    formattedPrice,
    formattedDepositAmount,
    reset,
    loadProposal,
    createProposal,
    updateProposal,
    deleteProposal,
    confirmPayment,
    openForm: () => (showForm.value = true),
    closeForm: () => (showForm.value = false),
  };
});
