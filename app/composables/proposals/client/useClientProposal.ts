import type { ClientProposalAccess, PaymentResponse } from "~/types/proposal";

/**
 * Simplified Client Authentication Composable
 */
export const useClientAuth = (resourceType: string, resourceId: string) => {
  const AUTH_KEY = `${resourceType}_auth_${resourceId}`;

  const isAuthenticated = ref(false);
  const authError = ref<string | null>(null);

  // Check if project has password
  const hasStoredAuth = (): boolean => {
    if (!import.meta.client) return false;
    try {
      return localStorage.getItem(AUTH_KEY) === "authenticated";
    } catch {
      return false;
    }
  };

  // Set authenticated state
  const setAuthenticated = (authenticated: boolean) => {
    isAuthenticated.value = authenticated;

    if (import.meta.client) {
      try {
        if (authenticated) {
          localStorage.setItem(AUTH_KEY, "authenticated");
        } else {
          localStorage.removeItem(AUTH_KEY);
        }
      } catch {
        // Ignore storage errors
      }
    }
  };

  // Initialize from storage
  const initializeAuth = () => {
    if (hasStoredAuth()) {
      isAuthenticated.value = true;
    }
  };

  // Verify password
  const verifyPassword = async (
    password: string,
    verifyFn: (password: string) => Promise<boolean>
  ): Promise<boolean> => {
    try {
      authError.value = null;

      const isValid = await verifyFn(password);

      if (isValid) {
        setAuthenticated(true);
        return true;
      } else {
        authError.value = "Mot de passe incorrect";
        return false;
      }
    } catch {
      authError.value = "Erreur lors de la vérification";
      return false;
    }
  };

  // Logout
  const logout = () => {
    setAuthenticated(false);
    authError.value = null;
  };

  return {
    isAuthenticated: readonly(isAuthenticated),
    authError: readonly(authError),
    setAuthenticated,
    initializeAuth,
    verifyPassword,
    logout,
    hasStoredAuth,
  };
};

export const useClientProposal = async (proposalId: string) => {
  const loading = ref(true);
  const error = ref<Error | null>(null);

  // Use simplified auth
  const auth = useClientAuth("proposal", proposalId);

  // Fetch data
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

  // Computed properties
  const project = computed(() => data.value?.project || null);
  const proposal = computed(() => data.value?.proposal || null);

  // Simple logic: if no password required, always authenticated
  const isAuthenticated = computed(() => {
    return !project.value?.hasPassword || auth.isAuthenticated.value;
  });

  const needsPassword = computed(() => {
    return project.value?.hasPassword && !auth.isAuthenticated.value;
  });

  // Formatted prices
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

  // Initialize auth for password-protected projects
  watch(
    data,
    (newData) => {
      if (newData?.project.hasPassword) {
        auth.initializeAuth();
      }
    },
    { immediate: true }
  );

  if (fetchError.value) {
    error.value = fetchError.value;
  }

  loading.value = pending.value;

  // UI states
  const showValidateDialog = ref(false);
  const showRequestRevisionsDialog = ref(false);
  const showPaymentDialog = ref(false);
  const validatingProposal = ref(false);
  const confirmingPayment = ref(false);
  const requestingRevisions = ref(false);

  // Form state
  const revisionComment = ref("");

  // Password verification
  const verifyPassword = async (password: string) => {
    const serverVerify = async (pwd: string) => {
      const result = await $fetch<{ valid: boolean }>(
        `/api/proposal/client/${proposalId}/verify`,
        {
          method: "POST",
          body: { password: pwd },
        }
      );
      return result.valid;
    };

    return await auth.verifyPassword(password, serverVerify);
  };

  // Actions
  const validateProposal = async () => {
    if (!proposal.value) return;
    try {
      validatingProposal.value = true;
      await $fetch(`/api/proposal/client/${proposal.value.id}/validate`, {
        method: "POST",
      });
      await reloadNuxtApp();
    } catch (error) {
      console.error("Failed to validate proposal:", error);
    } finally {
      validatingProposal.value = false;
      showValidateDialog.value = false;
    }
  };

  const requestRevisions = async () => {
    if (!proposal.value) return;
    try {
      requestingRevisions.value = true;
      await $fetch(
        `/api/proposal/client/${proposal.value.id}/request-revisions`,
        {
          method: "POST",
          body: { comment: revisionComment.value },
        }
      );
      await reloadNuxtApp();
    } catch (error) {
      console.error("Failed to request revisions:", error);
    } finally {
      requestingRevisions.value = false;
      showRequestRevisionsDialog.value = false;
      revisionComment.value = "";
    }
  };

  const confirmPayment = async () => {
    if (!proposal.value?.deposit_required || !proposal.value?.deposit_amount)
      return;
    try {
      confirmingPayment.value = true;
      await $fetch<PaymentResponse>(
        `/api/proposal/client/${proposal.value.id}/payment`,
        {
          method: "POST",
          body: { method: "bank_transfer" },
        }
      );
      await reloadNuxtApp();
    } catch (err) {
      console.error("Failed to confirm payment:", err);
      throw err;
    } finally {
      confirmingPayment.value = false;
    }
  };

  // File view methods - get signed URLs and open
  const getFileUrl = async (
    fileType: "contract" | "quote"
  ): Promise<string | null> => {
    if (!proposal.value) return null;

    try {
      const response = await $fetch<{
        success: boolean;
        files: { type: string; url: string }[];
      }>(`/api/proposal/client/${proposal.value.id}/files`);

      if (response.success) {
        const file = response.files.find((f) => f.type === fileType);
        return file?.url || null;
      }

      return null;
    } catch (error) {
      console.error(`Error getting ${fileType} URL:`, error);
      return null;
    }
  };

  const viewContract = async () => {
    if (!proposal.value?.contract_url) return;

    try {
      const url = await getFileUrl("contract");
      if (url) {
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Error opening contract:", error);
    }
  };

  const viewQuote = async () => {
    if (!proposal.value?.quote_url) return;

    try {
      const url = await getFileUrl("quote");
      if (url) {
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Error opening quote:", error);
    }
  };

  // Action handlers
  const handleValidate = () => {
    showValidateDialog.value = true;
  };

  const handleRequestRevisions = () => {
    showRequestRevisionsDialog.value = true;
  };

  const handlePayDeposit = () => {
    showPaymentDialog.value = true;
  };

  return {
    // Core data
    project: readonly(project),
    proposal: readonly(proposal),
    loading: readonly(loading),
    error: readonly(error),
    isAuthenticated,
    authError: auth.authError,
    needsPassword,

    // Action states
    validatingProposal: readonly(validatingProposal),
    requestingRevisions: readonly(requestingRevisions),
    confirmingPayment: readonly(confirmingPayment),

    // Modal states
    showValidateDialog,
    showRequestRevisionsDialog,
    showPaymentDialog,

    // Form state
    revisionComment,

    // Computed
    formattedPrice,
    formattedDepositAmount,
    hasDeposit,

    // Actions
    verifyPassword,
    validateProposal,
    requestRevisions,
    confirmPayment,

    // File actions
    viewContract,
    viewQuote,

    // Action handlers
    handleValidate,
    handleRequestRevisions,
    handlePayDeposit,

    // Auth
    logout: auth.logout,
  };
};
