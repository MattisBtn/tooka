import { proposalService } from "~/services/proposalService";

export const useProposalFileUpload = () => {
  const contractFile = ref<File | null>(null);
  const quoteFile = ref<File | null>(null);
  const uploading = ref(false);
  const contractUploading = ref(false);
  const quoteUploading = ref(false);

  const isUploading = computed(
    () => uploading.value || contractUploading.value || quoteUploading.value
  );

  const uploadFiles = async (projectId: string) => {
    const urls: { contract_url?: string; quote_url?: string } = {};

    if (contractFile.value) {
      contractUploading.value = true;
      try {
        urls.contract_url = await proposalService.uploadFile(
          contractFile.value,
          projectId,
          "contract"
        );
      } finally {
        contractUploading.value = false;
      }
    }

    if (quoteFile.value) {
      quoteUploading.value = true;
      try {
        urls.quote_url = await proposalService.uploadFile(
          quoteFile.value,
          projectId,
          "quote"
        );
      } finally {
        quoteUploading.value = false;
      }
    }

    return urls;
  };

  const handleContractFileSelect = (file: File) => {
    contractFile.value = file;
  };

  const handleQuoteFileSelect = (file: File) => {
    quoteFile.value = file;
  };

  const removeContractFile = () => {
    contractFile.value = null;
  };

  const removeQuoteFile = () => {
    quoteFile.value = null;
  };

  const initializeWithExistingFiles = (_proposal: {
    contract_url?: string;
    quote_url?: string;
  }) => {
    // Cette méthode est appelée pour initialiser avec des fichiers existants
    // Dans ce cas, nous n'avons pas besoin de faire quoi que ce soit
    // car les URLs sont déjà dans la proposition
  };

  const reset = () => {
    contractFile.value = null;
    quoteFile.value = null;
    uploading.value = false;
    contractUploading.value = false;
    quoteUploading.value = false;
  };

  return {
    contractFile,
    quoteFile,
    uploading: readonly(uploading),
    contractUploading: readonly(contractUploading),
    quoteUploading: readonly(quoteUploading),
    isUploading,
    uploadFiles,
    handleContractFileSelect,
    handleQuoteFileSelect,
    removeContractFile,
    removeQuoteFile,
    initializeWithExistingFiles,
    reset,
  };
};
