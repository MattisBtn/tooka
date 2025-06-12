<template>
    <!-- Validate Moodboard Modal -->
    <UModal v-model:open="showValidateDialog">
        <template #header>
            <div class="flex items-center gap-3">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-check" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        Valider le moodboard
                    </h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        Confirmez votre approbation
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
                            <UIcon name="i-lucide-info" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Confirmation de
                            validation
                        </h4>
                    </div>
                    <p class="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        Vous confirmez valider ce moodboard ? Une fois validé, il servira de base pour la suite du
                        projet.
                    </p>
                </div>

                <USeparator />

                <!-- Benefits Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-lucide-lightbulb" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Direction créative</h4>
                    </div>

                    <UAlert color="success" variant="soft" icon="i-lucide-check-circle" title="Validation confirmée">
                        <template #description>
                            <div class="space-y-2">
                                <p>Ce moodboard reflète parfaitement vos attentes</p>
                                <ul class="text-sm space-y-1 ml-4 list-disc">
                                    <li>Direction artistique validée</li>
                                    <li>Ambiance et style confirmés</li>
                                    <li>Base créative pour la séance photo</li>
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
                    <UButton color="primary" :loading="validatingMoodboard" icon="i-lucide-check"
                        @click="$emit('validate')">
                        Confirmer
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>

    <!-- Request Revisions Modal -->
    <UModal v-model:open="showRequestRevisionsDialog">
        <template #header>
            <div class="flex items-center gap-3">
                <div
                    class="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-edit" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        Demander des révisions
                    </h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        Demander des modifications au moodboard
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
                            <UIcon name="i-lucide-message-circle" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Demande de révisions
                        </h4>
                    </div>
                    <p class="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        Décrivez les modifications que vous souhaitez apporter à ce moodboard. Soyez aussi précis que
                        possible pour faciliter les ajustements.
                    </p>
                </div>

                <USeparator />

                <!-- Form Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-6 h-6 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-lucide-file-text" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Détails des
                            modifications
                        </h4>
                    </div>

                    <UFormField name="revisionComment" label="Commentaires et demandes spécifiques"
                        help="Décrivez précisément les changements souhaités dans le moodboard" class="w-full">
                        <UTextarea v-model="revisionComment" class="w-full"
                            placeholder="Exemple: J'aimerais voir plus d'images avec des tons chauds, ou des exemples de poses plus naturelles, ou changer l'ambiance générale..."
                            :rows="5" :disabled="requestingRevisions" />
                    </UFormField>

                    <!-- Tips for better communication -->
                    <UAlert color="info" variant="soft" icon="i-lucide-lightbulb"
                        title="Conseils pour une demande efficace">
                        <template #description>
                            <ul class="text-sm space-y-1 ml-4 list-disc">
                                <li>Décrivez le style ou l'ambiance souhaités</li>
                                <li>Mentionnez des références d'inspiration si possible</li>
                                <li>Soyez spécifique sur les couleurs, poses, ou éléments à modifier</li>
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
                            <UIcon name="i-lucide-clock" class="w-3 h-3 text-white" />
                        </div>
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">Processus de révision
                        </h4>
                    </div>

                    <UAlert color="warning" variant="soft" icon="i-lucide-info" title="Prochaines étapes">
                        <template #description>
                            <div class="space-y-2">
                                <p>Une fois votre demande envoyée :</p>
                                <ol class="text-sm space-y-1 ml-4 list-decimal">
                                    <li>Votre photographe recevra une notification immédiate</li>
                                    <li>Il ajustera le moodboard selon vos demandes</li>
                                    <li>Une nouvelle version sera mise à disposition</li>
                                    <li>Vous recevrez une notification de mise à jour</li>
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
                    <UButton color="warning" :loading="requestingRevisions" icon="i-lucide-edit"
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
    showValidateDialog: boolean
    showRequestRevisionsDialog: boolean
    revisionComment: string
    validatingMoodboard: boolean
    requestingRevisions: boolean
}

interface Emits {
    validate: []
    'request-revisions': []
    'update:showValidateDialog': [value: boolean]
    'update:showRequestRevisionsDialog': [value: boolean]
    'update:revisionComment': [value: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Create local reactive references for v-model
const showValidateDialog = computed({
    get: () => props.showValidateDialog,
    set: (value) => emit('update:showValidateDialog', value)
})

const showRequestRevisionsDialog = computed({
    get: () => props.showRequestRevisionsDialog,
    set: (value) => emit('update:showRequestRevisionsDialog', value)
})

const revisionComment = computed({
    get: () => props.revisionComment,
    set: (value) => emit('update:revisionComment', value)
})

// Methods
const cancelRequestRevisions = () => {
    showRequestRevisionsDialog.value = false;
    revisionComment.value = '';
};

const requestRevisions = () => {
    emit('request-revisions');
};
</script>

<style scoped>
/* Additional styles if needed */
</style>