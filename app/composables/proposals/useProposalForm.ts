import {
  proposalFormSchema,
  type ProjectPaymentData,
  type ProposalFormData,
} from "~/types/proposal";
import { useProposalComponentManager } from "./useProposalComponentManager";
import type { ProposalComponent } from "./useProposalComponentTypes";
import { useProposalFileUpload } from "./useProposalFileUpload";
import { useProposalHtmlGenerator } from "./useProposalHtmlGenerator";
import { useProposalPricing } from "./useProposalPricing";

interface Project {
  id: string;
  payment_method: "stripe" | "bank_transfer" | null;
  bank_iban: string | null;
  bank_bic: string | null;
  bank_beneficiary: string | null;
  price?: number;
}

export const useProposalForm = (
  proposal?: {
    content_json?: ProposalComponent[];
    content_html?: string;
    price?: number;
    deposit_required?: boolean;
    deposit_amount?: number | null;
    contract_url?: string;
    quote_url?: string;
  },
  project?: Project,
  projectInitialPrice?: number
) => {
  const isEditMode = computed(() => !!proposal);

  // Use specialized composables
  const fileUpload = useProposalFileUpload();
  const pricing = useProposalPricing(
    proposal?.price || project?.price || projectInitialPrice || 0,
    proposal?.deposit_required,
    proposal?.deposit_amount,
    project
  );
  const componentManager = useProposalComponentManager();
  const htmlGenerator = useProposalHtmlGenerator();

  // Initialize with existing data
  if (proposal) {
    fileUpload.initializeWithExistingFiles(proposal);
    componentManager.initializeComponents(proposal.content_json);
  }

  // Proposal form state
  const proposalState = reactive<ProposalFormData>({
    content_json: [...componentManager.components.value],
    content_html: proposal?.content_html || "",
    price: pricing.price.value,
    deposit_required: pricing.depositRequired.value,
    deposit_amount: pricing.depositAmount.value,
    contract_url: proposal?.contract_url || null,
    quote_url: proposal?.quote_url || null,
  });

  // Project payment state
  const projectState = reactive<ProjectPaymentData>({
    payment_method: pricing.projectPayment.payment_method,
    bank_iban: pricing.projectPayment.bank_iban,
    bank_bic: pricing.projectPayment.bank_bic,
    bank_beneficiary: pricing.projectPayment.bank_beneficiary,
  });

  // Watch for changes and update proposal state
  watch(
    componentManager.components,
    (newComponents) => {
      proposalState.content_json = [...newComponents] as ProposalComponent[];
      proposalState.content_html = htmlGenerator.generateHtml([
        ...newComponents,
      ]);
    },
    { deep: true }
  );

  watch(pricing.price, (newPrice) => {
    proposalState.price = newPrice;
  });

  watch(pricing.depositRequired, (newDepositRequired) => {
    proposalState.deposit_required = newDepositRequired;
  });

  watch(pricing.depositAmount, (newDepositAmount) => {
    proposalState.deposit_amount = newDepositAmount;
  });

  // Schemas
  const proposalSchema = proposalFormSchema;

  // Computed for content preview
  const contentPreview = computed(() => {
    if (componentManager.components.value.length === 0) {
      return "Créer le contenu de la proposition";
    }

    const firstTitle = componentManager.components.value.find(
      (c) => c.type === "title"
    )?.content;
    if (firstTitle) {
      return firstTitle.length > 50
        ? firstTitle.substring(0, 50) + "..."
        : firstTitle;
    }

    const firstText = componentManager.components.value.find(
      (c) => c.type === "paragraph"
    )?.content;
    return firstText
      ? firstText.length > 80
        ? firstText.substring(0, 80) + "..."
        : firstText
      : "Contenu de la proposition";
  });

  // Upload files and update state with URLs
  const uploadFiles = async (projectId: string): Promise<void> => {
    const urls = await fileUpload.uploadFiles(projectId);

    if (urls.contract_url) {
      proposalState.contract_url = urls.contract_url;
    }
    if (urls.quote_url) {
      proposalState.quote_url = urls.quote_url;
    }
  };

  return {
    // State
    proposalState,
    projectState,
    proposalSchema,
    isEditMode,

    // File handling
    contractFile: fileUpload.contractFile,
    quoteFile: fileUpload.quoteFile,
    contractUploading: fileUpload.contractUploading,
    quoteUploading: fileUpload.quoteUploading,
    isUploading: fileUpload.isUploading,

    // Pricing
    price: pricing.price,
    depositRequired: pricing.depositRequired,
    depositAmount: pricing.depositAmount,
    depositPercentage: pricing.depositPercentage,
    quickDepositOptions: pricing.quickDepositOptions,
    paymentMethodOptions: pricing.paymentMethodOptions,
    setDepositFromPercentage: pricing.setDepositFromPercentage,

    // Component management
    components: componentManager.components,
    sortedComponents: componentManager.sortedComponents,
    selectedComponentId: componentManager.selectedComponentId,
    selectedComponent: componentManager.selectedComponent,
    configDrawerOpen: componentManager.configDrawerOpen,
    isPreviewMode: componentManager.isPreviewMode,
    availableComponents: componentManager.availableComponents,
    addComponent: componentManager.addComponent,
    removeComponent: componentManager.removeComponent,
    updateComponent: componentManager.updateComponent,
    moveComponent: componentManager.moveComponent,
    selectComponent: componentManager.selectComponent,
    deselectComponent: componentManager.deselectComponent,
    togglePreviewMode: componentManager.togglePreviewMode,

    // Computed
    contentPreview,

    // Actions
    uploadFiles,
    handleContractFileSelect: fileUpload.handleContractFileSelect,
    handleQuoteFileSelect: fileUpload.handleQuoteFileSelect,
    removeContractFile: fileUpload.removeContractFile,
    removeQuoteFile: fileUpload.removeQuoteFile,
  };
};
