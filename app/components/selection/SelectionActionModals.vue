<template>
    <!-- Validate Selection Modal -->
    <UModal v-model:open="showValidateDialog">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-check" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold">Valider la sélection</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Confirmez votre choix d'images</p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-4">
                <p class="text-neutral-600 dark:text-neutral-400">
                    Vous confirmez valider cette sélection ? Une fois validée, elle ne pourra plus être modifiée.
                </p>

                <!-- Selection Summary -->
                <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 space-y-3">
                    <h4 class="font-medium text-amber-800 dark:text-amber-200">Résumé de votre sélection</h4>

                    <div class="space-y-2 text-sm">
                        <div class="flex items-center justify-between">
                            <span class="text-amber-700 dark:text-amber-300">Images incluses</span>
                            <span class="font-medium text-amber-800 dark:text-amber-200">
                                {{ Math.min(selectedCount, maxAllowed) }} / {{ maxAllowed }}
                            </span>
                        </div>

                        <div v-if="extraCount > 0" class="flex items-center justify-between">
                            <span class="text-orange-700 dark:text-orange-300">Images supplémentaires</span>
                            <span class="font-medium text-orange-800 dark:text-orange-200">
                                {{ extraCount }}
                            </span>
                        </div>

                        <div v-if="extraPrice > 0" class="flex items-center justify-between">
                            <span class="text-red-700 dark:text-red-300">Coût supplémentaire</span>
                            <span class="font-medium text-red-800 dark:text-red-200">
                                +{{ extraPrice.toFixed(2) }}€
                            </span>
                        </div>

                        <div class="border-t border-amber-200 dark:border-amber-700 pt-2">
                            <div class="flex items-center justify-between font-medium">
                                <span class="text-amber-800 dark:text-amber-200">Total sélectionné</span>
                                <span class="text-amber-900 dark:text-amber-100">
                                    {{ selectedCount }} image{{ selectedCount > 1 ? 's' : '' }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <UAlert color="success" variant="soft" icon="i-lucide-check-circle" title="Validation confirmée">
                    <template #description>
                        <div class="space-y-2">
                            <p>Votre sélection d'images sera finalisée</p>
                            <ul class="text-sm space-y-1 ml-4 list-disc">
                                <li>Images sélectionnées confirmées</li>
                                <li>Aucune modification ultérieure possible</li>
                                <li v-if="extraPrice > 0">Facturation des images supplémentaires</li>
                            </ul>
                        </div>
                    </template>
                </UAlert>
            </div>
        </template>

        <template #footer>
            <div class="flex items-center justify-end gap-3">
                <UButton variant="ghost" @click="showValidateDialog = false">Annuler</UButton>
                <UButton color="primary" :loading="validatingSelection" icon="i-lucide-check"
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
                <div class="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-edit" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold">Demander des révisions</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Demandez des modifications à la sélection
                    </p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-4">
                <p class="text-neutral-600 dark:text-neutral-400">
                    Décrivez les modifications que vous souhaitez apporter à cette sélection d'images. Soyez aussi
                    précis que
                    possible.
                </p>

                <UFormField name="revisionComment" label="Commentaires et demandes spécifiques" class="w-full">
                    <UTextarea v-model="revisionComment" class="w-full"
                        placeholder="Exemple: J'aimerais remplacer certaines images par d'autres, ou voir d'autres options pour..."
                        :rows="5" :disabled="requestingRevisions" />
                </UFormField>

                <UAlert color="info" variant="soft" icon="i-lucide-lightbulb" title="Conseils">
                    <template #description>
                        <ul class="text-sm space-y-1 ml-4 list-disc">
                            <li>Indiquez quelles images vous souhaitez remplacer</li>
                            <li>Décrivez le type d'images que vous préféreriez</li>
                            <li>Mentionnez vos critères de sélection (composition, couleurs, style...)</li>
                            <li>Soyez spécifique pour obtenir les meilleures alternatives</li>
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
    showValidateDialog: boolean
    showRequestRevisionsDialog: boolean
    revisionComment: string
    validatingSelection: boolean
    requestingRevisions: boolean
    selectedCount: number
    maxAllowed: number
    extraCount: number
    extraPrice: number
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