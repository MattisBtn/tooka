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
                    class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-credit-card" class="w-4 h-4 text-white dark:text-black" />
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

                <!-- Bank Transfer Payment -->
                <div v-if="project?.paymentMethod === 'bank_transfer' && project?.bankDetails" class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-shield-check" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Informations de
                            paiement</h4>
                    </div>

                    <!-- Bank Details -->
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                IBAN
                            </label>
                            <div class="flex items-center gap-2">
                                <code class="flex-1 p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-sm">
                                    {{ project.bankDetails.iban }}
                                </code>
                                <UButton size="xs" variant="ghost" icon="i-lucide-copy" />
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                BIC/SWIFT
                            </label>
                            <div class="flex items-center gap-2">
                                <code class="flex-1 p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-sm">
                                    {{ project.bankDetails.bic }}
                                </code>
                                <UButton size="xs" variant="ghost" icon="i-lucide-copy" />
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Bénéficiaire
                            </label>
                            <div class="flex items-center gap-2">
                                <code class="flex-1 p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-sm">
                                    {{ project.bankDetails.beneficiary }}
                                </code>
                                <UButton size="xs" variant="ghost" icon="i-lucide-copy" />
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Référence (obligatoire)
                            </label>
                            <div class="flex items-center gap-2">
                                <code
                                    class="flex-1 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-sm font-medium">
                                    {{ project.bankDetails.reference }}
                                </code>
                                <UButton size="xs" variant="ghost" icon="i-lucide-copy" />
                            </div>
                        </div>
                    </div>

                    <UAlert color="info" variant="soft" icon="i-lucide-info">
                        <template #title>Instructions importantes</template>
                        <template #description>
                            <ul class="list-disc list-inside space-y-1 text-sm">
                                <li>Indiquez impérativement la référence dans le libellé de votre virement</li>
                                <li>Le virement peut prendre 1-2 jours ouvrés pour être traité</li>
                                <li>Vous recevrez une confirmation par email une fois le paiement reçu</li>
                            </ul>
                        </template>
                    </UAlert>

                    <div
                        class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <div class="flex items-center gap-3">
                            <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-600 dark:text-green-400" />
                            <div>
                                <h5 class="font-medium text-green-900 dark:text-green-100">Confirmation
                                    automatique</h5>
                                <p class="text-sm text-green-700 dark:text-green-300">
                                    Votre galerie sera automatiquement validée après le paiement
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stripe Payment -->
                <div v-else-if="project?.paymentMethod === 'stripe'" class="space-y-4">
                    <UAlert color="info" variant="soft" icon="i-lucide-credit-card">
                        <template #title>Paiement sécurisé</template>
                        <template #description>
                            Vous allez être redirigé vers Stripe pour effectuer un paiement sécurisé par carte bancaire.
                            Votre photographe recevra une notification automatique une fois le paiement confirmé.
                        </template>
                    </UAlert>
                </div>

                <!-- No payment method configured -->
                <div v-else class="space-y-4">
                    <UAlert color="warning" variant="soft" icon="i-lucide-alert-triangle">
                        <template #title>Méthode de paiement non configurée</template>
                        <template #description>
                            Aucune méthode de paiement n'est configurée pour ce projet.
                            Veuillez contacter votre photographe pour plus d'informations.
                        </template>
                    </UAlert>
                </div>

                <USeparator />

                <!-- After Payment Benefits -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-6 h-6 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-star" class="w-3 h-3 text-white dark:text-black" />
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
            <div class="flex items-center justify-between w-full gap-3">
                <UButton variant="ghost" @click="showPaymentDialog = false">
                    Annuler
                </UButton>
                <UButton v-if="project?.paymentMethod" color="primary" :loading="confirmingPayment"
                    :icon="project.paymentMethod === 'stripe' ? 'i-lucide-credit-card' : 'i-lucide-banknote'"
                    :label="project.paymentMethod === 'stripe' ? 'Payer avec Stripe' : 'J\'ai effectué le virement'"
                    @click="$emit('confirm-payment')" />
            </div>
        </template>
    </UModal>

    <!-- Request Revisions Dialog -->
    <UModal v-model:open="showRequestRevisionsDialog">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-edit" class="w-4 h-4 text-white dark:text-black" />
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
            <div class="flex items-center justify-between w-full gap-3">
                <UButton variant="ghost" @click="cancelRequestRevisions">Annuler</UButton>
                <UButton color="neutral" :loading="requestingRevisions" icon="i-lucide-edit" @click="requestRevisions">
                    Envoyer
                </UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import type { ClientGalleryAccess } from "~/types/gallery";

interface Props {
    showValidateDialog: boolean;
    showPaymentDialog: boolean;
    showRequestRevisionsDialog: boolean;
    validatingGallery: boolean;
    requestingRevisions: boolean;
    confirmingPayment: boolean;
    revisionComment: string;
    formattedRemainingAmount: string | null;
    project: ClientGalleryAccess["project"] | null;
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