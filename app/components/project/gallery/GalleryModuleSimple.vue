<template>
    <!-- Loading State -->
    <div v-if="galleryManager.loading.value" class="py-8 text-center">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
        <p class="text-sm text-neutral-600 dark:text-neutral-400">Chargement...</p>
    </div>

    <!-- Error State -->
    <UAlert v-else-if="galleryManager.error.value" color="error" variant="soft" icon="i-lucide-alert-circle"
        :title="galleryManager.error.value" />

    <!-- Content -->
    <div v-else>
        <!-- Existing Gallery -->
        <div v-if="galleryManager.exists.value && !showForm" class="space-y-4">
            <div
                class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">

                <!-- Gallery Info -->
                <div class="space-y-4 mb-6">
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-images" class="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">
                            Galerie du projet
                        </h4>
                    </div>

                    <div class="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                        <span class="flex items-center gap-1">
                            <UIcon name="i-lucide-image" class="w-4 h-4" />
                            {{ galleryManager.imageCount.value }} image{{ galleryManager.imageCount.value > 1 ? 's'
                                : '' }}
                            uploadée{{ galleryManager.imageCount.value > 1 ? 's' : '' }}
                        </span>
                    </div>

                    <!-- Payment Required Toggle -->
                    <div class="flex items-center gap-3">
                        <UIcon name="i-lucide-credit-card" class="w-4 h-4 text-neutral-500" />
                        <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Paiement requis pour téléchargement :
                        </span>
                        <UBadge :color="galleryManager.gallery.value?.payment_required ? 'warning' : 'success'"
                            variant="subtle" :label="galleryManager.gallery.value?.payment_required ? 'Oui' : 'Non'" />
                    </div>
                </div>

                <!-- Pricing Information -->
                <div v-if="galleryManager.pricing.value" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div class="space-y-1">
                        <span
                            class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Prix
                            total</span>
                        <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            {{ galleryManager.formattedBasePrice.value }}
                        </p>
                    </div>
                    <div class="space-y-1">
                        <span
                            class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Acompte
                            payé</span>
                        <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            {{ galleryManager.formattedDepositPaid.value }}
                        </p>
                    </div>
                    <div class="space-y-1">
                        <span
                            class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Reste
                            à payer</span>
                        <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            {{ galleryManager.formattedRemainingAmount.value }}
                        </p>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-2 mb-4">
                    <UButton icon="i-lucide-edit" size="sm" variant="outline" color="neutral"
                        label="Modifier la galerie" :disabled="!galleryManager.canEdit.value || !canEditModule"
                        @click="showForm = true" />

                    <UButton v-if="galleryManager.gallery.value?.status !== 'draft'" icon="i-lucide-external-link"
                        size="sm" variant="outline" color="neutral" label="Aperçu client"
                        :to="`/gallery/${galleryManager.gallery.value?.id}`" target="_blank" />

                    <UButton v-if="galleryManager.gallery.value?.status === 'draft'" icon="i-lucide-trash-2" size="sm"
                        variant="outline" color="error" label="Supprimer" :loading="galleryManager.loading.value"
                        :disabled="!canDeleteModule" @click="handleDelete" />
                </div>

                <!-- Image Preview Grid -->
                <div v-if="galleryManager.hasImages.value" class="space-y-3 mt-4">
                    <h5 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Aperçu des images</h5>
                    <ProjectGalleryImageGrid :images="Array.from(galleryManager.gallery.value?.images || [])"
                        :max-preview="6" :can-delete="galleryManager.canEdit.value" @image-click="handleImageClick"
                        @delete-image="handleDeleteImage" />
                </div>

                <!-- Status-specific alerts -->
                <UAlert v-if="galleryManager.gallery.value?.status === 'completed'" color="success" variant="soft"
                    icon="i-lucide-check-circle" title="Galerie terminée" class="mt-4">
                    <template #description>
                        Cette galerie a été validée par le client et est désormais terminée.
                        Le client peut télécharger ses images en haute résolution.
                    </template>
                </UAlert>

                <UAlert v-else-if="galleryManager.gallery.value?.status === 'payment_pending'" color="info"
                    variant="soft" icon="i-lucide-clock" title="Paiement en attente de confirmation" class="mt-4">
                    <template #description>
                        <div class="space-y-3">
                            <p>Le client a initié le paiement pour télécharger la galerie. Vérifiez votre compte
                                bancaire et confirmez la réception.</p>
                            <UButton color="success" icon="i-lucide-check-circle" size="sm"
                                label="Confirmer la réception du paiement" :loading="galleryManager.loading.value"
                                @click="handleConfirmPayment" />
                        </div>
                    </template>
                </UAlert>

                <UAlert v-else-if="galleryManager.gallery.value?.status === 'revision_requested'" color="warning"
                    variant="soft" icon="i-lucide-edit" title="Révisions demandées" class="mt-4">
                    <template #description>
                        Le client a demandé des révisions sur cette galerie. Vous pouvez modifier les paramètres
                        et ajouter/supprimer des images selon les demandes.
                    </template>
                </UAlert>

                <UAlert v-else-if="galleryManager.gallery.value?.status === 'draft'" color="info" variant="soft"
                    icon="i-lucide-info" title="Galerie en brouillon" class="mt-4">
                    <template #description>
                        Cette galerie est encore en brouillon. Vous pouvez modifier les paramètres,
                        ajouter/supprimer des images.
                    </template>
                </UAlert>

                <UAlert v-else-if="galleryManager.gallery.value?.status === 'awaiting_client'" color="info"
                    variant="soft" icon="i-lucide-clock" title="Galerie envoyée" class="mt-4">
                    <template #description>
                        Cette galerie a été envoyée au client et attend sa validation.
                    </template>
                </UAlert>
            </div>
        </div>

        <!-- Form -->
        <div v-else-if="showForm">
            <ProjectGalleryForm :gallery="galleryManager.gallery.value || undefined" :project-id="projectId"
                :pricing="galleryManager.pricing.value || undefined"
                :existing-images="galleryManager.gallery.value?.images ? Array.from(galleryManager.gallery.value.images) : undefined"
                :proposal-payment-info="proposalPaymentInfo"
                :project="galleryManager.project.value || project || undefined" @gallery-saved="handleGallerySaved"
                @cancel="showForm = false" />
        </div>

        <!-- Empty State with Choice Buttons -->
        <div v-else class="py-8 text-center">
            <div
                class="w-16 h-16 bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900 dark:to-violet-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UIcon name="i-lucide-images" class="w-8 h-8 text-violet-600 dark:text-violet-400" />
            </div>
            <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Qu'est-ce qu'une galerie ?</h4>
            <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                Livrable final pour le client avec téléchargement en haute résolution
            </p>

            <!-- Feature explanation -->
            <div
                class="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700 mb-6">
                <ul class="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                    <li class="flex items-start gap-2">
                        <UIcon name="i-lucide-check" class="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        <span>Livrable final pour le client</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <UIcon name="i-lucide-check" class="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        <span>Téléchargement en haute résolution</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <UIcon name="i-lucide-check" class="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        <span>Gestion des paiements</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <UIcon name="i-lucide-check" class="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                        <span>Interface client sécurisée</span>
                    </li>
                </ul>
            </div>

            <!-- Choice buttons -->
            <div class="flex flex-col sm:flex-row gap-4">
                <UButton icon="i-lucide-plus" color="primary" size="lg" class="flex-1 justify-center"
                    :loading="moduleConfig.gallery.loading" :disabled="!canEditModule('gallery')"
                    @click="enableModule('gallery', { showForm: true })">
                    Oui, créer une galerie
                </UButton>
            </div>
        </div>
    </div>

</template>

<script lang="ts" setup>
import { useGalleryManager } from '~/composables/galleries/useGalleryManager';
import { useProject } from '~/composables/projects/useProject';
import { useProposal } from '~/composables/proposals/useProposal';
import { useModuleState } from '~/composables/shared/useModuleState';
import type { GalleryFormData, GalleryImage, ProjectPaymentData } from '~/types/gallery';

interface Props {
    projectId: string
}

interface Emits {
    (e: 'gallery-configured'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Utiliser le state centralisé pour le showForm
const { moduleConfig, configureModule, enableModule, canEditModule, canDeleteModule } = useModuleState(props.projectId)
const showForm = computed({
    get: () => moduleConfig.value.gallery.showForm,
    set: (value: boolean) => {
        if (value) {
            enableModule('gallery', { showForm: true })
        } else {
            configureModule('gallery')
        }
    }
})

// Utiliser le composable unifié
const galleryManager = useGalleryManager(props.projectId)

// Use proposal composable to get payment info
const { proposal } = useProposal(props.projectId)

// Use project composable to get project payment data
const { project } = useProject(props.projectId)

// Computed for proposal payment info
const proposalPaymentInfo = computed(() => {
    if (!proposal.value || !project.value) return undefined;

    return {
        payment_method: project.value.payment_method,
        deposit_required: proposal.value.deposit_required,
        deposit_amount: proposal.value.deposit_amount
    };
});

// Charger la galerie au montage
onMounted(async () => {
    await galleryManager.load()
})

// Méthodes
const handleGallerySaved = async (data: {
    gallery: GalleryFormData;
    project: ProjectPaymentData;
    projectUpdated: boolean;
    selectedFiles?: File[]
}) => {
    try {
        // Utiliser la méthode save qui gère création/mise à jour + upload des images
        await galleryManager.save(
            {
                payment_required: data.gallery.payment_required,
                selection_id: data.gallery.selection_id,
                status: data.gallery.status
            },
            data.project, // Passer les données de paiement du projet
            data.selectedFiles
        )

        // Fermer le formulaire et notifier
        configureModule('gallery')
        emit('gallery-configured')

        const toast = useToast()
        toast.add({
            title: 'Galerie sauvegardée',
            description: 'La galerie a été créée/mise à jour avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })
    } catch (err) {
        console.error('Error saving gallery:', err)
        const toast = useToast()
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la sauvegarde.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}

const handleDelete = async () => {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette galerie ? Cette action est irréversible.')
    if (!confirmed) return

    try {
        await galleryManager.remove()

        // Resynchroniser le state après suppression
        const { resyncAfterModuleDeletion } = useModuleState(props.projectId)
        await resyncAfterModuleDeletion('gallery')

        const toast = useToast()
        toast.add({
            title: 'Galerie supprimée',
            description: 'La galerie a été supprimée avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })
    } catch {
        const toast = useToast()
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la suppression.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}

const handleImageClick = (image: GalleryImage) => {
    // Gérer le clic sur image (lightbox, etc.)
    console.log('Image clicked:', image)
}

const handleDeleteImage = async (imageId: string) => {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.')
    if (!confirmed) return

    try {
        await galleryManager.deleteImage(imageId)
        const toast = useToast()
        toast.add({
            title: 'Image supprimée',
            description: 'L\'image a été supprimée avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })
    } catch {
        const toast = useToast()
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la suppression.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}

const handleConfirmPayment = async () => {
    try {
        await galleryManager.confirmPayment()
        const toast = useToast()
        toast.add({
            title: 'Paiement confirmé',
            description: 'Le paiement a été confirmé avec succès. La galerie est maintenant accessible au client.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })
    } catch {
        const toast = useToast()
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la confirmation du paiement.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}
</script>