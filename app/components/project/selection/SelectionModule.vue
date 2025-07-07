<template>
    <UCard variant="outline">
        <template #header>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <UIcon name="i-lucide-mouse-pointer-click" class="w-5 h-5 text-orange-500" />
                    <div>
                        <h3 class="font-semibold">Sélection</h3>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">Sélection d'images par le client</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <!-- Status indicator for existing selections -->
                    <UBadge v-if="selectionData" :color="selectionStatusInfo?.color as any" variant="subtle"
                        :label="selectionStatusInfo?.label" :icon="selectionStatusInfo?.icon" />
                    <!-- Toggle switch with tooltip wrapper -->
                    <div class="relative">
                        <USwitch :model-value="enabled" color="primary" size="md"
                            :disabled="cannotDisableSelection ?? undefined" @update:model-value="handleToggle" />
                        <UTooltip v-if="cannotDisableSelection" text="Impossible de désactiver : une sélection existe"
                            :content="{ side: 'left' }">
                            <!-- Invisible overlay to capture hover -->
                            <div class="absolute inset-0 cursor-not-allowed" />
                        </UTooltip>
                    </div>
                </div>
            </div>
        </template>

        <div v-if="enabled" class="space-y-4">
            <!-- Existing Selection Display -->
            <div v-if="selectionData && !showEditForm" class="space-y-4">
                <div
                    class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <div class="flex items-start justify-between mb-3">
                        <div class="space-y-1">
                            <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                Sélection de {{ selectionData.max_media_selection }} média{{
                                    selectionData.max_media_selection >
                                        1 ? 's' : '' }}
                            </h4>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                {{ imageCount }} image{{ imageCount > 1 ? 's' : '' }} disponibles
                                <span v-if="selectedCount > 0" class="text-orange-600 dark:text-orange-400">
                                    • {{ selectedCount }} sélectionnée{{ selectedCount > 1 ? 's' : '' }} par le client
                                </span>
                            </p>
                            <p v-if="formattedExtraMediaPrice" class="text-sm text-neutral-600 dark:text-neutral-400">
                                Prix média supplémentaire: {{ formattedExtraMediaPrice }}
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 mb-4">
                        <UButton icon="i-lucide-edit" size="sm" variant="outline" color="primary" label="Modifier"
                            :disabled="!canEditSelection" @click="editSelection" />

                        <!-- Client preview button - Show for all statuses except draft -->
                        <UButton v-if="selectionData.status !== 'draft'" icon="i-lucide-external-link" size="sm"
                            variant="outline" color="neutral" label="Aperçu client"
                            :to="`/selection/${selectionData.id}`" target="_blank" />

                        <!-- Download selected images button - Show when selection is revision_requested or completed -->
                        <UButton
                            v-if="selectedCount > 0 && (selectionData.status === 'revision_requested' || selectionData.status === 'completed')"
                            icon="i-lucide-download" size="sm" variant="outline" color="success"
                            label="Télécharger sélection" :loading="isDownloading" @click="downloadSelectedImages" />

                        <!-- Delete button for draft and revision requested selections -->
                        <UButton v-if="canEditSelection" icon="i-lucide-trash-2" size="sm" variant="outline"
                            color="error" label="Supprimer" :loading="isDeleting" @click="confirmDeleteSelection" />
                    </div>

                    <!-- Image Grid Preview -->
                    <div v-if="hasImages" class="space-y-3 mt-4">
                        <h5 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            Images et sélections du client
                        </h5>
                        <ProjectSelectionImageGrid :images="Array.from(selectionData.images || [])" :max-preview="6"
                            :can-delete="false" :can-toggle-selection="false" :show-selection-state="true"
                            @image-click="handleImageClick" />
                    </div>

                    <!-- Upload Progress -->
                    <div v-if="isUploading"
                        class="space-y-3 mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div class="flex items-center gap-3">
                            <UIcon name="i-lucide-upload" class="w-5 h-5 text-orange-500 animate-pulse" />
                            <div class="flex-1">
                                <div
                                    class="flex items-center justify-between text-sm font-medium text-orange-900 dark:text-orange-100">
                                    <span>Upload des images en cours...</span>
                                    <span>{{ Math.round(uploadProgress || 0) }}%</span>
                                </div>
                                <div class="mt-2 w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2">
                                    <div class="bg-orange-600 h-2 rounded-full transition-all duration-300"
                                        :style="{ width: `${uploadProgress || 0}%` }" />
                                </div>
                                <p class="text-xs text-orange-700 dark:text-orange-300 mt-1">
                                    Veuillez patienter, les images sont en cours d'ajout à la sélection...
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Warning for validated selections -->
                    <UAlert v-if="!canEditSelection" color="warning" variant="soft" icon="i-lucide-info"
                        title="Sélection validée par le client" class="mt-4">
                        <template #description>
                            Cette sélection a été validée par le client et ne peut plus être modifiée ni supprimée.
                            Le module ne peut pas être désactivé.
                        </template>
                    </UAlert>

                    <!-- Info for revision requested selections -->
                    <UAlert v-else-if="selectionData.status === 'revision_requested'" color="warning" variant="soft"
                        icon="i-lucide-edit" title="Révisions demandées par le client" class="mt-4">
                        <template #description>
                            Le client a demandé des révisions sur cette sélection. Vous pouvez la modifier librement,
                            ajouter/supprimer des images et soit la renvoyer au client soit la repasser en brouillon.
                        </template>
                    </UAlert>

                    <!-- Info for awaiting client selections -->
                    <UAlert v-else-if="selectionData.status === 'awaiting_client'" color="info" variant="soft"
                        icon="i-lucide-clock" title="Envoyée au client" class="mt-4">
                        <template #description>
                            Cette sélection a été envoyée au client pour validation. Vous pouvez continuer à la modifier
                            pour enrichir les choix ou la repasser en brouillon si nécessaire.
                        </template>
                    </UAlert>

                    <!-- Info for draft selections -->
                    <UAlert v-else-if="selectionData.status === 'draft'" color="info" variant="soft"
                        icon="i-lucide-file-edit" title="Sélection en brouillon" class="mt-4">
                        <template #description>
                            Cette sélection est en brouillon. Vous pouvez la modifier librement et l'envoyer au client
                            quand elle sera prête pour validation.
                        </template>
                    </UAlert>
                </div>
            </div>

            <!-- Create/Edit Selection Form -->
            <div v-else-if="!selectionData || showEditForm">
                <!-- Progress indicator for new selections -->
                <div v-if="!selectionData" class="mb-6">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-lucide-plus" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Créer une sélection</h4>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">Créez une sélection d'images pour
                                votre
                                client</p>
                        </div>
                    </div>

                    <!-- Quick tips -->
                    <UAlert color="info" variant="soft" icon="i-lucide-lightbulb" title="Conseils">
                        <template #description>
                            <ul class="text-sm space-y-1 mt-2">
                                <li>• <strong>Brouillon</strong> : Sauvegarde sans envoyer au client</li>
                                <li>• <strong>Valider</strong> : Envoie la sélection au client</li>
                                <li>• Proposez plus d'images que le nombre maximum sélectionnable</li>
                                <li>• <strong>Sélection</strong> : Seul le client peut sélectionner ses images préférées
                                </li>
                            </ul>
                        </template>
                    </UAlert>
                </div>

                <ProjectSelectionForm :selection="showEditForm ? (selectionData || undefined) : undefined"
                    :project-id="projectId"
                    :existing-images="showEditForm && selectionData?.images ? Array.from(selectionData.images) : undefined"
                    @selection-saved="handleSelectionSaved" @cancel="handleCancel" />
            </div>
        </div>

        <!-- Module disabled state -->
        <div v-else class="py-8 text-center">
            <div
                class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UIcon name="i-lucide-mouse-pointer-click" class="w-8 h-8 text-neutral-400" />
            </div>
            <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Module Sélection désactivé</h4>
            <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                Activez ce module pour permettre au client de sélectionner ses images préférées
            </p>
            <div class="text-xs text-neutral-500 dark:text-neutral-400">
                <UIcon name="i-lucide-arrow-up" class="w-3 h-3 inline mr-1" />
                Utilisez le switch ci-dessus pour activer
            </div>
        </div>
    </UCard>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { SelectionFormData, SelectionImage, SelectionWithDetails } from '~/types/selection';

interface Props {
    enabled: boolean
    selectionData: SelectionWithDetails | null
    selectionStatusInfo: { color: string; label: string; icon: string } | null
    imageCount: number
    selectedCount: number
    hasImages: boolean
    formattedExtraMediaPrice: string | null
    projectId: string
    isUploading?: boolean
    uploadProgress?: number
}

interface Emits {
    (e: 'update:enabled', value: boolean): void
    (e: 'selection-saved', data: { selection: SelectionFormData; projectUpdated: boolean; selectedFiles?: File[] }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state
const showEditForm = ref(false)
const isDeleting = ref(false)
const isConverting = ref(false)
const isDownloading = ref(false)

// Computed properties
const cannotDisableSelection = computed(() => {
    // Cannot disable if any selection exists (even draft)
    return !!props.selectionData
})

const canEditSelection = computed(() => {
    // La sélection reste toujours modifiable sauf si elle est complètement validée par le client
    return !props.selectionData || props.selectionData.status !== 'completed'
})

// Methods
const handleToggle = (value: boolean) => {
    // Prevent disabling if any selection exists
    if (!value && cannotDisableSelection.value) {
        // Reset the toggle to enabled state
        emit('update:enabled', true)

        const toast = useToast()
        toast.add({
            title: 'Action impossible',
            description: 'Impossible de désactiver le module : une sélection existe. Supprimez-la d\'abord si elle n\'est pas validée par le client.',
            icon: 'i-lucide-alert-circle',
            color: 'warning'
        })
        return
    }

    emit('update:enabled', value)
}

const editSelection = () => {
    showEditForm.value = true
}

const handleCancel = () => {
    showEditForm.value = false
}

const handleSelectionSaved = async (data: { selection: SelectionFormData; projectUpdated: boolean; selectedFiles?: File[] }) => {
    // Close the edit form
    showEditForm.value = false

    // Emit to parent component to handle the actual selection save
    emit('selection-saved', data)
}

const handleImageClick = (image: SelectionImage) => {
    // Handle image click (could open lightbox, etc.)
    console.log('Image clicked:', image)
}

const downloadSelectedImages = async () => {
    if (!props.selectionData) return

    const toast = useToast()
    isDownloading.value = true

    try {
        // Import the selection service
        const { selectionService } = await import('~/services/selectionService')

        // Download selected images
        await selectionService.downloadSelectedImages(props.selectionData.id)

    } catch (err) {
        console.error('Error downloading selected images:', err)
        toast.add({
            title: 'Erreur',
            description: err instanceof Error ? err.message : 'Une erreur est survenue lors du téléchargement.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    } finally {
        isDownloading.value = false
    }
}

const confirmDeleteSelection = async () => {
    if (!props.selectionData) return

    // Prevent deletion during upload
    if (props.isUploading) {
        const toast = useToast()
        toast.add({
            title: 'Action impossible',
            description: 'Impossible de supprimer pendant un upload en cours. Veuillez attendre la fin de l\'upload.',
            icon: 'i-lucide-alert-circle',
            color: 'warning'
        })
        return
    }

    const toast = useToast()

    // Show confirmation dialog
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette sélection ? Cette action supprimera toutes les images et est irréversible.')

    if (!confirmed) return

    isDeleting.value = true

    try {
        // Import the selection service
        const { selectionService } = await import('~/services/selectionService')

        // Delete the selection
        await selectionService.deleteSelection(props.selectionData.id)

        // Show success message
        toast.add({
            title: 'Sélection supprimée',
            description: 'La sélection et toutes ses images ont été supprimées avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        // Simple solution to refresh the page
        window.location.reload()

    } catch (err) {
        console.error('Error deleting selection:', err)
        toast.add({
            title: 'Erreur',
            description: err instanceof Error ? err.message : 'Une erreur est survenue lors de la suppression.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    } finally {
        isDeleting.value = false
    }
}
</script>