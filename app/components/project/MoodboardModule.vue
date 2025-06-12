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
                <div class="flex items-center gap-3">
                    <!-- Status indicator for existing moodboards -->
                    <UBadge v-if="moodboardData" :color="moodboardStatusInfo?.color as any" variant="subtle"
                        :label="moodboardStatusInfo?.label" :icon="moodboardStatusInfo?.icon" />
                    <!-- Toggle switch with tooltip wrapper -->
                    <div class="relative">
                        <USwitch :model-value="enabled" color="primary" size="md"
                            :disabled="cannotDisableMoodboard ?? undefined" @update:model-value="handleToggle" />
                        <UTooltip v-if="cannotDisableMoodboard" text="Impossible de désactiver : un moodboard existe"
                            :content="{ side: 'left' }">
                            <!-- Invisible overlay to capture hover -->
                            <div class="absolute inset-0 cursor-not-allowed" />
                        </UTooltip>
                    </div>
                </div>
            </div>
        </template>

        <div v-if="enabled" class="space-y-4">
            <!-- Existing Moodboard Display -->
            <div v-if="moodboardData && !showEditForm" class="space-y-4">
                <div
                    class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <div class="flex items-start justify-between mb-3">
                        <div class="space-y-1">
                            <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ moodboardData.title }}
                            </h4>
                            <p v-if="moodboardData.description" class="text-sm text-neutral-600 dark:text-neutral-400">
                                {{ moodboardData.description }}
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
                            label="Aperçu client" :to="`/moodboard/${moodboardData.id}`" target="_blank" />

                        <!-- Delete button for draft and revision requested moodboards -->
                        <UButton v-if="canEditMoodboard" icon="i-lucide-trash-2" size="sm" variant="outline"
                            color="error" label="Supprimer" :loading="isDeleting" @click="confirmDeleteMoodboard" />
                    </div>

                    <!-- Image Grid Preview -->
                    <div v-if="hasImages" class="space-y-3 mt-4">
                        <h5 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Aperçu des images</h5>
                        <ProjectMoodboardImageGrid :images="Array.from(moodboardData.images || [])" :max-preview="6"
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
                    <UAlert v-else-if="moodboardData.status === 'revision_requested'" color="warning" variant="soft"
                        icon="i-lucide-edit" title="Révisions demandées" class="mt-4">
                        <template #description>
                            Le client a demandé des révisions sur ce moodboard. Vous pouvez librement modifier le
                            contenu
                            et ajouter/supprimer des images selon les demandes.
                        </template>
                    </UAlert>

                    <!-- Info for awaiting client moodboards -->
                    <UAlert v-else-if="moodboardData.status === 'awaiting_client'" color="info" variant="soft"
                        icon="i-lucide-clock" title="Envoyé au client" class="mt-4">
                        <template #description>
                            Ce moodboard a été envoyé au client. Vous pouvez continuer à le modifier et ajouter des
                            images
                            d'inspiration pour enrichir la collaboration.
                        </template>
                    </UAlert>

                    <!-- Info for draft moodboards -->
                    <UAlert v-else-if="moodboardData.status === 'draft'" color="info" variant="soft"
                        icon="i-lucide-info" title="Moodboard en brouillon" class="mt-4">
                        <template #description>
                            Ce moodboard est encore en brouillon. Vous pouvez modifier le titre, la description,
                            ajouter/supprimer des images librement.
                        </template>
                    </UAlert>
                </div>
            </div>

            <!-- Create/Edit Moodboard Form -->
            <div v-else-if="!moodboardData || showEditForm">
                <!-- Progress indicator for new moodboards -->
                <div v-if="!moodboardData" class="mb-6">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-lucide-plus" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Créer un moodboard</h4>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">Créez une planche d'inspiration
                                pour votre client</p>
                        </div>
                    </div>

                    <!-- Quick tips -->
                    <UAlert color="info" variant="soft" icon="i-lucide-lightbulb" title="Conseils">
                        <template #description>
                            <ul class="text-sm space-y-1 mt-2">
                                <li>• <strong>Brouillon</strong> : Sauvegarde sans envoyer au client</li>
                                <li>• <strong>Valider</strong> : Envoie le moodboard au client</li>
                                <li>• Ajoutez des images d'inspiration pour guider le projet</li>
                                <li>• Le client peut commenter et demander des révisions</li>
                            </ul>
                        </template>
                    </UAlert>
                </div>

                <ProjectMoodboardForm :moodboard="showEditForm ? (moodboardData || undefined) : undefined"
                    :project-id="projectId"
                    :existing-images="showEditForm && moodboardData?.images ? Array.from(moodboardData.images) : undefined"
                    @moodboard-saved="handleMoodboardSaved" @cancel="handleCancel" />
            </div>
        </div>

        <!-- Module disabled state -->
        <div v-else class="py-8 text-center">
            <div
                class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UIcon name="i-lucide-image" class="w-8 h-8 text-neutral-400" />
            </div>
            <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Module Moodboard désactivé</h4>
            <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                Activez ce module pour créer des planches d'inspiration collaboratives avec vos clients
            </p>
            <div class="text-xs text-neutral-500 dark:text-neutral-400">
                <UIcon name="i-lucide-arrow-up" class="w-3 h-3 inline mr-1" />
                Utilisez le switch ci-dessus pour activer
            </div>
        </div>
    </UCard>
</template>

<script lang="ts" setup>
import type { Moodboard, MoodboardImage, MoodboardWithDetails } from '~/types/moodboard';

interface Props {
    enabled: boolean
    moodboardData: MoodboardWithDetails | null
    moodboardStatusInfo: { color: string; label: string; icon: string } | null
    imageCount: number
    hasImages: boolean
    projectId: string
    isUploading?: boolean
    uploadProgress?: number
}

interface Emits {
    (e: 'update:enabled', value: boolean): void
    (e: 'moodboard-saved', data: { moodboard: Moodboard; projectUpdated: boolean; selectedFiles?: File[] }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state
const showEditForm = ref(false)
const isDeleting = ref(false)

// Computed properties
const cannotDisableMoodboard = computed(() => {
    // Cannot disable if any moodboard exists (even draft)
    return !!props.moodboardData
})

const canEditMoodboard = computed(() => {
    // Le moodboard reste toujours modifiable sauf s'il est complètement validé par le client
    return !props.moodboardData || props.moodboardData.status !== 'completed'
})

// Methods
const handleToggle = (value: boolean) => {
    // Prevent disabling if any moodboard exists
    if (!value && cannotDisableMoodboard.value) {
        // Reset the toggle to enabled state
        emit('update:enabled', true)

        const toast = useToast()
        toast.add({
            title: 'Action impossible',
            description: 'Impossible de désactiver le module : un moodboard existe. Supprimez-le d\'abord si il n\'est pas validé par le client.',
            icon: 'i-lucide-alert-circle',
            color: 'warning'
        })
        return
    }

    emit('update:enabled', value)
}

const editMoodboard = () => {
    showEditForm.value = true
}

const handleCancel = () => {
    showEditForm.value = false
}

const handleMoodboardSaved = async (data: { moodboard: Moodboard; projectUpdated: boolean; selectedFiles?: File[] }) => {
    // Close the edit form
    showEditForm.value = false

    // Emit to parent component to handle the actual moodboard save
    emit('moodboard-saved', data)
}

const handleImageClick = (image: MoodboardImage) => {
    // Handle image click (could open lightbox, etc.)
    console.log('Image clicked:', image)
}

const handleDeleteImage = async (imageId: string) => {
    const toast = useToast()

    // Show confirmation dialog
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.')

    if (!confirmed) return

    try {
        // Import the moodboard service
        const { moodboardService } = await import('~/services/moodboardService')

        // Delete the image
        await moodboardService.deleteImage(imageId)

        // Show success message
        toast.add({
            title: 'Image supprimée',
            description: 'L\'image a été supprimée avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        // Refresh moodboard data
        emit('moodboard-saved', { moodboard: props.moodboardData as Moodboard, projectUpdated: false })

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
    if (!props.moodboardData) return

    const toast = useToast()

    // Show confirmation dialog
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer ce moodboard ? Cette action supprimera toutes les images et est irréversible.')

    if (!confirmed) return

    isDeleting.value = true

    try {
        // Import the moodboard service
        const { moodboardService } = await import('~/services/moodboardService')

        // Delete the moodboard
        await moodboardService.deleteMoodboard(props.moodboardData.id)

        // Show success message
        toast.add({
            title: 'Moodboard supprimé',
            description: 'Le moodboard et toutes ses images ont été supprimés avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        // Emit event to refresh parent data (moodboard deleted)
        window.location.reload() // Simple solution to refresh the page

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
</script>