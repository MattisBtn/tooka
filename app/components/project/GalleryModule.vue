<template>
    <UCard variant="outline">
        <template #header>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <UIcon name="i-lucide-images" class="w-5 h-5 text-violet-500" />
                    <div>
                        <h3 class="font-semibold">Galerie</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Livrable final pour le client</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <!-- Status indicator for existing galleries -->
                    <UBadge v-if="galleryData" :color="galleryStatusInfo?.color as any" variant="subtle"
                        :label="galleryStatusInfo?.label" :icon="galleryStatusInfo?.icon" />
                    <!-- Toggle switch with tooltip wrapper -->
                    <div class="relative">
                        <USwitch :model-value="enabled" color="primary" size="md"
                            :disabled="cannotDisableGallery ?? undefined" @update:model-value="handleToggle" />
                        <UTooltip v-if="cannotDisableGallery" text="Impossible de désactiver : une galerie existe"
                            :content="{ side: 'left' }">
                            <!-- Invisible overlay to capture hover -->
                            <div class="absolute inset-0 cursor-not-allowed" />
                        </UTooltip>
                    </div>
                </div>
            </div>
        </template>

        <div v-if="enabled" class="space-y-4">
            <!-- Existing Gallery Display -->
            <div v-if="galleryData && !showEditForm" class="space-y-4">
                <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="flex items-start justify-between mb-3">
                        <div class="space-y-1">
                            <h4 class="font-semibold text-gray-900 dark:text-gray-100">Galerie du projet</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                {{ imageCount }} image{{ imageCount > 1 ? 's' : '' }} uploadée{{ imageCount > 1 ? 's' :
                                    '' }}
                            </p>
                        </div>
                    </div>

                    <!-- Pricing Information -->
                    <div v-if="pricing" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Prix
                                total</span>
                            <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ formattedBasePrice }}
                            </p>
                        </div>
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Acompte
                                payé</span>
                            <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ formattedDepositPaid }}
                            </p>
                        </div>
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Reste
                                à
                                payer</span>
                            <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{
                                formattedRemainingAmount }}</p>
                        </div>
                    </div>

                    <!-- Payment Required Toggle -->
                    <div class="flex items-center gap-3 mb-4">
                        <UIcon name="i-lucide-credit-card" class="w-4 h-4 text-gray-500" />
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Paiement requis pour téléchargement :
                        </span>
                        <UBadge :color="galleryData.payment_required ? 'warning' : 'success'" variant="subtle"
                            :label="galleryData.payment_required ? 'Oui' : 'Non'" />
                    </div>

                    <div class="flex items-center gap-2 mb-4">
                        <UButton icon="i-lucide-edit" size="sm" variant="outline" color="primary" label="Modifier"
                            :disabled="!canEditGallery" @click="editGallery" />

                        <!-- Delete button for draft galleries -->
                        <UButton v-if="galleryData.status === 'draft'" icon="i-lucide-trash-2" size="sm"
                            variant="outline" color="error" label="Supprimer" :loading="isDeleting"
                            @click="confirmDeleteGallery" />
                    </div>

                    <!-- Image Grid Preview -->
                    <div v-if="hasImages" class="space-y-3 mt-4">
                        <h5 class="text-sm font-medium text-gray-900 dark:text-gray-100">Aperçu des images</h5>
                        <ProjectGalleryImageGrid :images="Array.from(galleryData.images || [])" :max-preview="6"
                            :can-delete="false" @image-click="handleImageClick" @delete-image="handleDeleteImage" />
                    </div>

                    <!-- Upload Progress -->
                    <div v-if="isUploading"
                        class="space-y-3 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div class="flex items-center gap-3">
                            <UIcon name="i-lucide-upload" class="w-5 h-5 text-blue-500 animate-pulse" />
                            <div class="flex-1">
                                <div
                                    class="flex items-center justify-between text-sm font-medium text-blue-900 dark:text-blue-100">
                                    <span>Upload des images en cours...</span>
                                    <span>{{ Math.round(uploadProgress || 0) }}%</span>
                                </div>
                                <div class="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                                    <div class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        :style="{ width: `${uploadProgress || 0}%` }" />
                                </div>
                                <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                    Veuillez patienter, les images sont en cours d'ajout à la galerie...
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Warning for validated galleries -->
                    <UAlert v-if="!canEditGallery" color="warning" variant="soft" icon="i-lucide-info"
                        title="Galerie validée" class="mt-4">
                        <template #description>
                            Cette galerie a été envoyée au client et ne peut plus être modifiée ni supprimée.
                            Le module ne peut pas être désactivé.
                        </template>
                    </UAlert>

                    <!-- Info for draft galleries -->
                    <UAlert v-else-if="galleryData.status === 'draft'" color="info" variant="soft" icon="i-lucide-info"
                        title="Galerie en brouillon" class="mt-4">
                        <template #description>
                            Cette galerie est encore en brouillon. Vous pouvez modifier les paramètres,
                            ajouter/supprimer des images.
                            Le module ne peut pas être désactivé tant qu'une galerie existe.
                        </template>
                    </UAlert>
                </div>
            </div>

            <!-- Create/Edit Gallery Form -->
            <div v-else-if="!galleryData || showEditForm">
                <!-- Progress indicator for new galleries -->
                <div v-if="!galleryData" class="mb-6">
                    <div class="flex items-center gap-3 mb-4">
                        <div
                            class="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-lucide-plus" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-900 dark:text-gray-100">Créer une galerie</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Configurez votre galerie et uploadez vos
                                images
                            </p>
                        </div>
                    </div>

                    <!-- Quick tips -->
                    <UAlert color="info" variant="soft" icon="i-lucide-lightbulb" title="Conseils">
                        <template #description>
                            <ul class="text-sm space-y-1 mt-2">
                                <li>• <strong>Brouillon</strong> : Sauvegarde sans envoyer au client</li>
                                <li>• <strong>Valider</strong> : Envoie la galerie au client</li>
                                <li>• Vous pouvez uploader jusqu'à 200+ images</li>
                                <li>• Le paiement est calculé automatiquement selon la proposition</li>
                            </ul>
                        </template>
                    </UAlert>
                </div>

                <ProjectGalleryForm :gallery="showEditForm ? (galleryData || undefined) : undefined"
                    :project-id="projectId" :pricing="pricing || undefined"
                    :existing-images="showEditForm && galleryData?.images ? Array.from(galleryData.images) : undefined"
                    @gallery-saved="handleGallerySaved" @cancel="handleCancel" />
            </div>
        </div>

        <!-- Module disabled state -->
        <div v-else class="py-8 text-center">
            <div
                class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UIcon name="i-lucide-images" class="w-8 h-8 text-gray-400" />
            </div>
            <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">Module Galerie désactivé</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Activez ce module pour créer des galeries de livraison pour vos clients
            </p>
            <div class="text-xs text-gray-500 dark:text-gray-400">
                <UIcon name="i-lucide-arrow-up" class="w-3 h-3 inline mr-1" />
                Utilisez le switch ci-dessus pour activer
            </div>
        </div>
    </UCard>
</template>

<script lang="ts" setup>
import type { Gallery, GalleryImage, GalleryPricing, GalleryWithDetails } from '~/types/gallery';

interface Props {
    enabled: boolean
    galleryData: GalleryWithDetails | null
    galleryStatusInfo: { color: string; label: string; icon: string } | null
    pricing: GalleryPricing | null
    formattedBasePrice: string
    formattedDepositPaid: string
    formattedRemainingAmount: string
    imageCount: number
    hasImages: boolean
    projectId: string
    isUploading?: boolean
    uploadProgress?: number
}

interface Emits {
    (e: 'update:enabled', value: boolean): void
    (e: 'gallery-saved', data: { gallery: Gallery; projectUpdated: boolean; selectedFiles?: File[] }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state
const showEditForm = ref(false)
const isDeleting = ref(false)

// Computed properties
const cannotDisableGallery = computed(() => {
    // Cannot disable if any gallery exists (even draft)
    return !!props.galleryData
})

const canEditGallery = computed(() => {
    return !props.galleryData || props.galleryData.status === 'draft'
})

// Methods
const handleToggle = (value: boolean) => {
    // Prevent disabling if any gallery exists
    if (!value && cannotDisableGallery.value) {
        // Reset the toggle to enabled state
        emit('update:enabled', true)

        const toast = useToast()
        toast.add({
            title: 'Action impossible',
            description: 'Impossible de désactiver le module : une galerie existe. Supprimez-la d\'abord si elle est en brouillon.',
            icon: 'i-lucide-alert-circle',
            color: 'warning'
        })
        return
    }

    emit('update:enabled', value)
}

const editGallery = () => {
    showEditForm.value = true
}

const handleCancel = () => {
    showEditForm.value = false
}

const handleGallerySaved = async (data: { gallery: Gallery; projectUpdated: boolean; selectedFiles?: File[] }) => {
    // Close the edit form
    showEditForm.value = false

    // Emit to parent component to handle the actual gallery save
    emit('gallery-saved', data)

    // Handle file uploads if this is a new gallery with files
    // Note: This will be handled by the parent component after gallery creation
}

const handleImageClick = (image: GalleryImage) => {
    // Handle image click (could open lightbox, etc.)
    console.log('Image clicked:', image)
}

const handleDeleteImage = async (imageId: string) => {
    const toast = useToast()

    // Show confirmation dialog
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.')

    if (!confirmed) return

    try {
        // Import the gallery service
        const { galleryService } = await import('~/services/galleryService')

        // Delete the image
        await galleryService.deleteImage(imageId)

        // Show success message
        toast.add({
            title: 'Image supprimée',
            description: 'L\'image a été supprimée avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        // Refresh gallery data
        emit('gallery-saved', { gallery: props.galleryData as Gallery, projectUpdated: false })

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

const confirmDeleteGallery = async () => {
    if (!props.galleryData) return

    const toast = useToast()

    // Show confirmation dialog
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette galerie ? Cette action supprimera toutes les images et est irréversible.')

    if (!confirmed) return

    isDeleting.value = true

    try {
        // Import the gallery service
        const { galleryService } = await import('~/services/galleryService')

        // Delete the gallery
        await galleryService.deleteGallery(props.galleryData.id)

        // Show success message
        toast.add({
            title: 'Galerie supprimée',
            description: 'La galerie et toutes ses images ont été supprimées avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        // Emit event to refresh parent data (gallery deleted)
        window.location.reload() // Simple solution to refresh the page

    } catch (err) {
        console.error('Error deleting gallery:', err)
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