<template>
    <UCard variant="outline">
        <template #header>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <UIcon name="i-lucide-image" class="w-5 h-5 text-pink-500" />
                    <div>
                        <h3 class="font-semibold">Moodboard</h3>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">Planche d'inspiration pour le client
                        </p>
                    </div>
                </div>
                <!-- Status badge for existing moodboards -->
                <div v-if="moodboard" class="ml-auto">
                    <UBadge :color="moodboardStatusInfo?.color as any" variant="subtle"
                        :label="moodboardStatusInfo?.label" :icon="moodboardStatusInfo?.icon" />
                </div>
            </div>
        </template>

        <!-- Loading State -->
        <div v-if="loading" class="py-8 text-center">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
            <p class="text-sm text-neutral-600 dark:text-neutral-400">Chargement du moodboard...</p>
        </div>

        <!-- Error State -->
        <UAlert v-else-if="error" color="error" variant="soft" icon="i-lucide-alert-circle" :title="error.message" />

        <div v-else class="space-y-4">
            <!-- Existing Moodboard Display -->
            <div v-if="moodboard && !showEditForm" class="space-y-4">
                <div
                    class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <div class="flex items-start justify-between mb-3">
                        <div class="space-y-1">
                            <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ moodboard.title }}
                            </h4>
                            <p v-if="moodboard.description" class="text-sm text-neutral-600 dark:text-neutral-400">
                                {{ moodboard.description }}
                            </p>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                {{ imageCount }} image{{ imageCount > 1 ? 's' : '' }} d'inspiration
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 mb-4">
                        <UButton icon="i-lucide-edit" size="sm" variant="outline" color="primary" label="Modifier"
                            :disabled="!canEditMoodboard" @click="editMoodboard" />

                        <!-- Client preview button -->
                        <UButton icon="i-lucide-external-link" size="sm" variant="outline" color="neutral"
                            label="Aperçu client" :to="`/moodboard/${moodboard.id}`" target="_blank" />

                        <!-- Delete button for draft and revision requested moodboards -->
                        <UButton v-if="canEditMoodboard" icon="i-lucide-trash-2" size="sm" variant="outline"
                            color="error" label="Supprimer" :loading="isDeleting" @click="confirmDeleteMoodboard" />
                    </div>

                    <!-- Image Grid Preview -->
                    <div v-if="hasImages" class="space-y-3 mt-4">
                        <h5 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Aperçu des images</h5>
                        <ProjectMoodboardImageGrid :images="Array.from(moodboard.images || [])" :max-preview="6"
                            :can-delete="false" @image-click="handleImageClick" @delete-image="handleDeleteImage" />
                    </div>

                    <!-- Upload Progress -->
                    <div v-if="isUploading"
                        class="space-y-3 mt-4 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                        <div class="flex items-center gap-3">
                            <UIcon name="i-lucide-upload" class="w-5 h-5 text-pink-500 animate-pulse" />
                            <div class="flex-1">
                                <div
                                    class="flex items-center justify-between text-sm font-medium text-pink-900 dark:text-pink-100">
                                    <span>Upload des images en cours...</span>
                                    <span>{{ Math.round(uploadProgress || 0) }}%</span>
                                </div>
                                <div class="mt-2 w-full bg-pink-200 dark:bg-pink-800 rounded-full h-2">
                                    <div class="bg-pink-600 h-2 rounded-full transition-all duration-300"
                                        :style="{ width: `${uploadProgress || 0}%` }" />
                                </div>
                                <p class="text-xs text-pink-700 dark:text-pink-300 mt-1">
                                    Veuillez patienter, les images sont en cours d'ajout au moodboard...
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Warning for validated moodboards -->
                    <UAlert v-if="!canEditMoodboard" color="warning" variant="soft" icon="i-lucide-info"
                        title="Moodboard validé par le client" class="mt-4">
                        <template #description>
                            Ce moodboard a été validé par le client et ne peut plus être modifié ni supprimé.
                            Le module ne peut pas être désactivé.
                        </template>
                    </UAlert>

                    <!-- Info for revision requested moodboards -->
                    <UAlert v-else-if="moodboard.status === 'revision_requested'" color="warning" variant="soft"
                        icon="i-lucide-edit" title="Révisions demandées par le client" class="mt-4">
                        <template #description>
                            Le client a demandé des révisions sur ce moodboard. Vous pouvez le modifier librement,
                            ajouter/supprimer des images et soit le renvoyer au client soit le repasser en brouillon.
                        </template>
                    </UAlert>

                    <!-- Info for awaiting client moodboards -->
                    <UAlert v-else-if="moodboard.status === 'awaiting_client'" color="info" variant="soft"
                        icon="i-lucide-clock" title="Envoyé au client" class="mt-4">
                        <template #description>
                            Ce moodboard a été envoyé au client pour validation. Vous pouvez continuer à le modifier
                            pour enrichir la collaboration ou le repasser en brouillon si nécessaire.
                        </template>
                    </UAlert>

                    <!-- Info for draft moodboards -->
                    <UAlert v-else-if="moodboard.status === 'draft'" color="info" variant="soft"
                        icon="i-lucide-file-edit" title="Moodboard en brouillon" class="mt-4">
                        <template #description>
                            Ce moodboard est en brouillon. Vous pouvez le modifier librement et l'envoyer au client
                            quand il sera prêt pour validation.
                        </template>
                    </UAlert>
                </div>
            </div>

            <!-- Create/Edit Moodboard Form -->
            <div v-else-if="showEditForm">
                <ProjectMoodboardForm :moodboard="showEditForm ? (moodboard || undefined) : undefined"
                    :project-id="projectId"
                    :existing-images="showEditForm && moodboard?.images ? Array.from(moodboard.images) : undefined"
                    @moodboard-saved="handleMoodboardSaved" @cancel="handleCancel" />
            </div>

            <!-- Empty state with create button -->
            <div v-else class="py-8 text-center">
                <div
                    class="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UIcon name="i-lucide-image-plus" class="w-8 h-8 text-pink-600 dark:text-pink-400" />
                </div>
                <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Aucun moodboard</h4>
                <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                    Créez une planche d'inspiration pour ce projet
                </p>
                <UButton icon="i-lucide-plus" color="primary" label="Créer un moodboard" @click="editMoodboard" />
            </div>
        </div>


    </UCard>
</template>

<script lang="ts" setup>
import { useMoodboard } from '~/composables/moodboards/user/useMoodboard';
import type { Moodboard, MoodboardImage } from '~/types/moodboard';

interface Props {
    projectId: string
}

const props = defineProps<Props>()

// Use the moodboard composable for complete state management
const {
    loading,
    error,
    moodboard,
    imageCount,
    hasImages,
    fetchMoodboard,
    saveMoodboard,
    deleteMoodboard,
    uploadImages,
    deleteImage,
} = useMoodboard(props.projectId)

// Local state
const showEditForm = ref(false)
const isDeleting = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)

// Computed properties
const canEditMoodboard = computed(() => {
    // Le moodboard reste toujours modifiable sauf s'il est complètement validé par le client
    return !moodboard.value || moodboard.value.status !== 'completed'
})

// Status info for badge
const moodboardStatusInfo = computed(() => {
    if (!moodboard.value) return null

    const statusOptions: Record<string, { color: string; label: string; icon: string }> = {
        draft: { color: 'neutral', label: 'Brouillon', icon: 'i-lucide-file-edit' },
        awaiting_client: { color: 'warning', label: 'En attente client', icon: 'i-lucide-clock' },
        revision_requested: { color: 'info', label: 'Révision demandée', icon: 'i-lucide-edit' },
        completed: { color: 'success', label: 'Validé', icon: 'i-lucide-check-circle' },
    }

    return statusOptions[moodboard.value.status] || null
})

const editMoodboard = () => {
    showEditForm.value = true
}

const handleCancel = () => {
    showEditForm.value = false
}

const handleMoodboardSaved = async (data: { moodboard: Moodboard; projectUpdated: boolean; selectedFiles?: File[] }) => {
    try {
        // Save moodboard data
        await saveMoodboard(data.moodboard)

        // Upload images if any
        if (data.selectedFiles && data.selectedFiles.length > 0) {
            isUploading.value = true
            uploadProgress.value = 0

            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                if (uploadProgress.value < 90) {
                    uploadProgress.value += 10
                }
            }, 200)

            try {
                await uploadImages(data.selectedFiles)
                uploadProgress.value = 100
            } finally {
                clearInterval(progressInterval)
                setTimeout(() => {
                    isUploading.value = false
                    uploadProgress.value = 0
                }, 500)
            }
        }

        // Close the edit form
        showEditForm.value = false

        // Refresh moodboard data
        await fetchMoodboard()

    } catch (err) {
        console.error('Error saving moodboard:', err)
        const toast = useToast()
        toast.add({
            title: 'Erreur',
            description: err instanceof Error ? err.message : 'Une erreur est survenue lors de la sauvegarde.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}

const handleImageClick = (image: MoodboardImage) => {
    // Handle image click (could open lightbox, etc.)
    console.log('Image clicked:', image)
}

const handleDeleteImage = async (imageId: string) => {
    const toast = useToast()

    // Show confirmation dialog
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.')

    if (!confirmed) return

    try {
        await deleteImage(imageId)

        // Show success message
        toast.add({
            title: 'Image supprimée',
            description: 'L\'image a été supprimée avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

    } catch (err) {
        console.error('Error deleting image:', err)
        toast.add({
            title: 'Erreur',
            description: err instanceof Error ? err.message : 'Une erreur est survenue lors de la suppression.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}

const confirmDeleteMoodboard = async () => {
    if (!moodboard.value) return

    const toast = useToast()

    // Show confirmation dialog
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer ce moodboard ? Cette action supprimera toutes les images et est irréversible.')

    if (!confirmed) return

    isDeleting.value = true

    try {
        await deleteMoodboard()

        // Show success message
        toast.add({
            title: 'Moodboard supprimé',
            description: 'Le moodboard et toutes ses images ont été supprimés avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        // Reset state
        showEditForm.value = false

    } catch (err) {
        console.error('Error deleting moodboard:', err)
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

// Load moodboard on mount
onMounted(async () => {
    try {
        await fetchMoodboard()
    } catch (err) {
        console.error('Error loading moodboard:', err)
    }
})
</script>