<template>
    <UForm id="proposal-form" :schema="schema" :state="state" class="space-y-6" @submit="handleSubmit">
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

            <UFormField label="Titre de la proposition" name="title" required>
                <UInput v-model="state.title" placeholder="Ex: Proposition shooting mariage Sarah & Thomas"
                    icon="i-lucide-file-text" />
            </UFormField>

            <UFormField label="Description" name="description" class="w-full">
                <UTextarea v-model="state.description" autoresize
                    placeholder="Décrivez les prestations incluses, les conditions, etc..." :rows="3" class="w-full" />
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
                <UInput v-model="state.price" type="number" placeholder="1500.00" step="0.01" min="0"
                    icon="i-lucide-euro">
                    <template #trailing>
                        <span class="text-neutral-500 dark:text-neutral-400 text-xs font-medium">€</span>
                    </template>
                </UInput>
            </UFormField>

            <!-- Deposit Section -->
            <div class="space-y-4">
                <UFormField label="Acompte requis" name="deposit_required">
                    <USwitch v-model="state.deposit_required" color="primary" size="md" />
                </UFormField>

                <div v-if="state.deposit_required"
                    class="space-y-4 pl-4 border-l-2 border-primary-200 dark:border-primary-800">
                    <UFormField label="Montant de l'acompte" name="deposit_amount" required>
                        <UInput v-model="state.deposit_amount" type="number" placeholder="450.00" step="0.01" min="0"
                            :max="state.price" icon="i-lucide-euro">
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
                </div>
            </div>
        </div>

        <USeparator />

        <!-- File Uploads -->
        <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-paperclip" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Documents</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Fichiers contractuels (optionnel)</p>
                </div>
            </div>

            <!-- Contract Upload -->
            <UFormField label="Contrat" name="contract_url">
                <FileUpload v-model="contractFile" accept=".pdf,.doc,.docx" :max-size="50 * 1024 * 1024"
                    help-text="Document contractuel pour le client (optionnel)" />
            </UFormField>

            <!-- Quote Upload -->
            <UFormField label="Devis" name="quote_url">
                <FileUpload v-model="quoteFile" accept=".pdf,.doc,.docx" :max-size="50 * 1024 * 1024"
                    help-text="Devis détaillé pour le client (optionnel)" />
            </UFormField>
        </div>

        <USeparator />

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <UIcon name="i-lucide-info" class="w-4 h-4" />
                <span>Les champs marqués d'un <span class="text-red-500">*</span> sont obligatoires</span>
            </div>

            <div class="flex items-center gap-3">
                <UButton color="neutral" variant="ghost" label="Annuler" :disabled="isSubmitting"
                    @click="$emit('cancel')" />
                <UButton type="submit" variant="outline" color="neutral" :loading="isSubmitting && submitAsDraft"
                    :disabled="isSubmitting && !submitAsDraft" icon="i-lucide-save" label="Enregistrer en brouillon"
                    @click="submitAsDraft = true" />
                <UButton type="submit" color="primary" :loading="isSubmitting && !submitAsDraft"
                    :disabled="isSubmitting && submitAsDraft" icon="i-lucide-send" label="Valider et envoyer"
                    @click="submitAsDraft = false" />
            </div>
        </div>
    </UForm>
</template>

<script lang="ts" setup>
import type { FormSubmitEvent } from "@nuxt/ui";
import { useProposalForm } from "~/composables/proposals/useProposalForm";
import type { Proposal, ProposalFormData } from "~/types/proposal";

interface Props {
    proposal?: Proposal;
    projectId: string;
    projectInitialPrice?: number;
}

interface Emits {
    (e: "proposal-saved", data: { proposal: Proposal; projectUpdated: boolean }): void;
    (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const {
    state,
    schema,
    contractFile,
    quoteFile,
    depositPercentage,
    quickDepositOptions,
    uploadFiles,
    setDepositFromPercentage,
} = useProposalForm(props.proposal, props.projectInitialPrice);

// Local loading state for better UX
const isSubmitting = ref(false);
const submitAsDraft = ref(false);

// Handle form submission
const handleSubmit = async (event: FormSubmitEvent<ProposalFormData>) => {
    isSubmitting.value = true;
    try {
        // First upload any pending files
        if (contractFile.value || quoteFile.value) {
            // Import the proposal service for file upload
            const { proposalService } = await import("~/services/proposalService");

            const uploadFileFn = async (file: File, type: 'contract' | 'quote') => {
                return await proposalService.uploadFile(file, props.projectId, type);
            };

            await uploadFiles(uploadFileFn);
        }

        const shouldValidate = !submitAsDraft.value;

        // Emit the form data to parent component for handling
        emit("proposal-saved", {
            proposal: event.data as Proposal, // Cast to Proposal type
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