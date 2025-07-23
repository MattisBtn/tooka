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
                        proposition
                    </h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Détails du devis et contrat pour le client
                    </p>
                </div>
            </div>

            <!-- Proposition Content Builder -->
            <UFormField label="Contenu de la proposition" name="content" required>
                <ProjectProposalContentBuilder :key="`form-builder-${proposalState.content_json?.length || 0}`"
                    :content_json="proposalState.content_json" :content_html="proposalState.content_html"
                    :status="'draft'" :readonly="false" @update:content_json="proposalState.content_json = $event"
                    @update:content_html="proposalState.content_html = $event" />
            </UFormField>
        </div>

        <USeparator />

        <!-- Pricing -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-euro" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Tarification</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Prix et conditions de paiement</p>
                </div>
            </div>

            <UFormField label="Prix total" name="price" required>
                <UInput v-model="proposalState.price" type="number" placeholder="1500.00" step="0.01" min="0"
                    icon="i-lucide-euro">
                    <template #trailing>
                        <span class="text-neutral-500 dark:text-neutral-400 text-xs font-medium">€</span>
                    </template>
                </UInput>
            </UFormField>

            <!-- Deposit Section -->
            <div class="space-y-4">
                <UFormField label="Acompte requis" name="deposit_required">
                    <USwitch v-model="proposalState.deposit_required" color="primary" size="md" />
                </UFormField>

                <div v-if="proposalState.deposit_required"
                    class="space-y-4 pl-4 border-l-2 border-primary-200 dark:border-primary-800">

                    <!-- Payment Method -->
                    <UFormField label="Méthode de paiement" name="payment_method" required>
                        <USelectMenu v-model="paymentMethod" value-key="value" :items="paymentMethodOptions"
                            placeholder="Choisir la méthode de paiement" icon="i-lucide-credit-card" />
                    </UFormField>

                    <UFormField label="Montant de l'acompte" name="deposit_amount" required>
                        <UInput v-model="proposalState.deposit_amount" type="number" placeholder="450.00" step="0.01"
                            min="0" :max="proposalState.price" icon="i-lucide-euro">
                            <template #trailing>
                                <div class="flex items-center gap-2">
                                    <span class="text-neutral-500 dark:text-neutral-400 text-xs font-medium">€</span>
                                    <span v-if="depositPercentage > 0"
                                        class="text-xs font-medium text-primary-600 dark:text-primary-400">
                                        ({{ depositPercentage }}%)
                                    </span>
                                </div>
                            </template>
                        </UInput>
                    </UFormField>

                    <!-- Quick deposit buttons -->
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-neutral-600 dark:text-neutral-400">Rapide:</span>
                        <div class="flex gap-2">
                            <UButton v-for="option in quickDepositOptions" :key="option.value" size="xs"
                                variant="outline" color="primary" :label="option.label"
                                @click="setDepositFromPercentage(option.value)" />
                        </div>
                    </div>

                    <!-- Bank Transfer Details -->
                    <div v-if="projectState.payment_method === 'bank_transfer'"
                        class="space-y-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                        <div class="flex items-center gap-2 mb-3">
                            <UIcon name="i-lucide-building-2" class="w-4 h-4 text-blue-600" />
                            <span class="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Coordonnées bancaires pour le virement
                            </span>
                        </div>

                        <UFormField label="IBAN" name="bank_iban" required>
                            <UInput v-model="projectState.bank_iban" placeholder="FR76 1234 5678 9012 3456 7890 123"
                                icon="i-lucide-credit-card" />
                        </UFormField>

                        <UFormField label="BIC/SWIFT" name="bank_bic" required>
                            <UInput v-model="projectState.bank_bic" placeholder="EXAMPLEFR1" icon="i-lucide-building" />
                        </UFormField>

                        <UFormField label="Bénéficiaire" name="bank_beneficiary" required>
                            <UInput v-model="projectState.bank_beneficiary" placeholder="Votre Entreprise SARL"
                                icon="i-lucide-user" />
                        </UFormField>

                        <UAlert color="info" variant="soft" icon="i-lucide-info">
                            <template #description>
                                Ces coordonnées seront transmises au client pour effectuer le virement d'acompte.
                            </template>
                        </UAlert>
                    </div>
                </div>
            </div>
        </div>

        <USeparator />

        <!-- Documents -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-file-text" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Documents</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Contrat et devis à joindre</p>
                </div>
            </div>

            <!-- Contract Upload -->
            <UFormField label="Contrat" name="contract_url">
                <FileUpload v-model="contractFile" accept=".pdf,.doc,.docx"
                    placeholder="Sélectionner le fichier de contrat" />
            </UFormField>

            <!-- Quote Upload -->
            <UFormField label="Devis détaillé" name="quote_url">
                <FileUpload v-model="quoteFile" accept=".pdf,.doc,.docx"
                    placeholder="Sélectionner le fichier de devis" />
            </UFormField>
        </div>

        <!-- Form Actions -->
        <div class="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="emit('cancel')" />

            <UButton type="submit" label="Sauvegarder comme brouillon" color="neutral" variant="outline"
                :loading="isSubmitting && submitAsDraft" @click="submitAsDraft = true" />

            <UButton type="submit" label="Envoyer au client" color="primary" :loading="isSubmitting && !submitAsDraft"
                @click="submitAsDraft = false" />
        </div>
    </UForm>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
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
    };
    projectId: string;
    projectInitialPrice?: number;
}

interface Emits {
    (e: "proposal-saved", data: {
        proposal: ProposalFormData;
        project: ProjectPaymentData;
        projectUpdated: boolean
    }): void;
    (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const {
    proposalState,
    projectState,
    proposalSchema,
    contractFile,
    quoteFile,
    depositPercentage,
    quickDepositOptions,
    paymentMethodOptions,
    uploadFiles,
    setDepositFromPercentage,
} = useProposalForm(props.proposal, props.project, props.projectInitialPrice);

// Computed for payment method to handle null/undefined conversion for USelectMenu
const paymentMethod = computed({
    get: () => projectState.payment_method || undefined,
    set: (value: 'stripe' | 'bank_transfer' | undefined) => {
        projectState.payment_method = value || null;
    }
});

// Local loading state for better UX
const isSubmitting = ref(false);
const submitAsDraft = ref(false);

// Handle form submission
const handleSubmit = async (_event: FormSubmitEvent<ProposalFormData>) => {
    isSubmitting.value = true;
    try {
        // First upload any pending files
        if (contractFile.value || quoteFile.value) {
            await uploadFiles(props.projectId);
        }

        const shouldValidate = !submitAsDraft.value;

        // Emit both proposal and project data to parent component
        emit("proposal-saved", {
            proposal: proposalState,
            project: projectState,
            projectUpdated: shouldValidate
        });
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style scoped>
/* Add any custom styles here */
</style>