/**
 * Composable unifié pour gérer les propositions
 * Remplace useProposal + useProposalForm pour simplifier l'architecture
 * Suit les patterns KISS, YAGNI et DRY
 */
import { proposalService } from "~/services/proposalService";
import type { Database, Json } from "~/types/database.types";

// Types simplifiés basés sur la DB
type ProposalData = Database["public"]["Tables"]["proposals"]["Row"];

interface ProjectPaymentData {
  payment_method: "stripe" | "bank_transfer" | null;
  bank_iban: string | null;
  bank_bic: string | null;
  bank_beneficiary: string | null;
}

export const useProposalManager = (projectId: string) => {
  // État centralisé avec useState
  const proposal = useState<ProposalData | null>(
    `proposal-${projectId}`,
    () => null
  );
  const loading = ref(false);
  const error = ref<string | null>(null);

  // État du formulaire - compatible avec la DB
  const formData = useState(`proposal-form-${projectId}`, () => ({
    content_json: [] as Json,
    content_html: "",
    price: 0,
    deposit_required: false,
    deposit_amount: null as number | null,
    contract_url: null as string | null,
    quote_url: null as string | null,
  }));

  // État des fichiers
  const files = ref<{
    contract: File | null;
    quote: File | null;
  }>({
    contract: null,
    quote: null,
  });

  // Méthodes principales
  const load = async (): Promise<ProposalData | null> => {
    loading.value = true;
    error.value = null;

    try {
      const data = await proposalService.getProposalByProjectId(projectId);
      proposal.value = data;

      // Pré-remplir le formulaire si proposition existe
      if (data) {
        formData.value = {
          content_json: data.content_json,
          content_html: data.content_html,
          price: data.price,
          deposit_required: data.deposit_required,
          deposit_amount: data.deposit_amount,
          contract_url: data.contract_url,
          quote_url: data.quote_url,
        };
      }

      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Erreur de chargement";
      return null;
    } finally {
      loading.value = false;
    }
  };

  const save = async (
    projectData?: ProjectPaymentData,
    shouldValidate = false
  ): Promise<ProposalData> => {
    loading.value = true;
    error.value = null;

    try {
      // Upload fichiers d'abord si nécessaire
      await uploadFiles();

      // Préparer les données
      const proposalData = {
        project_id: projectId,
        content_json: formData.value.content_json,
        content_html: formData.value.content_html,
        price: formData.value.price,
        deposit_required: formData.value.deposit_required,
        deposit_amount: formData.value.deposit_amount,
        contract_url: formData.value.contract_url,
        quote_url: formData.value.quote_url,
        status: shouldValidate
          ? ("awaiting_client" as const)
          : ("draft" as const),
        revision_last_comment: null,
      };

      let result;
      if (proposal.value?.id) {
        // Mise à jour
        result = await proposalService.updateProposal(
          proposal.value.id,
          proposalData,
          shouldValidate
        );
      } else {
        // Création
        result = await proposalService.createProposal(
          proposalData,
          shouldValidate
        );
      }

      // Mettre à jour le projet si nécessaire
      if (projectData) {
        const { projectService } = await import("~/services/projectService");
        await projectService.updateProject(projectId, projectData);
      }

      // Mettre à jour l'état
      proposal.value = result.proposal;

      return result.proposal;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Erreur de sauvegarde";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const remove = async (): Promise<void> => {
    if (!proposal.value?.id) return;

    loading.value = true;
    error.value = null;

    try {
      await proposalService.deleteProposal(proposal.value.id);
      proposal.value = null;
      formData.value = {
        content_json: [] as Json,
        content_html: "",
        price: 0,
        deposit_required: false,
        deposit_amount: null,
        contract_url: null,
        quote_url: null,
      };
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Erreur de suppression";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const confirmPayment = async (): Promise<void> => {
    if (!proposal.value?.id) return;

    loading.value = true;
    try {
      const updated = await proposalService.confirmPayment(proposal.value.id);
      proposal.value = updated;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Erreur de confirmation";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Gestion simplifiée des fichiers
  const setFile = (type: "contract" | "quote", file: File | null) => {
    files.value[type] = file;
  };

  const uploadFiles = async (): Promise<void> => {
    const uploads: Promise<void>[] = [];

    if (files.value.contract) {
      uploads.push(
        proposalService
          .uploadFile(files.value.contract, projectId, "contract")
          .then((url) => {
            formData.value.contract_url = url;
          })
      );
    }

    if (files.value.quote) {
      uploads.push(
        proposalService
          .uploadFile(files.value.quote, projectId, "quote")
          .then((url) => {
            formData.value.quote_url = url;
          })
      );
    }

    await Promise.all(uploads);
  };

  // Computed helpers
  const exists = computed(() => !!proposal.value);
  const isEditing = computed(() => !!proposal.value?.id);
  const canEdit = computed(
    () =>
      !proposal.value ||
      ["draft", "revision_requested"].includes(proposal.value.status)
  );

  const formattedPrice = computed(() => {
    if (!proposal.value?.price) return "Non défini";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(proposal.value.price);
  });

  const formattedDepositAmount = computed(() => {
    if (!proposal.value?.deposit_amount) return "Aucun acompte";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(proposal.value.deposit_amount);
  });

  const statusInfo = computed(() => {
    if (!proposal.value) return null;

    const statusMap = {
      draft: {
        color: "neutral",
        label: "Brouillon",
        icon: "i-lucide-file-text",
      },
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
        color: "info",
        label: "Paiement en attente",
        icon: "i-lucide-credit-card",
      },
      completed: {
        color: "success",
        label: "Acceptée",
        icon: "i-lucide-check-circle",
      },
    };

    return statusMap[proposal.value.status] || null;
  });

  return {
    // État
    proposal: readonly(proposal),
    formData,
    files: readonly(files),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    load,
    save,
    remove,
    confirmPayment,
    setFile,

    // Computed
    exists,
    isEditing,
    canEdit,
    formattedPrice,
    formattedDepositAmount,
    statusInfo,
  };
};
