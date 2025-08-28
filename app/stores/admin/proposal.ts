import { defineStore } from "pinia";
import { proposalService } from "~/services/proposalService";
import type { Json } from "~/types/database.types";
import type { NotionBlock } from "~/types/notion";
import type {
  ProjectPaymentData,
  ProposalFormData,
  ProposalWithProject,
} from "~/types/proposal";

export const useProposalStore = defineStore("proposal", () => {
  const proposal = ref<ProposalWithProject | null>(null);
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
    isProjectFree: boolean
  ) => {
    formLoading.value = true;
    error.value = null;

    try {
      const data = {
        project_id: projectId,
        content_json: proposalData.content_json,
        content_html: proposalData.content_html,
        price: isProjectFree ? 0 : proposalData.price,
        deposit_required: isProjectFree ? false : proposalData.deposit_required,
        deposit_amount: isProjectFree
          ? null
          : proposalData.deposit_amount || null,
        contract_url: proposalData.contract_url || null,
        quote_url: proposalData.quote_url || null,
        status: "draft" as const,
        revision_last_comment: null,
        completed_at: null,
      };

      const result = await proposalService.createProposal(data);
      proposal.value = result;

      // Update project payment method if deposit is required and method is selected
      if (
        !isProjectFree &&
        proposalData.deposit_required &&
        projectData.payment_method
      ) {
        // Import at the top level to avoid deep instantiation
        const projectService = await import("~/services/projectService").then(
          (m) => m.projectService
        );
        await projectService.updateProject(projectId, {
          payment_method: projectData.payment_method,
        });

        // Update local project state for reactivity
        if (proposal.value?.project) {
          proposal.value.project.payment_method = projectData.payment_method;
        }
      }

      // Update project data optimistically in projectSetup store
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();

      // Update proposal module optimistically
      projectSetupStore.updateProjectModule("proposal", result);

      // Update payment method if deposit is required
      if (
        !isProjectFree &&
        proposalData.deposit_required &&
        projectData.payment_method
      ) {
        projectSetupStore.updateProject({
          payment_method: projectData.payment_method,
        });
      }

      return result;
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
    isProjectFree: boolean
  ) => {
    formLoading.value = true;
    error.value = null;

    try {
      const data = {
        project_id: proposal.value!.project_id,
        content_json: proposalData.content_json,
        content_html: proposalData.content_html,
        price: isProjectFree ? 0 : proposalData.price,
        deposit_required: isProjectFree ? false : proposalData.deposit_required,
        deposit_amount: isProjectFree
          ? null
          : proposalData.deposit_amount || null,
        contract_url: proposalData.contract_url || null,
        quote_url: proposalData.quote_url || null,
        revision_last_comment: null,
      };

      const result = await proposalService.updateProposal(proposalId, data);
      proposal.value = result;

      // Update project payment method if deposit is required and method is selected
      if (
        !isProjectFree &&
        proposalData.deposit_required &&
        projectData.payment_method
      ) {
        // Import at the top level to avoid deep instantiation
        const projectService = await import("~/services/projectService").then(
          (m) => m.projectService
        );
        await projectService.updateProject(proposal.value!.project_id, {
          payment_method: projectData.payment_method,
        });

        // Update local project state for reactivity
        if (proposal.value?.project) {
          proposal.value.project.payment_method = projectData.payment_method;
        }
      }

      // Update project data optimistically in projectSetup store
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();

      // Update proposal module optimistically
      projectSetupStore.updateProjectModule("proposal", result);

      // Update payment method if deposit is required
      if (
        !isProjectFree &&
        proposalData.deposit_required &&
        projectData.payment_method
      ) {
        projectSetupStore.updateProject({
          payment_method: projectData.payment_method,
        });
      }

      return result;
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
      // Get project ID before deleting proposal
      const projectId = proposal.value?.project_id;

      await proposalService.deleteProposal(proposalId);

      // Clean up project payment_method if no gallery exists
      if (projectId) {
        const projectService = await import("~/services/projectService").then(
          (m) => m.projectService
        );

        // Check if gallery exists for this project
        const { galleryService } = await import("~/services/galleryService");
        const gallery = await galleryService.getGalleryByProjectId(projectId);

        if (!gallery) {
          // No gallery exists, clean up payment_method from project
          await projectService.updateProject(projectId, {
            payment_method: null,
          });
        }
      }

      proposal.value = null;

      // Update project data optimistically in projectSetup store
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();
      projectSetupStore.updateProjectModule("proposal", null);
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

      // Update project data optimistically in projectSetup store
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();
      projectSetupStore.updateProjectModule("proposal", updatedProposal);

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
    if (!proposal.value) return;

    loading.value = true;
    error.value = null;

    try {
      const result = await proposalService.updateProposal(proposal.value.id, {
        status: "awaiting_client",
      });
      proposal.value = result;

      // Update project data optimistically in projectSetup store
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();
      projectSetupStore.updateProjectModule("proposal", result);

      return result;
    } catch (err) {
      error.value =
        err instanceof Error ? err : new Error("Failed to send to client");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateProposalContent = async (
    proposalId: string,
    content_json: NotionBlock[],
    content_html: string
  ) => {
    formLoading.value = true;
    error.value = null;

    try {
      // Optimistic update
      if (proposal.value) {
        proposal.value.content_json = content_json;
        proposal.value.content_html = content_html;
      }

      // Update in database
      const result = await proposalService.updateProposal(proposalId, {
        content_json: content_json as unknown as Json[],
        content_html,
      });

      // Update with server response to ensure consistency
      proposal.value = result;

      // Update project data optimistically in projectSetup store
      const { useProjectSetupStore } = await import(
        "~/stores/admin/projectSetup"
      );
      const projectSetupStore = useProjectSetupStore();
      projectSetupStore.updateProjectModule("proposal", result);

      return result;
    } catch (err) {
      error.value =
        err instanceof Error
          ? err
          : new Error("Failed to update proposal content");

      // Revert optimistic update on error
      if (proposal.value) {
        // We could reload the proposal here, but for now just throw
        console.error(
          "Failed to update proposal content, optimistic update reverted"
        );
      }

      throw err;
    } finally {
      formLoading.value = false;
    }
  };

  const uploadFiles = async (
    projectId: string,
    contractFile?: File,
    quoteFile?: File
  ): Promise<{ contract_url?: string; quote_url?: string }> => {
    const urls: { contract_url?: string; quote_url?: string } = {};

    if (contractFile) {
      urls.contract_url = await proposalService.uploadFile(
        contractFile,
        projectId,
        "contract"
      );
    }
    if (quoteFile) {
      urls.quote_url = await proposalService.uploadFile(
        quoteFile,
        projectId,
        "quote"
      );
    }

    // Update local state to maintain consistency
    if (proposal.value) {
      if (urls.contract_url) {
        proposal.value.contract_url = urls.contract_url;
      }
      if (urls.quote_url) {
        proposal.value.quote_url = urls.quote_url;
      }
    }

    return urls;
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
    reset,
    loadProposal,
    createProposal,
    updateProposal,
    updateProposalContent,
    deleteProposal,
    confirmPayment,
    sendToClient,
    uploadFiles,
    openForm: () => (showForm.value = true),
    closeForm: () => (showForm.value = false),
  };
});
