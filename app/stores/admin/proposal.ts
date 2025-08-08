import { defineStore } from "pinia";
import { proposalService } from "~/services/proposalService";
import type {
  ProjectPaymentData,
  Proposal,
  ProposalFormData,
} from "~/types/proposal";
import { formatPrice } from "~/utils/formatters";
//

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
    projectData: ProjectPaymentData,
    shouldValidate: boolean
  ) => {
    formLoading.value = true;
    error.value = null;

    try {
      // Upload portfolio images before creating proposal
      if (proposalData.content_json) {
        await proposalService.uploadPortfolioImages(
          proposalData.content_json,
          projectId
        );
      }

      const data = {
        project_id: projectId,
        content_json: proposalData.content_json,
        content_html: proposalData.content_html,
        price: proposalData.price,
        deposit_required: proposalData.deposit_required,
        deposit_amount: proposalData.deposit_amount || null,
        contract_url: proposalData.contract_url || null,
        quote_url: proposalData.quote_url || null,
        status: shouldValidate
          ? ("awaiting_client" as const)
          : ("draft" as const),
        revision_last_comment: null,
      };

      const result = await proposalService.createProposal(data, shouldValidate);
      proposal.value = result.proposal;

      // Conditionally update project payment method if deposit is required and a method is selected
      const { projectService } = await import("~/services/projectService");

      if (proposalData.deposit_required && projectData.payment_method) {
        await projectService.updateProject(projectId, {
          payment_method: projectData.payment_method,
        });
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
    projectData: ProjectPaymentData,
    shouldValidate: boolean
  ) => {
    formLoading.value = true;
    error.value = null;

    try {
      // Collect previously stored portfolio image paths to detect removals
      type PortfolioItemLike = { path?: string | null };
      type ComponentWithItems = {
        type?: string;
        items?: PortfolioItemLike[] | null;
      };

      const extractPortfolioPaths = (content: unknown): string[] => {
        if (!Array.isArray(content)) return [];
        const arr = content as ComponentWithItems[];
        const collected: string[] = [];
        for (const c of arr) {
          if (c?.type === "portfolio" && Array.isArray(c.items)) {
            for (const it of c.items) {
              if (it?.path) collected.push(it.path);
            }
          }
        }
        return collected;
      };

      const prevJson: unknown =
        (proposal.value as unknown as { content_json?: unknown } | null)
          ?.content_json ?? [];
      const previousPaths = extractPortfolioPaths(prevJson);

      // Upload portfolio images before updating proposal
      if (proposalData.content_json) {
        await proposalService.uploadPortfolioImages(
          proposalData.content_json,
          proposal.value!.project_id
        );
      }

      // Compute current paths after potential uploads (new items now have path)
      const currJson: unknown =
        (proposalData as unknown as { content_json?: unknown }).content_json ??
        [];
      const currentPaths = extractPortfolioPaths(currJson);
      const currentSet = new Set(currentPaths);
      const removedPaths = previousPaths.filter((p) => !currentSet.has(p));

      const data = {
        project_id: proposal.value!.project_id,
        content_json: proposalData.content_json,
        content_html: proposalData.content_html,
        price: proposalData.price,
        deposit_required: proposalData.deposit_required,
        deposit_amount: proposalData.deposit_amount || null,
        contract_url: proposalData.contract_url || null,
        quote_url: proposalData.quote_url || null,
        status: shouldValidate
          ? ("awaiting_client" as const)
          : ("draft" as const),
        revision_last_comment: null,
      };

      const result = await proposalService.updateProposal(
        proposalId,
        data,
        shouldValidate
      );
      proposal.value = result.proposal;

      // Delete removed portfolio images after successful update to avoid orphan files
      if (removedPaths.length > 0) {
        try {
          await proposalService.deleteFiles(removedPaths);
        } catch {
          // Silently ignore cleanup failures to not block the user flow
        }
      }

      const { projectService } = await import("~/services/projectService");

      if (proposalData.deposit_required && projectData.payment_method) {
        await projectService.updateProject(proposal.value!.project_id, {
          payment_method: projectData.payment_method,
        });
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

  const sendToClient = async () => {
    if (!proposal.value) return { proposal: null, projectUpdated: false };

    loading.value = true;
    error.value = null;

    try {
      const result = await proposalService.updateProposal(
        proposal.value.id,
        {},
        true
      );
      proposal.value = result.proposal;
      return result;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to send to client");
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
    sendToClient,
    openForm: () => (showForm.value = true),
    closeForm: () => (showForm.value = false),
  };
});
