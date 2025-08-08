<template>
    <!-- Validate Dialog -->
    <UModal v-model:open="showValidateDialog">
        <template #header>
            <div class="flex items-center gap-3">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Valider la galerie</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Confirmer la réception et approuver les
                        images
                    </p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-6">
                <!-- Confirmation Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-information-circle" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Confirmation de
                            validation
                        </h4>
                    </div>
                    <p class="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        Vous confirmez valider cette galerie ? Une fois validée, vous pourrez télécharger toutes les
                        images en haute résolution.
                    </p>
                </div>

                <USeparator />

                <!-- Benefits Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-gift" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Avantages inclus</h4>
                    </div>

                    <UAlert color="success" variant="soft" icon="i-heroicons-gift" title="Téléchargement disponible">
                        <template #description>
                            <div class="space-y-2">
                                <p>Accès immédiat au téléchargement de votre galerie</p>
                                <ul class="text-sm space-y-1 ml-4 list-disc">
                                    <li>Téléchargement illimité de toutes les images</li>
                                    <li>Format haute résolution pour impression</li>
                                    <li>Accès permanent à votre galerie</li>
                                </ul>
                            </div>
                        </template>
                    </UAlert>
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex items-center justify-end w-full">
                <div class="flex items-center gap-3">
                    <UButton variant="ghost" @click="showValidateDialog = false">
                        Annuler
                    </UButton>
                    <UButton color="primary" :loading="validatingGallery" icon="i-heroicons-check-circle"
                        @click="$emit('validate')">
                        Confirmer
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>

    <!-- Payment Dialog -->
    <UModal v-model:open="showPaymentDialog">
        <template #header>
            <div class="flex items-center gap-3">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-credit-card" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Payer le solde restant</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Finaliser le paiement pour accéder au
                        téléchargement</p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-6">
                <!-- Payment Amount Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-banknotes" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Montant à payer</h4>
                    </div>

                    <div
                        class="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                        <div class="flex items-center justify-between">
                            <span class="text-neutral-600 dark:text-neutral-400">Solde restant :</span>
                            <span class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{
                                formattedRemainingAmount }}</span>
                        </div>
                    </div>
                </div>

                <USeparator />

                <!-- Payment Information -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-shield-check" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Informations de
                            paiement</h4>
                    </div>

                    <UAlert color="primary" variant="soft" icon="i-heroicons-credit-card" title="Paiement sécurisé">
                        <template #description>
                            <div class="space-y-2">
                                <p>Le paiement sera traité via virement bancaire sécurisé</p>
                                <ul class="text-sm space-y-1 ml-4 list-disc">
                                    <li>Instructions de virement fournies immédiatement</li>
                                    <li>Référence unique pour traçabilité</li>
                                    <li>Accès au téléchargement dès réception</li>
                                </ul>
                            </div>
                        </template>
                    </UAlert>
                </div>

                <USeparator />

                <!-- After Payment Benefits -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-star" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Après le paiement</h4>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 text-green-500" />
                            <span>Téléchargement immédiat</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <UIcon name="i-heroicons-photo" class="w-4 h-4 text-green-500" />
                            <span>Haute résolution</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <UIcon name="i-heroicons-clock" class="w-4 h-4 text-green-500" />
                            <span>Accès permanent</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <UIcon name="i-heroicons-document-duplicate" class="w-4 h-4 text-green-500" />
                            <span>Confirmation automatique</span>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex items-center justify-end w-full">
                <div class="flex items-center gap-3">
                    <UButton variant="ghost" @click="showPaymentDialog = false">
                        Annuler
                    </UButton>
                    <UButton color="success" :loading="confirmingPayment" icon="i-heroicons-credit-card"
                        @click="$emit('confirm-payment')">
                        Procéder au paiement
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>

    <!-- Request Revisions Dialog -->
    <UModal v-model:open="showRequestRevisionsDialog">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-edit" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold">Demander des retouches</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Décrivez les modifications souhaitées</p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-4">
                <p class="text-neutral-600 dark:text-neutral-400">
                    Décrivez les modifications que vous souhaitez apporter à cette galerie. Soyez aussi précis que
                    possible.
                </p>

                <UFormField name="revisionComment" label="Commentaires et demandes spécifiques" class="w-full">
                    <UTextarea v-model="revisionComment" class="w-full"
                        placeholder="Exemple: Image 3 - Éclaircir le visage, Image 7 - Retirer l'élément en arrière-plan, Images 12-15 - Ajuster la saturation..."
                        :rows="5" :disabled="requestingRevisions" />
                </UFormField>

                <UAlert color="info" variant="soft" icon="i-lucide-lightbulb" title="Conseils">
                    <template #description>
                        <ul class="text-sm space-y-1 ml-4 list-disc">
                            <li>Numérotez ou décrivez précisément les images concernées</li>
                            <li>Soyez spécifique sur les retouches souhaitées</li>
                            <li>Mentionnez vos préférences stylistiques si nécessaire</li>
                        </ul>
                    </template>
                </UAlert>
            </div>
        </template>

        <template #footer>
            <div class="flex items-center justify-end gap-3">
                <UButton variant="ghost" @click="cancelRequestRevisions">Annuler</UButton>
                <UButton color="warning" :loading="requestingRevisions" icon="i-lucide-edit" @click="requestRevisions">
                    Envoyer
                </UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
interface Props {
    showValidateDialog: boolean;
    showPaymentDialog: boolean;
    showRequestRevisionsDialog: boolean;
    validatingGallery: boolean;
    requestingRevisions: boolean;
    confirmingPayment: boolean;
    revisionComment: string;
    formattedRemainingAmount: string | null;
}

interface Emits {
    "update:showValidateDialog": [value: boolean];
    "update:showPaymentDialog": [value: boolean];
    "update:showRequestRevisionsDialog": [value: boolean];
    "update:revisionComment": [value: string];
    validate: [];
    "confirm-payment": [];
    "request-revisions": [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Computed properties for v-model
const showValidateDialog = computed({
    get: () => props.showValidateDialog,
    set: (value) => emit('update:showValidateDialog', value)
});

const showPaymentDialog = computed({
    get: () => props.showPaymentDialog,
    set: (value) => emit('update:showPaymentDialog', value)
});

const showRequestRevisionsDialog = computed({
    get: () => props.showRequestRevisionsDialog,
    set: (value) => emit('update:showRequestRevisionsDialog', value)
});

const revisionComment = computed({
    get: () => props.revisionComment,
    set: (value) => emit('update:revisionComment', value)
});

// Methods
const cancelRequestRevisions = () => {
    showRequestRevisionsDialog.value = false;
    revisionComment.value = '';
};

const requestRevisions = () => {
    emit('request-revisions');
};
</script>