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
                <!-- Status badge for existing selections -->
                <div v-if="selection" class="ml-auto">
                    <UBadge :color="selectionStatusInfo?.color as any" variant="subtle"
                        :label="selectionStatusInfo?.label" :icon="selectionStatusInfo?.icon" />
                </div>
            </div>
        </template>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-orange-500" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-12">
            <UAlert color="error" variant="soft" icon="i-lucide-alert-circle" title="Erreur"
                :description="error.message" />
        </div>

        <div v-else class="space-y-4">
            <!-- Existing Selection Display -->
            <div v-if="selection && !showEditForm" class="space-y-4">
                <div
                    class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <div class="flex items-start justify-between mb-3">
                        <div class="space-y-1">
                            <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                Sélection de {{ selection.max_media_selection }} média{{
                                    selection.max_media_selection > 1 ? 's' : '' }}
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
                        <UButton v-if="selection.status !== 'draft'" icon="i-lucide-external-link" size="sm"
                            variant="outline" color="neutral" label="Aperçu client" :to="`/selection/${selection.id}`"
                            target="_blank" />

                        <!-- Download selected images button - Show when selection is revision_requested or completed -->
                        <UButton
                            v-if="selectedCount > 0 && (selection.status === 'revision_requested' || selection.status === 'completed')"
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
                        <ProjectSelectionImageGrid :images="Array.from(selection.images || [])" :max-preview="6"
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
                    <UAlert v-else-if="selection.status === 'revision_requested'" color="warning" variant="soft"
                        icon="i-lucide-edit" title="Révisions demandées par le client" class="mt-4">
                        <template #description>
                            Le client a demandé des révisions sur cette sélection. Vous pouvez la modifier librement,
                            ajouter/supprimer des images et soit la renvoyer au client soit la repasser en brouillon.
                        </template>
                    </UAlert>

                    <!-- Info for awaiting client selections -->
                    <UAlert v-else-if="selection.status === 'awaiting_client'" color="info" variant="soft"
                        icon="i-lucide-clock" title="Envoyée au client" class="mt-4">
                        <template #description>
                            Cette sélection a été envoyée au client pour validation. Vous pouvez continuer à la modifier
                            pour enrichir les choix ou la repasser en brouillon si nécessaire.
                        </template>
                    </UAlert>

                    <!-- Info for draft selections -->
                    <UAlert v-else-if="selection.status === 'draft'" color="info" variant="soft"
                        icon="i-lucide-file-edit" title="Sélection en brouillon" class="mt-4">
                        <template #description>
                            Cette sélection est en brouillon. Vous pouvez la modifier librement et l'envoyer au client
                            quand elle sera prête pour validation.
                        </template>
                    </UAlert>
                </div>
            </div>

            <!-- Create/Edit Selection Form -->
            <div v-else-if="showEditForm">
                <ProjectSelectionForm :selection="showEditForm ? (selection || undefined) : undefined"
                    :project-id="projectId"
                    :existing-images="showEditForm && selection?.images ? Array.from(selection.images) : undefined"
                    @selection-saved="handleSelectionSaved" @cancel="handleCancel" />
            </div>

            <!-- Empty state with create button -->
            <div v-else class="py-8 text-center">
                <div
                    class="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UIcon name="i-lucide-mouse-pointer-click" class="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Aucune sélection</h4>
                <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                    Créez une sélection d'images pour ce projet
                </p>
                <UButton icon="i-lucide-plus" color="primary" label="Créer une sélection" @click="editSelection" />
            </div>
        </div>


    </UCard>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useSelection } from '~/composables/selections/user/useSelection';
import type { SelectionFormData, SelectionImage } from '~/types/selection';

interface Props {
    projectId: string
}

const props = defineProps<Props>()

// Use the selection composable for complete state management
const {
    loading,
    error,
    selection,
    imageCount,
    selectedCount,
    hasImages,
    formattedExtraMediaPrice,
    fetchSelection,
    saveSelection,
    uploadImages,
    deleteSelection,
} = useSelection(props.projectId)

// Local state for UI
const showEditForm = ref(false)
const isDeleting = ref(false)
const isDownloading = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)

// Status info for badge
const selectionStatusInfo = computed(() => {
    if (!selection.value) return null

    const statusOptions: Record<string, { color: string; label: string; icon: string }> = {
        draft: { color: 'neutral', label: 'Brouillon', icon: 'i-lucide-mouse-pointer-click' },
        awaiting_client: { color: 'warning', label: 'En attente client', icon: 'i-lucide-clock' },
        revision_requested: { color: 'info', label: 'Révision demandée', icon: 'i-lucide-edit' },
        completed: { color: 'success', label: 'Validé', icon: 'i-lucide-check-circle' },
    }

    return statusOptions[selection.value.status] || null
})

// Computed properties
const canEditSelection = computed(() => {
    // La sélection reste toujours modifiable sauf si elle est complètement validée par le client
    return !selection.value || selection.value.status !== 'completed'
})

const editSelection = () => {
    showEditForm.value = true
}

const handleCancel = () => {
    showEditForm.value = false
}

const handleSelectionSaved = async (data: { selection: SelectionFormData; projectUpdated: boolean; selectedFiles?: File[] }) => {
    try {
        // Save the selection using the composable
        const result = await saveSelection(data.selection, data.projectUpdated)

        // Handle file uploads if there are selected files
        if (data.selectedFiles && data.selectedFiles.length > 0) {
            // Get the selection ID from the result
            const selectionId = result.selection.id

            if (selectionId) {
                isUploading.value = true
                uploadProgress.value = 0

                try {
                    // Simulate progress for better UX
                    const progressInterval = setInterval(() => {
                        if (uploadProgress.value < 85) {
                            uploadProgress.value += Math.random() * 15
                        }
                    }, 300)

                    // Pass the selection ID directly to avoid race condition
                    await uploadImages(data.selectedFiles, selectionId)

                    clearInterval(progressInterval)
                    uploadProgress.value = 100

                    const toast = useToast()
                    toast.add({
                        title: 'Images uploadées',
                        description: `${data.selectedFiles.length} image(s) ajoutée(s) avec succès à la sélection.`,
                        icon: 'i-lucide-check-circle',
                        color: 'success'
                    })

                    // Auto-refresh after upload
                    setTimeout(async () => {
                        await fetchSelection()
                        isUploading.value = false
                        uploadProgress.value = 0
                    }, 1000)

                } catch (uploadError) {
                    console.error('Upload error:', uploadError)
                    const toast = useToast()
                    toast.add({
                        title: 'Erreur d\'upload',
                        description: uploadError instanceof Error ? uploadError.message : 'Une erreur est survenue lors de l\'upload.',
                        icon: 'i-lucide-alert-circle',
                        color: 'error'
                    })
                    isUploading.value = false
                    uploadProgress.value = 0
                }
            } else {
                throw new Error('ID de sélection manquant après sauvegarde')
            }
        }

        // Always refresh selection data after save (whether files were uploaded or not)
        await fetchSelection()

        // Close the edit form
        showEditForm.value = false

        // Show success message
        const toast = useToast()
        toast.add({
            title: 'Sélection sauvegardée',
            description: 'La sélection a été sauvegardée avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

    } catch (err) {
        console.error('Error saving selection:', err)
        const toast = useToast()
        toast.add({
            title: 'Erreur',
            description: err instanceof Error ? err.message : 'Une erreur est survenue lors de la sauvegarde.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}

const handleImageClick = (image: SelectionImage) => {
    // Handle image click (could open lightbox, etc.)
    console.log('Image clicked:', image)
}

const downloadSelectedImages = async () => {
    if (!selection.value) return

    const toast = useToast()
    isDownloading.value = true

    try {
        // Import the selection service
        const { selectionService } = await import('~/services/selectionService')

        // Download selected images
        await selectionService.downloadSelectedImages(selection.value.id)

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
    if (!selection.value) return

    // Prevent deletion during upload
    if (isUploading.value) {
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
        await deleteSelection()

        // Show success message
        toast.add({
            title: 'Sélection supprimée',
            description: 'La sélection et toutes ses images ont été supprimées avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })



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

// Initialize component
onMounted(async () => {
    // Fetch selection data
    await fetchSelection()
})
</script>