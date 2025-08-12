<template>
    <UForm id="proposal-form" :schema="proposalSchema" :state="proposalState" class="space-y-6" @submit="handleSubmit">
        <!-- Proposal Information -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-file-check" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Informations de la
                        proposition</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Détails du devis et contrat pour le client
                    </p>
                </div>
            </div>

            <!-- Proposition Content Builder -->
            <UFormField label="Contenu de la proposition" name="content" required>
                <ProjectProposalContentBuilder :key="`form-builder-${proposalState.content_json?.length || 0}`"
                    :content-json="proposalState.content_json" :content-html="proposalState.content_html"
                    :status="'draft'" :readonly="false" @update:content_json="proposalState.content_json = $event"
                    @update:content_html="proposalState.content_html = $event" />
            </UFormField>
        </div>

        <USeparator />

        <!-- Pricing Section -->

        <ProjectProposalPricingSection v-if="!isFree" :price="price" :deposit-required="depositRequired"
            :deposit-amount="depositAmount" :deposit-percentage="depositPercentage"
            :quick-deposit-options="quickDepositOptions" :project-payment="projectState"
            :set-deposit-from-percentage="setDepositFromPercentage" @update:deposit-required="onUpdateDepositRequired"
            @update:deposit-amount="onUpdateDepositAmount" @update:project-payment="onUpdateProjectPayment" />

        <USeparator v-if="!isFree" />

        <!-- Documents Section -->
        <ProjectProposalDocumentsSection :contract-file="contractFile" :quote-file="quoteFile"
            :existing-contract-url="proposalState.contract_url" :existing-quote-url="proposalState.quote_url"
            @update:contract-file="contractFile = $event" @update:quote-file="quoteFile = $event" />

        <!-- Form Actions -->
        <div class="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="emit('cancel')" />

            <UButton type="submit" label="Sauvegarder" color="primary" :loading="isSubmitting" />
        </div>
    </UForm>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { ProposalComponent } from "~/composables/proposals/useProposalComponentTypes";
import { useProposalForm } from "~/composables/proposals/useProposalForm";
import type { ProjectPaymentData, Proposal, ProposalFormData } from "~/types/proposal";

interface Props {
    proposal?: Proposal;
    project?: {
        id: string;
        payment_method: 'stripe' | 'bank_transfer' | null;
        bank_iban: string | null;
        bank_bic: string | null;
        bank_beneficiary: string | null;
        price?: number;
    };
    projectId: string;
    projectInitialPrice?: number;
}

interface Emits {
    (e: "proposal-saved", data: {
        proposal: ProposalFormData;
        project: ProjectPaymentData;
        projectUpdated: boolean;
    }): void;
    (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Use stores
const projectSetupStore = useProjectSetupStore()

// Check if project is free
const isFree = computed(() => projectSetupStore.isFree)

const {
    proposalState,
    projectState,
    proposalSchema,
    contractFile,
    quoteFile,
    depositPercentage,
    quickDepositOptions,
    uploadFiles,
    setDepositFromPercentage,
    price,
    depositRequired,
    depositAmount,
} = useProposalForm(
    props.proposal ? {
        content_json: props.proposal.content_json as unknown as ProposalComponent[],
        content_html: props.proposal.content_html,
        price: props.proposal.price,
        deposit_required: props.proposal.deposit_required,
        deposit_amount: props.proposal.deposit_amount,
        contract_url: props.proposal.contract_url || undefined,
        quote_url: props.proposal.quote_url || undefined,
    } : undefined,
    props.project,
    props.projectInitialPrice
);

// Local loading state for better UX
const isSubmitting = ref(false);

// Handle form submission
const handleSubmit = async (_event: FormSubmitEvent<ProposalFormData>) => {
    isSubmitting.value = true;
    try {
        // First upload any pending files
        if (contractFile.value || quoteFile.value) {
            await uploadFiles(props.projectId);
        }

        // Emit both proposal and project data to parent component
        emit("proposal-saved", {
            proposal: proposalState,
            project: projectState,
            projectUpdated: Boolean(depositRequired.value && projectState.payment_method),
        });
    } finally {
        isSubmitting.value = false;
    }
};

// Local handlers to correctly mutate reactive state
const onUpdateDepositRequired = (value: boolean) => {
    depositRequired.value = value;
};

const onUpdateDepositAmount = (value: number | null) => {
    depositAmount.value = value;
};

const onUpdateProjectPayment = (value: ProjectPaymentData) => {
    Object.assign(projectState, value);
};
</script>

<style scoped>
/* Add any custom styles here */
</style>