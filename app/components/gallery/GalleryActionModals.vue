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

                    <UAlert color="success" variant="soft" icon="i-heroicons-gift" title="Téléchargement gratuit">
                        <template #description>
                            <div class="space-y-2">
                                <p>Aucun paiement requis pour cette galerie</p>
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

    <!-- Validate with Payment Dialog -->
    <UModal v-model:open="showValidateWithPaymentDialog">
        <template #header>
            <div class="flex items-center gap-3">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-credit-card" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Valider et payer</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Finaliser la galerie avec paiement
                        sécurisé</p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-6">
                <!-- Confirmation Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-check-badge" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Finalisation avec
                            paiement
                        </h4>
                    </div>
                    <p class="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        Vous confirmez valider cette galerie et procéder au paiement du solde restant ? Une fois le
                        paiement effectué, vous aurez accès au téléchargement.
                    </p>
                </div>

                <USeparator />

                <!-- Payment Information -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-credit-card" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Informations de
                            paiement</h4>
                    </div>

                    <UAlert color="primary" variant="soft" icon="i-heroicons-credit-card" title="Paiement sécurisé">
                        <template #description>
                            <div class="space-y-2">
                                <p>Le paiement sera traité via notre plateforme sécurisée</p>
                                <ul class="text-sm space-y-1 ml-4 list-disc">
                                    <li>Cryptage SSL 256-bit pour vos données</li>
                                    <li>Conformité PCI-DSS niveau 1</li>
                                    <li>Aucune donnée bancaire stockée</li>
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
                            <span>Reçu automatique</span>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex items-center justify-end w-full">
                <div class="flex items-center gap-3">
                    <UButton variant="ghost" @click="showValidateWithPaymentDialog = false">
                        Annuler
                    </UButton>
                    <UButton color="primary" :loading="validatingGallery" icon="i-heroicons-credit-card"
                        @click="$emit('validate-with-payment')">
                        Confirmer et payer
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>

    <!-- Request Revisions Dialog -->
    <UModal v-model:open="showRequestRevisionsDialog">
        <template #header>
            <div class="flex items-center gap-3">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Demander des retouches</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Demander des modifications sur les images
                    </p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-6">
                <!-- Instructions Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-chat-bubble-left-right" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Demande de retouches
                        </h4>
                    </div>
                    <p class="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        Décrivez les modifications que vous souhaitez apporter à cette galerie. Soyez aussi précis que
                        possible pour faciliter le travail de retouche.
                    </p>
                </div>

                <USeparator />

                <!-- Form Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-6 h-6 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-document-text" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Détails des
                            modifications
                        </h4>
                    </div>

                    <UFormField name="revisionComment" label="Commentaires et demandes spécifiques"
                        help="Décrivez précisément les retouches souhaitées pour chaque image concernée" class="w-full">
                        <UTextarea v-model="revisionComment" class="w-full"
                            placeholder="Exemple: Image 3 - Éclaircir le visage, Image 7 - Retirer l'élément en arrière-plan, Images 12-15 - Ajuster la saturation..."
                            :rows="5" />
                    </UFormField>

                    <!-- Tips for better communication -->
                    <UAlert color="info" variant="soft" icon="i-heroicons-light-bulb"
                        title="Conseils pour une demande efficace">
                        <template #description>
                            <ul class="text-sm space-y-1 ml-4 list-disc">
                                <li>Numérotez ou décrivez précisément les images concernées</li>
                                <li>Soyez spécifique sur les retouches souhaitées</li>
                                <li>Mentionnez vos préférences stylistiques si nécessaire</li>
                            </ul>
                        </template>
                    </UAlert>
                </div>

                <USeparator />

                <!-- Process Information -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-6 h-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-heroicons-clock" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Processus de retouche
                        </h4>
                    </div>

                    <UAlert color="warning" variant="soft" icon="i-heroicons-information-circle"
                        title="Prochaines étapes">
                        <template #description>
                            <div class="space-y-2">
                                <p>Une fois votre demande envoyée :</p>
                                <ol class="text-sm space-y-1 ml-4 list-decimal">
                                    <li>Votre photographe recevra une notification immédiate</li>
                                    <li>Il vous contactera pour clarifier si nécessaire</li>
                                    <li>Les retouches seront effectuées selon vos demandes</li>
                                    <li>Une nouvelle version sera mise à disposition</li>
                                </ol>
                            </div>
                        </template>
                    </UAlert>
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex items-center justify-end w-full">
                <div class="flex items-center gap-3">
                    <UButton variant="ghost" @click="cancelRequestRevisions">
                        Annuler
                    </UButton>
                    <UButton color="warning" :loading="requestingRevisions" icon="i-heroicons-pencil-square"
                        @click="requestRevisions">
                        Envoyer
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
interface Props {
    showValidateDialog: boolean;
    showValidateWithPaymentDialog: boolean;
    showRequestRevisionsDialog: boolean;
    validatingGallery: boolean;
    requestingRevisions: boolean;
    revisionComment: string;
}

interface Emits {
    "update:showValidateDialog": [value: boolean];
    "update:showValidateWithPaymentDialog": [value: boolean];
    "update:showRequestRevisionsDialog": [value: boolean];
    "update:revisionComment": [value: string];
    validate: [];
    "validate-with-payment": [];
    "request-revisions": [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Computed properties for v-model
const showValidateDialog = computed({
    get: () => props.showValidateDialog,
    set: (value) => emit('update:showValidateDialog', value)
});

const showValidateWithPaymentDialog = computed({
    get: () => props.showValidateWithPaymentDialog,
    set: (value) => emit('update:showValidateWithPaymentDialog', value)
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