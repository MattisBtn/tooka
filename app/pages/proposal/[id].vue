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
            <ProposalSimpleHeader v-if="!proposal || !isAuthenticated || !project" />

            <!-- Content with top padding when header is fixed -->
            <div :class="{ 'pt-16': proposal && isAuthenticated && project }">
                <!-- Password form if needed -->
                <ProposalPasswordForm v-if="needsPassword" :project="project" :proposal-id="proposalId"
                    :error="authError || null" @authenticated="handleAuthentication" />

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
                <div v-else-if="error" class="min-h-screen flex items-center justify-center p-4">
                    <UCard class="w-full max-w-lg text-center">
                        <div class="space-y-6">
                            <div
                                class="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                <UIcon name="i-heroicons-exclamation-triangle"
                                    class="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                                    Proposition non trouvée
                                </h1>
                                <p class="text-neutral-600 dark:text-neutral-400 mb-4">
                                    Cette proposition n'existe pas ou n'est plus accessible.
                                </p>
                                <p class="text-sm text-neutral-500 dark:text-neutral-500">
                                    Vérifiez le lien fourni ou contactez votre photographe.
                                </p>
                            </div>
                        </div>
                    </UCard>
                </div>

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
            <footer class="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 py-8">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center">
                        <p class="text-sm text-neutral-500 dark:text-neutral-400">
                            Powered by
                            <span class="font-medium text-primary-600 dark:text-primary-400">Tooka</span>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    </ClientOnly>
</template>

<script setup lang="ts">
import { useClientProposal } from '~/composables/proposals/client/useClientProposal';

definePageMeta({
    layout: false,
})

// Get proposal ID from route
const route = useRoute();
const proposalId = route.params.id as string;

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
</script>

<style></style>