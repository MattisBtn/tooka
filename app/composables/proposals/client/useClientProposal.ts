import type {
  ClientProposalAccess,
  PaymentData,
  PaymentResponse,
} from "~/types/proposal";

export const useClientProposal = async (proposalId: string) => {
  const loading = ref(true);
  const error = ref<Error | null>(null);
  const proposalData = ref<ClientProposalAccess | null>(null);

  // Use proposal authentication composable
  const proposalAuth = useClientAuth("proposal", proposalId);

  // Computed properties
  const project = computed(() => proposalData.value?.project || null);
  const proposal = computed(() => proposalData.value?.proposal || null);
  const needsPassword = computed(
    () => project.value?.hasPassword && !proposalAuth.isAuthenticated.value
  );

  // Formatted price properties
  const formattedPrice = computed(() => {
    if (!proposal.value?.price) return "0,00 €";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(proposal.value.price);
  });

  const formattedDepositAmount = computed(() => {
    if (!proposal.value?.deposit_amount) return null;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(proposal.value.deposit_amount);
  });

  const hasDeposit = computed(() => {
    return (
      proposal.value?.deposit_required &&
      proposal.value?.deposit_amount &&
      proposal.value.deposit_amount > 0
    );
  });

  // Initial fetch of proposal data
  const {
    data,
    pending,
    error: fetchError,
  } = await useFetch<ClientProposalAccess>(
    `/api/proposal/client/${proposalId}`,
    {
      key: `proposal-client-${proposalId}`,
      server: false,
      onResponseError({ response }) {
        console.error(
          "API Response Error:",
          response.status,
          response.statusText
        );
        if (response.status === 404) {
          error.value = new Error("Proposition non trouvée");
        } else if (response.status === 403) {
          error.value = new Error("Proposition non accessible");
        } else {
          error.value = new Error("Erreur lors du chargement");
        }
      },
    }
  );

  // Set initial state based on fetch results
  if (data.value) {
    proposalData.value = data.value;

    // Initialize authentication
    if (!data.value.project.hasPassword) {
      // No password required, authenticate immediately
      await proposalAuth.authenticate("", async () => true);
    } else {
      // Try to restore from stored session
      await proposalAuth.initializeAuth();
    }
  }

  if (fetchError.value) {
    error.value = new Error(
      fetchError.value.message || "Failed to fetch proposal"
    );
  }

  loading.value = pending.value;

  // Reactive states for UI
  const showValidationDialog = ref(false);
  const showRevisionDialog = ref(false);
  const showPaymentDialog = ref(false);
  const validatingProposal = ref(false);
  const payingDeposit = ref(false);
  const requestingRevision = ref(false);

  // Form state
  const revisionComment = ref("");
  const paymentData = ref<PaymentData | null>(null);

  // Pay deposit method
  const payDeposit = async () => {
    if (!proposal.value?.deposit_required || !proposal.value?.deposit_amount)
      return;

    try {
      payingDeposit.value = true;
      const result = await $fetch<PaymentResponse>(
        `/api/proposal/client/${proposal.value.id}/payment`,
        {
          method: "POST",
          body: { method: "bank_transfer" },
        }
      );

      paymentData.value = result.payment;
      showPaymentDialog.value = true;
    } catch (err) {
      console.error("Failed to initiate payment:", err);
      throw err;
    } finally {
      payingDeposit.value = false;
    }
  };

  // Password verification
  const verifyPassword = async (password: string) => {
    const serverVerify = async (pwd: string) => {
      const verificationResult = await $fetch<{ valid: boolean }>(
        `/api/proposal/client/${proposalId}/verify`,
        {
          method: "POST",
          body: { password: pwd },
        }
      );
      return verificationResult.valid;
    };

    return await proposalAuth.authenticate(password, serverVerify);
  };

  // Client actions methods
  const validateProposal = async () => {
    if (!proposal.value) return;

    try {
      validatingProposal.value = true;
      await $fetch(`/api/proposal/client/${proposal.value.id}/validate`, {
        method: "POST",
      });
      // Refresh the page data
      await reloadNuxtApp();
    } catch (error) {
      console.error("Failed to validate proposal:", error);
    } finally {
      validatingProposal.value = false;
      showValidationDialog.value = false;
    }
  };

  const requestRevisions = async () => {
    if (!proposal.value) return;

    try {
      requestingRevision.value = true;
      await $fetch(
        `/api/proposal/client/${proposal.value.id}/request-revisions`,
        {
          method: "POST",
          body: {
            comment: revisionComment.value,
          },
        }
      );
      // Refresh the page data
      await reloadNuxtApp();
    } catch (error) {
      console.error("Failed to request revisions:", error);
    } finally {
      requestingRevision.value = false;
      showRevisionDialog.value = false;
      revisionComment.value = "";
    }
  };

  // Action handlers for components
  const handleValidate = () => {
    showValidationDialog.value = true;
  };

  const handleRequestRevisions = () => {
    showRevisionDialog.value = true;
  };

  const handlePayDeposit = () => {
    payDeposit();
  };

  return {
    // State
    project: readonly(project),
    proposal: readonly(proposal),
    loading: readonly(loading),
    error: readonly(error),
    isAuthenticated: proposalAuth.isAuthenticated,
    authError: proposalAuth.authError,

    // Action states
    validatingProposal: readonly(validatingProposal),
    requestingRevisions: readonly(requestingRevision),
    payingDeposit: readonly(payingDeposit),

    // Modal states
    showValidateDialog: showValidationDialog,
    showRequestRevisionsDialog: showRevisionDialog,
    showPaymentDialog,

    // Form state
    revisionComment,
    paymentData: readonly(paymentData),

    // Computed
    needsPassword,
    formattedPrice,
    formattedDepositAmount,
    hasDeposit,

    // Actions
    verifyPassword,

    // Client actions
    validateProposal,
    requestRevisions,
    payDeposit,

    // Action handlers
    handleValidate,
    handleRequestRevisions,
    handlePayDeposit,

    // Auth methods
    logout: proposalAuth.logout,
  };
};
