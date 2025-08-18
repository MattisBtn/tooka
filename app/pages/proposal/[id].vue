<template>
    <ClientOnly>
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            <!-- Proposal Header -->
            <ProposalHeader :project="project" :proposal="proposal" :is-authenticated="isAuthenticated"
                :validating-proposal="validatingProposal" :requesting-revisions="requestingRevisions"
                :confirming-payment="confirmingPayment" :show-logout-button="project?.hasPassword && isAuthenticated"
                @validate="handleValidate" @request-revisions="handleRequestRevisions" @pay-deposit="handlePayDeposit"
                @logout="handleLogout" />

            <!-- Simple header for other states -->
            <SharedSimpleHeader v-if="!proposal || !isAuthenticated || !project" :config="simpleHeaderConfig" />

            <!-- Content with top padding when header is fixed -->
            <div :class="{ 'pt-16': proposal && isAuthenticated && project }">
                <!-- Password form if needed -->
                <SharedClientPasswordForm v-if="needsPassword" :project="project" :module-id="proposalId"
                    :error="authError || null" :config="passwordConfig" @authenticated="handleAuthentication" />

                <!-- Proposal view -->
                <ProposalClientView v-else-if="proposal && project && isAuthenticated" :proposal-id="proposalId"
                    :proposal="proposal" :project="project" :formatted-price="formattedPrice"
                    :formatted-deposit-amount="formattedDepositAmount" :has-deposit="!!hasDeposit"
                    @view-contract="handleViewContract" @view-quote="handleViewQuote" />

                <!-- Loading state -->
                <div v-else-if="loading" class="min-h-screen flex items-center justify-center">
                    <div class="text-center">
                        <UIcon name="i-heroicons-arrow-path"
                            class="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                        <p class="text-neutral-600 dark:text-neutral-400">Chargement de la proposition...</p>
                    </div>
                </div>

                <!-- Error state -->
                <SharedErrorState v-else-if="error" :config="errorConfig" />

                <!-- Fallback state -->
                <div v-else class="min-h-screen flex items-center justify-center">
                    <div class="text-center">
                        <UIcon name="i-heroicons-arrow-path"
                            class="w-8 h-8 text-neutral-600 animate-spin mx-auto mb-4" />
                        <p class="text-neutral-600 dark:text-neutral-400">Initialisation...</p>
                    </div>
                </div>
            </div>

            <!-- Action Modals -->
            <ProposalActionModals v-model:show-validate-dialog="showValidateDialog"
                v-model:show-request-revisions-dialog="showRequestRevisionsDialog"
                v-model:show-payment-dialog="showPaymentDialog" v-model:revision-comment="revisionComment"
                :validating-proposal="validatingProposal" :requesting-revisions="requestingRevisions"
                :confirming-payment="confirmingPayment" :project="project" :proposal="proposal"
                @validate="validateProposal" @request-revisions="requestRevisions" @confirm-payment="confirmPayment" />

            <!-- Footer -->
            <SharedClientFooter />
        </div>
    </ClientOnly>
</template>

<script setup lang="ts">
import { useClientProposal } from '~/composables/proposals/client/useClientProposal';
import { useClientConfig } from '~/composables/shared/useClientConfig';
import { useErrorHandler } from '~/composables/shared/useErrorHandler';
import { usePasswordFormConfig } from '~/composables/shared/usePasswordFormConfig';
import { useSimpleHeaderConfig } from '~/composables/shared/useSimpleHeaderConfig';

definePageMeta({
    layout: false,
})

// Get proposal ID from route
const route = useRoute();
const proposalId = route.params.id as string;

// Get password form configuration
const { getProposalConfig } = usePasswordFormConfig();
const passwordConfig = getProposalConfig();

// Get simple header configuration
const { getProposalConfig: getProposalHeaderConfig } = useSimpleHeaderConfig();
const simpleHeaderConfig = getProposalHeaderConfig();

// Get error and footer configurations
const { getProposalErrorConfig } = useClientConfig();
const errorConfig = getProposalErrorConfig();

// Error handler
const { createNuxtError } = useErrorHandler();

// Use client proposal composable
const {
    // Core data
    project,
    proposal,
    loading,
    error,
    needsPassword,
    isAuthenticated,
    authError,

    // Action states
    validatingProposal,
    requestingRevisions,
    confirmingPayment,

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

    // Auth methods
    logout,
} = await useClientProposal(proposalId);

// Handle password authentication
const handleAuthentication = async (password: string) => {
    await verifyPassword(password);
};

// Handle logout
const handleLogout = () => {
    logout();
};

// Handle file actions
const handleViewContract = async () => {
    await viewContract();
};

const handleViewQuote = async () => {
    await viewQuote();
};

// SEO meta
useHead({
    title: computed(() =>
        proposal.value ? `Proposition - ${project.value?.title}` : "Proposition"
    ),
    meta: [
        { name: "robots", content: "noindex, nofollow" },
    ],
});

// Handle errors
watchEffect(() => {
    if (error.value) {
        throw createNuxtError(error.value.message);
    }
});
</script>

<style></style>