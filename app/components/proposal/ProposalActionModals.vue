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
    </div>
</template>

<script setup lang="ts">
interface Props {
    showValidateDialog: boolean;
    showRequestRevisionsDialog: boolean;
    revisionComment: string;
    validatingProposal: boolean;
    requestingRevisions: boolean;
}

interface Emits {
    (e: 'update:showValidateDialog' | 'update:showRequestRevisionsDialog', value: boolean): void;
    (e: 'update:revisionComment', value: string): void;
    (e: 'validate' | 'request-revisions'): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>