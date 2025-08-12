<template>
    <!-- Validate Moodboard Modal -->
    <UModal v-model:open="showValidateDialog">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-check" class="w-4 h-4 text-white dark:text-black" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold">Valider le moodboard</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Confirmez votre approbation</p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-4">
                <p class="text-neutral-600 dark:text-neutral-400">
                    Vous confirmez valider ce moodboard ? Une fois validé, il servira de base pour la suite du projet.
                </p>

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
        </template>

        <template #footer>
            <div class="flex items-center justify-between w-full gap-3">
                <UButton variant="ghost" @click="showValidateDialog = false">Annuler</UButton>
                <UButton color="primary" :loading="validatingMoodboard" icon="i-lucide-check"
                    @click="$emit('validate')">
                    Confirmer
                </UButton>
            </div>
        </template>
    </UModal>

    <!-- Request Revisions Modal -->
    <UModal v-model:open="showRequestRevisionsDialog">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-edit" class="w-4 h-4 text-white dark:text-black" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold">Demander des révisions</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Décrivez les modifications souhaitées</p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-4">
                <p class="text-neutral-600 dark:text-neutral-400">
                    Décrivez les modifications que vous souhaitez apporter à ce moodboard. Soyez aussi précis que
                    possible.
                </p>

                <UFormField name="revisionComment" label="Commentaires et demandes spécifiques" class="w-full">
                    <UTextarea v-model="revisionComment" class="w-full"
                        placeholder="Exemple: J'aimerais voir plus d'images avec des tons chauds, ou des exemples de poses plus naturelles..."
                        :rows="5" :disabled="requestingRevisions" />
                </UFormField>

                <UAlert color="info" variant="soft" icon="i-lucide-lightbulb" title="Conseils">
                    <template #description>
                        <ul class="text-sm space-y-1 ml-4 list-disc">
                            <li>Décrivez le style ou l'ambiance souhaités</li>
                            <li>Mentionnez des références d'inspiration si possible</li>
                            <li>Soyez spécifique sur les couleurs, poses, ou éléments à modifier</li>
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