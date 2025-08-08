<template>
    <div>
        <!-- Validate Modal -->
        <UModal :open="showValidateDialog" @update:open="$emit('update:showValidateDialog', $event)">
            <template #content>
                <UCard>
                    <template #header>
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-check-circle"
                                    class="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    Accepter la proposition
                                </h3>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                    Confirmez que vous acceptez cette proposition
                                </p>
                            </div>
                        </div>
                    </template>

                    <div class="space-y-4">
                        <UAlert color="info" variant="soft" icon="i-lucide-info">
                            <template #title>Confirmation</template>
                            <template #description>
                                En acceptant cette proposition, vous confirmez votre accord avec les termes et
                                conditions présentés.
                                Votre photographe sera notifié de votre acceptation.
                            </template>
                        </UAlert>

                        <div class="flex items-center justify-end gap-3 pt-4">
                            <UButton variant="ghost" color="neutral" label="Annuler" :disabled="validatingProposal"
                                @click="$emit('update:showValidateDialog', false)" />
                            <UButton color="success" icon="i-lucide-check-circle" label="Accepter la proposition"
                                :loading="validatingProposal" @click="$emit('validate')" />
                        </div>
                    </div>
                </UCard>
            </template>
        </UModal>

        <!-- Request Revisions Modal -->
        <UModal :open="showRequestRevisionsDialog" @update:open="$emit('update:showRequestRevisionsDialog', $event)">
            <template #content>
                <UCard>
                    <template #header>
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-edit" class="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    Demander des révisions
                                </h3>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                    Indiquez les modifications souhaitées
                                </p>
                            </div>
                        </div>
                    </template>

                    <div class="space-y-4">
                        <UFormField label="Commentaires et demandes de modification" name="comment">
                            <UTextarea :model-value="revisionComment" class="w-full"
                                placeholder="Décrivez les modifications que vous souhaitez apporter à cette proposition..."
                                :rows="4" :disabled="requestingRevisions"
                                @update:model-value="$emit('update:revisionComment', $event)" />
                        </UFormField>

                        <UAlert color="warning" variant="soft" icon="i-lucide-alert-triangle">
                            <template #title>Information</template>
                            <template #description>
                                Votre photographe recevra vos commentaires et révisera la proposition en conséquence.
                                Vous recevrez une nouvelle version une fois les modifications apportées.
                            </template>
                        </UAlert>

                        <div class="flex items-center justify-end gap-3 pt-4">
                            <UButton variant="ghost" color="neutral" label="Annuler" :disabled="requestingRevisions"
                                @click="$emit('update:showRequestRevisionsDialog', false)" />
                            <UButton color="warning" icon="i-lucide-edit" label="Demander les révisions"
                                :loading="requestingRevisions" :disabled="!revisionComment.trim()"
                                @click="$emit('request-revisions')" />
                        </div>
                    </div>
                </UCard>
            </template>
        </UModal>

        <!-- Payment Modal -->
        <UModal :open="showPaymentDialog" @update:open="$emit('update:showPaymentDialog', $event)">
            <template #content>
                <UCard>
                    <template #header>
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-credit-card"
                                    class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    Paiement de l'acompte
                                </h3>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                    Effectuez le paiement pour valider votre projet
                                </p>
                            </div>
                        </div>
                    </template>

                    <div v-if="proposal?.deposit_required && proposal?.deposit_amount" class="space-y-6">
                        <!-- Amount to pay -->
                        <div
                            class="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <div class="text-center">
                                <h4 class="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                                    Montant à payer
                                </h4>
                                <p class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {{ new Intl.NumberFormat('fr-FR', {
                                        style: 'currency', currency: 'EUR'
                                    }).format(proposal.deposit_amount)
                                    }}
                                </p>
                            </div>
                        </div>

                        <!-- Bank Transfer Payment -->
                        <div v-if="project?.paymentMethod === 'bank_transfer' && project?.bankDetails"
                            class="space-y-4">
                            <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                Coordonnées bancaires
                            </h4>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <label
                                        class="text-sm font-medium text-neutral-700 dark:text-neutral-300">IBAN</label>
                                    <div class="flex items-center gap-2">
                                        <code class="flex-1 p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-sm">
                            {{ project.bankDetails.iban }}
                        </code>
                                        <UButton size="xs" variant="ghost" icon="i-lucide-copy" />
                                    </div>
                                </div>

                                <div class="space-y-2">
                                    <label
                                        class="text-sm font-medium text-neutral-700 dark:text-neutral-300">BIC</label>
                                    <div class="flex items-center gap-2">
                                        <code class="flex-1 p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-sm">
                            {{ project.bankDetails.bic }}
                        </code>
                                        <UButton size="xs" variant="ghost" icon="i-lucide-copy" />
                                    </div>
                                </div>

                                <div class="space-y-2 sm:col-span-2">
                                    <label
                                        class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Bénéficiaire</label>
                                    <div class="flex items-center gap-2">
                                        <code class="flex-1 p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-sm">
                            {{ project.bankDetails.beneficiary }}
                        </code>
                                        <UButton size="xs" variant="ghost" icon="i-lucide-copy" />
                                    </div>
                                </div>

                                <div class="space-y-2 sm:col-span-2">
                                    <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
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
                        </div>

                        <!-- Stripe Payment -->
                        <div v-else-if="project?.paymentMethod === 'stripe'" class="space-y-4">
                            <UAlert color="info" variant="soft" icon="i-lucide-credit-card">
                                <template #title>Paiement sécurisé</template>
                                <template #description>
                                    Vous allez être redirigé vers Stripe pour effectuer un paiement sécurisé par carte
                                    bancaire.
                                    Votre photographe recevra une notification automatique une fois le paiement
                                    confirmé.
                                </template>
                            </UAlert>

                            <div
                                class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div class="flex items-center gap-3">
                                    <UIcon name="i-lucide-shield-check"
                                        class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    <div>
                                        <h5 class="font-medium text-blue-900 dark:text-blue-100">Paiement sécurisé</h5>
                                        <p class="text-sm text-blue-700 dark:text-blue-300">
                                            Vos données de paiement sont protégées par Stripe
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div
                                class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                <div class="flex items-center gap-3">
                                    <UIcon name="i-lucide-check-circle"
                                        class="w-5 h-5 text-green-600 dark:text-green-400" />
                                    <div>
                                        <h5 class="font-medium text-green-900 dark:text-green-100">Confirmation
                                            automatique</h5>
                                        <p class="text-sm text-green-700 dark:text-green-300">
                                            Votre proposition sera automatiquement acceptée après le paiement
                                        </p>
                                    </div>
                                </div>
                            </div>
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

                        <div class="flex items-center justify-end gap-3 pt-4">
                            <UButton variant="ghost" color="neutral" label="Annuler"
                                @click="$emit('update:showPaymentDialog', false)" />
                            <UButton v-if="project?.paymentMethod" color="success" icon="i-lucide-check-circle"
                                :label="project.paymentMethod === 'stripe' ? 'Payer avec Stripe' : 'J\'ai effectué le virement'"
                                :loading="confirmingPayment" @click="$emit('confirm-payment')" />
                        </div>
                    </div>
                </UCard>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
interface Props {
    showValidateDialog: boolean;
    showRequestRevisionsDialog: boolean;
    showPaymentDialog: boolean;
    revisionComment: string;
    validatingProposal: boolean;
    requestingRevisions: boolean;
    confirmingPayment: boolean;
    project?: {
        id: string;
        title: string;
        hasPassword: boolean;
        paymentMethod?: "stripe" | "bank_transfer" | null;
        bankDetails?: {
            iban: string;
            bic: string;
            beneficiary: string;
            reference: string;
        };
    } | null;
    proposal?: {
        id: string;
        deposit_amount: number | null;
        deposit_required: boolean;
    } | null;
}

interface Emits {
    (e: 'update:showValidateDialog' | 'update:showRequestRevisionsDialog' | 'update:showPaymentDialog', value: boolean): void;
    (e: 'update:revisionComment', value: string): void;
    (e: 'validate' | 'request-revisions' | 'confirm-payment'): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>