<template>
    <UCard variant="outline">
        <template #header>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <UIcon name="i-lucide-images" class="w-5 h-5 text-violet-500" />
                    <div>
                        <h3 class="font-semibold">Galerie</h3>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">Livrable final pour le client</p>
                    </div>
                </div>
                <!-- Status badge for existing galleries -->
                <div v-if="gallery" class="ml-auto">
                    <UBadge :color="galleryStatusInfo?.color as any" variant="subtle" :label="galleryStatusInfo?.label"
                        :icon="galleryStatusInfo?.icon" />
                </div>
            </div>
        </template>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="py-8">
            <UAlert color="error" variant="soft" icon="i-lucide-alert-circle" title="Erreur"
                :description="error.message" />
        </div>

        <div v-else class="space-y-4">
            <!-- Existing Gallery Display -->
            <div v-if="gallery && !showEditForm" class="space-y-4">
                <div
                    class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    <div class="flex items-start justify-between mb-3">
                        <div class="space-y-1">
                            <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Galerie du projet</h4>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                {{ imageCount }} image{{ imageCount > 1 ? 's' : '' }} uploadée{{ imageCount > 1 ? 's' :
                                    '' }}
                            </p>
                        </div>
                    </div>

                    <!-- Pricing Information -->
                    <div v-if="pricing" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Prix
                                total</span>
                            <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{
                                formattedBasePrice }}
                            </p>
                        </div>
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Acompte
                                payé</span>
                            <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{
                                formattedDepositPaid }}
                            </p>
                        </div>
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Reste
                                à
                                payer</span>
                            <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{
                                formattedRemainingAmount }}</p>
                        </div>
                    </div>

                    <!-- Payment Required Toggle -->
                    <div class="flex items-center gap-3 mb-4">
                        <UIcon name="i-lucide-credit-card" class="w-4 h-4 text-neutral-500" />
                        <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Paiement requis pour téléchargement :
                        </span>
                        <UBadge :color="gallery.payment_required ? 'warning' : 'success'" variant="subtle"
                            :label="gallery.payment_required ? 'Oui' : 'Non'" />
                    </div>

                    <div class="flex items-center gap-2 mb-4">
                        <UButton icon="i-lucide-edit" size="sm" variant="outline" color="primary" label="Modifier"
                            :disabled="!canEditGallery" @click="editGallery" />

                        <!-- Client preview button -->
                        <UButton icon="i-lucide-external-link" size="sm" variant="outline" color="neutral"
                            label="Aperçu client" :to="`/gallery/${gallery.id}`" target="_blank" />

                        <!-- Delete button for draft and revision requested galleries -->
                        <UButton v-if="canEditGallery" icon="i-lucide-trash-2" size="sm" variant="outline" color="error"
                            label="Supprimer" :loading="isDeleting" @click="confirmDeleteGallery" />
                    </div>

                    <!-- Image Grid Preview -->
                    <div v-if="hasImages" class="space-y-3 mt-4">
                        <h5 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Aperçu des images</h5>
                        <ProjectGalleryImageGrid :images="Array.from(gallery.images || [])" :max-preview="6"
                            :can-delete="false" @image-click="handleImageClick" @delete-image="handleDeleteImage" />
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
                                    Veuillez patienter, les images sont en cours d'ajout à la galerie...
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Warning for validated galleries -->
                    <UAlert v-if="!canEditGallery && gallery.status !== 'payment_pending'" color="warning"
                        variant="soft" icon="i-lucide-info" title="Galerie validée" class="mt-4">
                        <template #description>
                            Cette galerie a été envoyée au client et ne peut plus être modifiée ni supprimée.
                            Le module ne peut pas être désactivé.
                        </template>
                    </UAlert>

                    <!-- Payment pending alert -->
                    <UAlert v-else-if="gallery.status === 'payment_pending'" color="info" variant="soft"
                        icon="i-lucide-clock" title="Paiement en attente de confirmation" class="mt-4">
                        <template #description>
                            <div class="space-y-3">
                                <p>Le client a initié le paiement pour télécharger la galerie. Vérifiez votre compte
                                    bancaire et confirmez la réception.</p>
                                <UButton color="success" icon="i-lucide-check-circle" size="sm"
                                    label="Confirmer la réception du paiement" :loading="loading"
                                    @click="handleConfirmPayment" />
                            </div>
                        </template>
                    </UAlert>

                    <!-- Info for revision requested galleries -->
                    <UAlert v-else-if="gallery.status === 'revision_requested'" color="warning" variant="soft"
                        icon="i-lucide-edit" title="Révisions demandées" class="mt-4">
                        <template #description>
                            Le client a demandé des révisions sur cette galerie. Vous pouvez modifier les paramètres
                            et ajouter/supprimer des images selon les demandes.
                        </template>
                    </UAlert>

                    <!-- Info for draft galleries -->
                    <UAlert v-else-if="gallery.status === 'draft'" color="info" variant="soft" icon="i-lucide-info"
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
            <div v-else-if="showEditForm">
                <ProjectGalleryForm :gallery="showEditForm ? (gallery || undefined) : undefined"
                    :project-id="props.projectId" :pricing="pricing || undefined"
                    :existing-images="showEditForm && gallery?.images ? Array.from(gallery.images) : undefined"
                    :proposal-payment-info="proposalPaymentInfo" @gallery-saved="handleGallerySaved"
                    @cancel="handleCancel" />
            </div>

            <!-- Empty state with create button -->
            <div v-else class="py-8 text-center">
                <div
                    class="w-16 h-16 bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900 dark:to-violet-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UIcon name="i-lucide-image-plus" class="w-8 h-8 text-violet-600 dark:text-violet-400" />
                </div>
                <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Aucune galerie</h4>
                <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                    Créez une galerie de livraison pour ce projet
                </p>
                <UButton icon="i-lucide-plus" color="primary" label="Créer une galerie" @click="editGallery" />
            </div>
        </div>


    </UCard>
</template>

<script lang="ts" setup>
import { useGallery } from '~/composables/galleries/user/useGallery';
import { useProject } from '~/composables/projects/useProject';
import { useProposal } from '~/composables/proposals/useProposal';
import type { Gallery, GalleryImage } from '~/types/gallery';

interface Props {
    projectId: string
}

const props = defineProps<Props>()

// Use the gallery composable for complete state management
const {
    loading,
    error,
    gallery,
    pricing,
    imageCount,
    hasImages,
    formattedBasePrice,
    formattedDepositPaid,
    formattedRemainingAmount,
    fetchGallery,
    saveGallery,
    uploadImages,
    deleteGallery,
    confirmPayment,
    getStatusOptions,
} = useGallery(props.projectId)

// Use proposal composable to get payment info
const {
    proposal,
    fetchProposal: _fetchProposal
} = useProposal(props.projectId)

// Use project composable to get project payment data
const { project, fetchProject: _fetchProject } = useProject(props.projectId)

// Computed for proposal payment info
const proposalPaymentInfo = computed(() => {
    if (!proposal.value || !project.value) return undefined;

    return {
        payment_method: project.value.payment_method,
        deposit_required: proposal.value.deposit_required,
        deposit_amount: proposal.value.deposit_amount
    };
});

// Local state for UI
const showEditForm = ref(false)
const isDeleting = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)

// Gallery status info
const galleryStatusInfo = computed(() => {
    if (!gallery.value) return null
    const statusOptions = getStatusOptions()
    return statusOptions.find(option => option.value === gallery.value!.status)
})

// Computed properties
const canEditGallery = computed(() => {
    return !gallery.value ||
        gallery.value.status === 'draft' ||
        gallery.value.status === 'revision_requested'
})

const editGallery = () => {
    showEditForm.value = true
}

const handleCancel = () => {
    showEditForm.value = false
}

const handleGallerySaved = async (data: { gallery: Gallery; projectUpdated: boolean; selectedFiles?: File[] }) => {
    try {
        // Save the gallery using the composable
        const shouldValidate = data.projectUpdated
        const result = await saveGallery(data.gallery, shouldValidate)

        // Handle file uploads if there are selected files
        if (data.selectedFiles && data.selectedFiles.length > 0) {
            // Get the gallery ID from the result or existing gallery data
            const galleryId = result.gallery.id || gallery.value?.id

            if (galleryId) {
                isUploading.value = true
                uploadProgress.value = 0

                try {
                    // Simulate progress for better UX
                    const progressInterval = setInterval(() => {
                        if (uploadProgress.value < 85) {
                            uploadProgress.value += Math.random() * 15
                        }
                    }, 300)

                    // Upload images using the gallery composable
                    await uploadImages(data.selectedFiles)

                    clearInterval(progressInterval)
                    uploadProgress.value = 100

                    // Small delay to show 100% before hiding
                    setTimeout(() => {
                        isUploading.value = false
                        uploadProgress.value = 0
                    }, 1000)

                } catch (uploadErr) {
                    console.error('Error uploading images:', uploadErr)
                    isUploading.value = false
                    uploadProgress.value = 0

                    const toast = useToast()
                    toast.add({
                        title: 'Erreur d\'upload',
                        description: uploadErr instanceof Error ? uploadErr.message : 'Une erreur est survenue lors de l\'upload des images.',
                        icon: 'i-lucide-alert-circle',
                        color: 'error'
                    })
                }
            }
        }

        // Close the edit form
        showEditForm.value = false

        // Show success notification
        const toast = useToast()
        if (shouldValidate) {
            toast.add({
                title: 'Galerie validée !',
                description: 'La galerie a été envoyée au client.',
                icon: 'i-lucide-check-circle',
                color: 'success'
            })
        } else {
            toast.add({
                title: 'Brouillon sauvegardé',
                description: 'Votre galerie a été sauvegardée en brouillon.',
                icon: 'i-lucide-save',
                color: 'info'
            })
        }

        // Refresh gallery data
        await fetchGallery()

    } catch (err) {
        console.error('Error saving gallery:', err)
        const toast = useToast()
        toast.add({
            title: 'Erreur',
            description: err instanceof Error ? err.message : 'Une erreur est survenue lors de la sauvegarde.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
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
        await fetchGallery()

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
    if (!gallery.value) return

    const toast = useToast()

    // Show confirmation dialog
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette galerie ? Cette action supprimera toutes les images et est irréversible.')

    if (!confirmed) return

    isDeleting.value = true

    try {
        // Delete the gallery
        await deleteGallery()

        // Show success message
        toast.add({
            title: 'Galerie supprimée',
            description: 'La galerie et toutes ses images ont été supprimées avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })



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

const handleConfirmPayment = async () => {
    if (!gallery.value) return

    const toast = useToast()

    try {
        await confirmPayment()
        toast.add({
            title: 'Paiement confirmé',
            description: 'Le paiement a été confirmé avec succès. La galerie est maintenant accessible au client.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })
        await fetchGallery()
    } catch (err) {
        console.error('Error confirming payment:', err)
        toast.add({
            title: 'Erreur de confirmation',
            description: err instanceof Error ? err.message : 'Une erreur est survenue lors de la confirmation du paiement.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}

// Load gallery and proposal on mount
onMounted(async () => {
    try {
        await Promise.all([
            fetchGallery(),
            _fetchProposal(),
            _fetchProject()
        ])
    } catch (err) {
        console.error('Error loading data:', err)
    }
})
</script>