import { defineStore } from "pinia";
import { proposalService } from "~/services/proposalService";
import type { ProposalFormData, ProposalWithOptions } from "~/types/proposal";

export const useProposalStore = defineStore("proposal", () => {
  // State
  const proposal = ref<ProposalWithOptions | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const showForm = ref(false);
  const formLoading = ref(false);

  // Getters
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => error.value !== null);
  const exists = computed(() => proposal.value !== null);
  const canEdit = computed(() => {
    if (!proposal.value) return false;
    return (
      proposal.value.status === "draft" ||
      proposal.value.status === "revision_requested"
    );
  });

  const optionCount = computed(() => proposal.value?.options?.length || 0);
  const hasOptions = computed(() => optionCount.value > 0);
  const selectedOption = computed(() => proposal.value?.selected_option);

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
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to load proposal");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createProposal = async (projectId: string, data: ProposalFormData) => {
    if (formLoading.value) return;

    formLoading.value = true;
    error.value = null;

    try {
      const newProposal = await proposalService.createProposal(projectId, data);
      proposal.value = newProposal;
      showForm.value = false;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to create proposal");
      throw err;
    } finally {
      formLoading.value = false;
    }
  };

  const updateProposal = async (proposalId: string, data: ProposalFormData) => {
    if (formLoading.value) return;

    formLoading.value = true;
    error.value = null;

    try {
      const updatedProposal = await proposalService.updateProposal(
        proposalId,
        data
      );
      proposal.value = updatedProposal;
      showForm.value = false;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to update proposal");
      throw err;
    } finally {
      formLoading.value = false;
    }
  };

  const deleteProposal = async (proposalId: string) => {
    if (loading.value) return;

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

  const sendToClient = async (proposalId: string) => {
    if (loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      await proposalService.sendToClient(proposalId);
      proposal.value = { ...proposal.value, status: "awaiting_client" };
    } catch (err) {
      error.value =
        err instanceof Error
          ? err
          : new Error("Failed to send proposal to client");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const openForm = () => {
    showForm.value = true;
  };

  const closeForm = () => {
    showForm.value = false;
  };

  return {
    // State
    proposal: readonly(proposal),
    loading: readonly(loading),
    error: readonly(error),
    showForm: readonly(showForm),
    formLoading: readonly(formLoading),

    // Getters
    isLoading,
    hasError,
    exists,
    canEdit,
    optionCount,
    hasOptions,
    selectedOption,

    // Actions
    reset,
    loadProposal,
    createProposal,
    updateProposal,
    deleteProposal,
    sendToClient,
    openForm,
    closeForm,
  };
});
