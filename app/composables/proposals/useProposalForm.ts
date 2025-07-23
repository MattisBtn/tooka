import type { ProposalComponent } from "~/composables/proposals/useProposalContentBuilder";
import { proposalService } from "~/services/proposalService";
import {
  projectPaymentSchema,
  proposalFormSchema,
  type ProjectPaymentData,
  type Proposal,
  type ProposalFormData,
} from "~/types/proposal";

// Interface for existing file info
interface ExistingFileInfo {
  name: string;
  path: string;
  isExisting: true;
}

interface Project {
  id: string;
  payment_method: "stripe" | "bank_transfer" | null;
  bank_iban: string | null;
  bank_bic: string | null;
  bank_beneficiary: string | null;
}

export const useProposalForm = (
  proposal?: Proposal,
  project?: Project,
  projectInitialPrice?: number
) => {
  const isEditMode = computed(() => !!proposal);

  // Proposal form state (données de la proposition)
  const proposalState = reactive<ProposalFormData>({
    content_json: (Array.isArray(proposal?.content_json)
      ? proposal.content_json
      : []) as unknown as ProposalComponent[],
    content_html: proposal?.content_html || "",
    price: proposal?.price || projectInitialPrice || 0,
    deposit_required: proposal?.deposit_required || false,
    deposit_amount: proposal?.deposit_amount || null,
    contract_url: proposal?.contract_url || null,
    quote_url: proposal?.quote_url || null,
  });

  // Project payment state (données de paiement du projet)
  const projectState = reactive<ProjectPaymentData>({
    payment_method: project?.payment_method || null,
    bank_iban: project?.bank_iban || null,
    bank_bic: project?.bank_bic || null,
    bank_beneficiary: project?.bank_beneficiary || null,
  });

  // Combined state for backward compatibility and form validation
  const state = computed(() => ({
    ...proposalState,
    ...projectState,
  }));

  // Schemas
  const proposalSchema = proposalFormSchema;
  const paymentSchema = projectPaymentSchema;

  // File upload states - can hold File objects or existing file info
  const contractFile = ref<File | ExistingFileInfo | null>(null);
  const quoteFile = ref<File | ExistingFileInfo | null>(null);
  const contractUploading = ref(false);
  const quoteUploading = ref(false);

  // Initialize with existing files if in edit mode
  if (proposal) {
    if (proposal.contract_url) {
      contractFile.value = {
        name: extractFilenameFromPath(proposal.contract_url),
        path: proposal.contract_url,
        isExisting: true,
      };
    }
    if (proposal.quote_url) {
      quoteFile.value = {
        name: extractFilenameFromPath(proposal.quote_url),
        path: proposal.quote_url,
        isExisting: true,
      };
    }
  }

  // Utility function to extract filename from path
  function extractFilenameFromPath(filePath: string): string {
    const parts = filePath.split("/");
    const filename = parts[parts.length - 1];

    if (!filename) {
      return "unknown_file";
    }

    // Remove timestamp prefix if present (e.g., "contract_1703123456789.pdf" -> "contract.pdf")
    const match = filename.match(/^(contract|quote)_\d+\.(.+)$/);
    if (match && match[1] && match[2]) {
      return `${match[1]}.${match[2]}`;
    }

    return filename;
  }

  // Watch deposit_required to reset related fields when disabled
  watch(
    () => proposalState.deposit_required,
    (newValue) => {
      if (!newValue) {
        proposalState.deposit_amount = null;
        projectState.payment_method = null;
        projectState.bank_iban = null;
        projectState.bank_bic = null;
        projectState.bank_beneficiary = null;
      }
    }
  );

  // Watch payment_method to reset bank details when not bank_transfer
  watch(
    () => projectState.payment_method,
    (newValue) => {
      if (newValue !== "bank_transfer") {
        projectState.bank_iban = null;
        projectState.bank_bic = null;
        projectState.bank_beneficiary = null;
      }
    }
  );

  // File upload functions
  const handleContractFileSelect = (file: File) => {
    contractFile.value = file;
    // Reset URL when new file selected
    proposalState.contract_url = null;
  };

  const handleQuoteFileSelect = (file: File) => {
    quoteFile.value = file;
    // Reset URL when new file selected
    proposalState.quote_url = null;
  };

  // Upload files and update state with URLs
  const uploadFiles = async (projectId: string): Promise<void> => {
    const uploadPromises: Promise<void>[] = [];

    // Upload contract file if exists and is not an existing file
    if (contractFile.value && !("isExisting" in contractFile.value)) {
      contractUploading.value = true;
      uploadPromises.push(
        proposalService
          .uploadFile(contractFile.value, projectId, "contract")
          .then((url: string) => {
            proposalState.contract_url = url;
            contractUploading.value = false;
          })
      );
    }

    // Upload quote file if exists and is not an existing file
    if (quoteFile.value && !("isExisting" in quoteFile.value)) {
      quoteUploading.value = true;
      uploadPromises.push(
        proposalService
          .uploadFile(quoteFile.value, projectId, "quote")
          .then((url: string) => {
            proposalState.quote_url = url;
            quoteUploading.value = false;
          })
      );
    }

    await Promise.all(uploadPromises);
  };

  // Remove file functions
  const removeContractFile = () => {
    contractFile.value = null;
    proposalState.contract_url = null;
  };

  const removeQuoteFile = () => {
    quoteFile.value = null;
    proposalState.quote_url = null;
  };

  // Computed properties
  const hasContractFile = computed(
    () => !!proposalState.contract_url || !!contractFile.value
  );
  const hasQuoteFile = computed(
    () => !!proposalState.quote_url || !!quoteFile.value
  );
  const isUploading = computed(
    () => contractUploading.value || quoteUploading.value
  );

  // Calculate deposit percentage
  const depositPercentage = computed(() => {
    if (
      !proposalState.deposit_amount ||
      !proposalState.price ||
      proposalState.price === 0
    )
      return 0;
    return Math.round(
      (proposalState.deposit_amount / proposalState.price) * 100
    );
  });

  // Set deposit amount from percentage
  const setDepositFromPercentage = (percentage: number) => {
    if (proposalState.price > 0) {
      proposalState.deposit_amount = Math.round(
        (proposalState.price * percentage) / 100
      );
    }
  };

  // Quick deposit buttons (common percentages)
  const quickDepositOptions = [
    { label: "20%", value: 20 },
    { label: "30%", value: 30 },
    { label: "50%", value: 50 },
  ];

  // Payment method options for USelectMenu
  const paymentMethodOptions = [
    { value: "stripe", label: "Stripe (Carte bancaire)", disabled: true },
    { value: "bank_transfer", label: "Virement bancaire" },
  ];

  return {
    // State
    proposalState,
    projectState,
    state,
    proposalSchema,
    paymentSchema,
    isEditMode,

    // File handling
    contractFile,
    quoteFile,
    contractUploading: readonly(contractUploading),
    quoteUploading: readonly(quoteUploading),
    isUploading,

    // Computed
    hasContractFile,
    hasQuoteFile,
    depositPercentage,
    quickDepositOptions,
    paymentMethodOptions,

    // Actions
    handleContractFileSelect,
    handleQuoteFileSelect,
    uploadFiles,
    removeContractFile,
    removeQuoteFile,
    setDepositFromPercentage,
  };
};
