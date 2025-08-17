<template>
    <UForm id="proposal-form" :schema="proposalSchema" :state="proposalState" class="space-y-6" @submit="handleSubmit">
        <!-- Proposal Information -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-file-check" class="w-4 h-4 text-white dark:text-black" />
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
            @update:contract-file="contractFile = $event" @update:quote-file="quoteFile = $event"
            @update:existing-contract-url="proposalState.contract_url = $event"
            @update:existing-quote-url="proposalState.quote_url = $event" />

        <USeparator />
        <!-- Form Actions -->
        <div class="flex items-center justify-between">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="emit('cancel')" />

            <UButton type="submit" label="Sauvegarder" color="primary" :loading="isSubmitting" />
        </div>
    </UForm>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { ProposalComponent } from "~/composables/proposals/useProposalComponentTypes";
import { proposalFormSchema, type ProjectPaymentData, type Proposal, type ProposalFormData } from "~/types/proposal";

interface Props {
    proposal?: Proposal;
    project?: {
        id: string;
        payment_method: 'stripe' | 'bank_transfer' | null;
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
const proposalStore = useProposalStore()

// Check if project is free
const isFree = computed(() => projectSetupStore.isFree)

// Simple form state - no complex composable needed
const proposalState = reactive<ProposalFormData>({
    content_json: (props.proposal?.content_json as unknown as ProposalComponent[]) || [],
    content_html: props.proposal?.content_html || "",
    price: props.proposal?.price || props.project?.price || props.projectInitialPrice || 0,
    deposit_required: isFree.value ? false : (props.proposal?.deposit_required || false),
    deposit_amount: isFree.value ? null : (props.proposal?.deposit_amount || null),
    contract_url: props.proposal?.contract_url || null,
    quote_url: props.proposal?.quote_url || null,
});

const projectState = reactive<ProjectPaymentData>({
    payment_method: props.project?.payment_method || null,
});

// File upload state
const contractFile = ref<File | null>(null);
const quoteFile = ref<File | null>(null);
const isSubmitting = ref(false);

// Computed properties for pricing
const price = computed({
    get: () => proposalState.price,
    set: (value) => proposalState.price = value
});

const depositRequired = computed({
    get: () => proposalState.deposit_required,
    set: (value) => proposalState.deposit_required = value
});

const depositAmount = computed({
    get: () => proposalState.deposit_amount,
    set: (value) => proposalState.deposit_amount = value
});

const depositPercentage = computed(() => {
    if (!proposalState.deposit_amount || !proposalState.price) return 0;
    return Math.round((proposalState.deposit_amount / proposalState.price) * 100);
});

const quickDepositOptions = computed(() => [
    { label: '20%', value: 20 },
    { label: '30%', value: 30 },
    { label: '50%', value: 50 },
]);

// Helper function to set deposit from percentage
const setDepositFromPercentage = (percentage: number) => {
    depositAmount.value = Math.round(proposalState.price * (percentage / 100));
};

// File upload function using store
const uploadFiles = async (projectId: string) => {
    const urls = await proposalStore.uploadFiles(projectId, contractFile.value || undefined, quoteFile.value || undefined);
    if (urls.contract_url) {
        proposalState.contract_url = urls.contract_url;
    }
    if (urls.quote_url) {
        proposalState.quote_url = urls.quote_url;
    }
};

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

// Local handlers for component events
const onUpdateDepositRequired = (value: boolean) => {
    depositRequired.value = value;
};

const onUpdateDepositAmount = (value: number | null) => {
    depositAmount.value = value;
};

const onUpdateProjectPayment = (value: ProjectPaymentData) => {
    Object.assign(projectState, value);
};

// Schema
const proposalSchema = proposalFormSchema;
</script>

<style scoped>
/* Add any custom styles here */
</style>