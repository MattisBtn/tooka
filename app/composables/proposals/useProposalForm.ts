import {
  proposalFormSchema,
  type Proposal,
  type ProposalFormData,
} from "~/types/proposal";

// Interface for existing file info
interface ExistingFileInfo {
  name: string;
  path: string;
  isExisting: true;
}

export const useProposalForm = (
  proposal?: Proposal,
  projectInitialPrice?: number
) => {
  const isEditMode = computed(() => !!proposal);

  // Form state
  const state = reactive<ProposalFormData>({
    title: proposal?.title || "",
    description: proposal?.description || "",
    price: proposal?.price || projectInitialPrice || 0,
    deposit_required: proposal?.deposit_required || false,
    deposit_amount: proposal?.deposit_amount || null,
    contract_url: proposal?.contract_url || null,
    quote_url: proposal?.quote_url || null,
    template_id: proposal?.template_id || null,
    status: proposal?.status || "draft",
  });

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

  // Watch deposit_required to reset deposit_amount when disabled
  watch(
    () => state.deposit_required,
    (newValue) => {
      if (!newValue) {
        state.deposit_amount = null;
      }
    }
  );

  // Validation schema
  const schema = proposalFormSchema;

  // Handle file selection
  const handleContractFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      contractFile.value = files[0] || null;
    }
  };

  const handleQuoteFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      quoteFile.value = files[0] || null;
    }
  };

  // Upload files and update URLs in state
  const uploadFiles = async (
    uploadFileFn: (file: File, type: "contract" | "quote") => Promise<string>
  ) => {
    const uploadPromises: Promise<void>[] = [];

    // Handle contract file
    if (contractFile.value) {
      if ("isExisting" in contractFile.value) {
        // It's an existing file, keep the current URL
        state.contract_url = contractFile.value.path;
      } else {
        // It's a new File object, upload it
        contractUploading.value = true;
        uploadPromises.push(
          uploadFileFn(contractFile.value, "contract")
            .then((url) => {
              state.contract_url = url;
              contractFile.value = null;
            })
            .finally(() => {
              contractUploading.value = false;
            })
        );
      }
    }

    // Handle quote file
    if (quoteFile.value) {
      if ("isExisting" in quoteFile.value) {
        // It's an existing file, keep the current URL
        state.quote_url = quoteFile.value.path;
      } else {
        // It's a new File object, upload it
        quoteUploading.value = true;
        uploadPromises.push(
          uploadFileFn(quoteFile.value, "quote")
            .then((url) => {
              state.quote_url = url;
              quoteFile.value = null;
            })
            .finally(() => {
              quoteUploading.value = false;
            })
        );
      }
    }

    await Promise.all(uploadPromises);
  };

  // Remove file URLs
  const removeContractFile = () => {
    state.contract_url = null;
    contractFile.value = null;
  };

  const removeQuoteFile = () => {
    state.quote_url = null;
    quoteFile.value = null;
  };

  // Computed properties
  const hasContractFile = computed(
    () => !!state.contract_url || !!contractFile.value
  );
  const hasQuoteFile = computed(() => !!state.quote_url || !!quoteFile.value);
  const isUploading = computed(
    () => contractUploading.value || quoteUploading.value
  );

  // Calculate deposit percentage
  const depositPercentage = computed(() => {
    if (!state.deposit_amount || !state.price || state.price === 0) return 0;
    return Math.round((state.deposit_amount / state.price) * 100);
  });

  // Set deposit amount from percentage
  const setDepositFromPercentage = (percentage: number) => {
    if (state.price > 0) {
      state.deposit_amount = Math.round((state.price * percentage) / 100);
    }
  };

  // Quick deposit buttons (common percentages)
  const quickDepositOptions = [
    { label: "20%", value: 20 },
    { label: "30%", value: 30 },
    { label: "50%", value: 50 },
  ];

  return {
    // State
    state,
    schema,
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

    // Actions
    handleContractFileSelect,
    handleQuoteFileSelect,
    uploadFiles,
    removeContractFile,
    removeQuoteFile,
    setDepositFromPercentage,
  };
};
