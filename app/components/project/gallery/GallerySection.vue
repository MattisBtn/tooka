<template>
    <div class="space-y-6">
        <!-- Loading State -->
        <div v-if="galleryStore.isLoading" class="py-8 text-center">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
            <p class="text-sm text-neutral-600 dark:text-neutral-400">Chargement de la galerie...</p>
        </div>

        <!-- Error State -->
        <UAlert v-else-if="galleryStore.hasError" color="error" variant="soft" icon="i-lucide-alert-circle"
            :title="galleryStore.error?.message" />

        <!-- Existing Gallery -->
        <div v-else-if="galleryStore.exists" class="space-y-4">
            <UCard variant="outline">
                <template #header>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-solar-gallery-bold" class="w-5 h-5 text-white dark:text-black" />
                            </div>
                            <div>
                                <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                    Galerie
                                </h3>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                    Configuration de la galerie
                                </p>
                            </div>
                        </div>

                        <!-- Status Stepper in Header -->
                        <ProjectSharedWorkflowSteps :current-status="galleryStore.gallery?.status || 'draft'"
                            type="gallery" />
                    </div>
                </template>

                <div class="space-y-8">
                    <!-- Gallery Information -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-info" class="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Informations générales
                                </h4>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">Détails de la galerie</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <!-- Add other general info here if needed -->
                        </div>
                    </div>

                    <!-- Pricing Section -->
                    <div v-if="!isFree" class="space-y-4">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-euro" class="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Informations tarifaires
                                </h4>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">Prix et conditions de paiement
                                </p>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-neutral-600 dark:text-neutral-400">Prix</span>
                                <span class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    {{ galleryStore.formattedBasePrice }}
                                </span>
                            </div>
                            <div v-if="galleryStore.pricing?.depositPaid > 0" class="flex items-center justify-between">
                                <div>
                                    <span class="text-sm text-neutral-600 dark:text-neutral-400">Acompte</span>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                        {{ getDepositPercentage() }}% du prix total
                                    </p>
                                </div>
                                <span class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    {{ galleryStore.formattedDepositPaid }}
                                </span>
                            </div>
                        </div>

                        <!-- Payment Method -->
                        <div v-if="galleryStore.pricing?.depositPaid > 0" class="flex items-center justify-between">
                            <span class="text-sm text-neutral-600 dark:text-neutral-400">Méthode de paiement</span>
                            <UBadge :color="getPaymentMethodColor()" variant="soft" :label="getPaymentMethodLabel()" />
                        </div>
                    </div>

                    <!-- Completion Message for completed galleries -->
                    <div v-if="galleryStore.gallery?.status === 'completed'" class="space-y-4">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Galerie livrée</h4>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">Le client a validé et payé la
                                    galerie</p>
                            </div>
                        </div>
                        <div
                            class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                            <div class="flex items-center gap-3">
                                <UIcon name="i-lucide-check-circle"
                                    class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                <div>
                                    <p class="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                                        Galerie livrée et payée
                                    </p>
                                    <p class="text-xs text-emerald-700 dark:text-emerald-300">
                                        Le client a validé et payé la galerie
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Images Preview -->
                    <div v-if="galleryStore.hasImages" class="space-y-4">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-images" class="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Aperçu des images</h4>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                    {{ galleryStore.imageCount }} image{{ galleryStore.imageCount > 1 ? 's' : '' }} de
                                    la galerie
                                </p>
                            </div>
                        </div>
                        <ProjectGalleryImageGrid :images="galleryStore.gallery?.images || []" :can-delete="false"
                            :max-preview="6" @delete-image="handleDeleteImage" />
                    </div>

                    <!-- Revision Comment -->
                    <div v-if="galleryStore.gallery?.status === 'revision_requested' && galleryStore.gallery?.revision_last_comment"
                        class="space-y-3">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-message-circle" class="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Commentaire de révision
                                </h4>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">Demande de modification du
                                    client</p>
                            </div>
                        </div>

                        <div
                            class="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                            <p
                                class="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed break-words whitespace-pre-line">
                                {{ galleryStore.gallery.revision_last_comment }}
                            </p>
                        </div>
                    </div>

                </div>

                <template #footer>
                    <div class="flex items-center justify-between">
                        <!-- Secondary Actions -->
                        <div class="flex items-center gap-1">
                            <UTooltip
                                v-if="(galleryStore.gallery?.status === 'draft' || galleryStore.gallery?.status === 'awaiting_client') && !isProjectCompleted"
                                text="Supprimer la galerie">
                                <UButton icon="i-lucide-trash-2" size="sm" variant="ghost" color="error"
                                    :loading="galleryStore.loading" @click="handleDelete" />
                            </UTooltip>
                        </div>

                        <!-- Primary Actions -->
                        <div class="flex items-center gap-2">
                            <UButton v-if="galleryStore.canEdit && !isProjectCompleted" icon="i-lucide-edit" size="sm"
                                variant="outline" color="neutral" label="Modifier" @click="galleryStore.openForm()" />

                            <!-- Main CTA based on status -->
                            <UButton
                                v-if="(galleryStore.gallery?.status === 'draft' || galleryStore.gallery?.status === 'revision_requested') && !isProjectCompleted"
                                icon="i-lucide-send" size="sm" variant="solid" color="primary" label="Envoyer au client"
                                :loading="galleryStore.loading" @click="sendToClient()" />

                            <UButton
                                v-else-if="!isFree && galleryStore.gallery?.status === 'payment_pending' && galleryStore.project?.payment_method === 'bank_transfer' && !isProjectCompleted"
                                icon="i-lucide-check-circle" size="sm" variant="solid" color="success"
                                label="Confirmer paiement" :loading="galleryStore.loading"
                                @click="handleConfirmPayment" />

                            <UButton v-if="galleryStore.gallery?.status !== 'draft'" icon="i-lucide-external-link"
                                size="sm" label="Voir l'aperçu client" variant="ghost" color="neutral"
                                :to="`/gallery/${galleryStore.gallery?.id}`" target="_blank" />
                        </div>
                    </div>
                </template>
            </UCard>
        </div>

        <!-- Empty State with Create Option -->
        <div v-else class="py-8 text-center">
            <UCard variant="outline">
                <template #header>
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                            <UIcon name="i-solar-gallery-bold" class="w-5 h-5 text-white dark:text-black" />
                        </div>
                        <div class="flex flex-col items-start">
                            <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                Galerie
                            </h3>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                Souhaitez-vous créer une galerie pour ce projet ?
                            </p>
                        </div>
                    </div>
                </template>

                <div class="space-y-6">
                    <!-- Feature explanation -->
                    <div
                        class="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                        <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-3">Qu'est-ce qu'une galerie
                            ?</h4>
                        <ul class="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Livrable final pour le client</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Téléchargement en haute résolution</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Gestion des paiements</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Interface client sécurisée</span>
                            </li>
                        </ul>
                    </div>

                    <!-- Create button -->
                    <UButton v-if="!isProjectCompleted" icon="i-lucide-plus" color="primary" size="lg"
                        class="w-full sm:w-auto" :loading="galleryStore.formLoading" @click="galleryStore.openForm()">
                        Oui, créer une galerie
                    </UButton>
                    <UTooltip v-else
                        text="Le projet est terminé. Rafraîchissez la page pour voir les dernières modifications.">
                        <UButton icon="i-lucide-plus" color="primary" size="lg" class="w-full sm:w-auto"
                            :loading="galleryStore.formLoading" disabled>
                            Oui, créer une galerie
                        </UButton>
                    </UTooltip>
                </div>
            </UCard>
        </div>
    </div>

    <!-- Gallery Form Modal -->
    <UModal v-model:open="galleryStore.showForm" :title="modalTitle" :close="{ color: 'neutral', variant: 'ghost' }"
        :ui="{ content: 'w-[calc(100vw-2rem)] max-w-4xl' }" :prevent-close="galleryStore.uploadProgress.isUploading">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <UIcon name="i-solar-gallery-bold" class="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-highlighted">{{ modalTitle }}</h3>
                    <p class="text-sm text-muted">
                        {{ galleryStore.exists ?
                            'Modifiez les détails de votre galerie' :
                            'Créez une galerie pour livrer les images finales' }}
                    </p>
                </div>
            </div>
        </template>

        <template #body>
            <ProjectGalleryForm :gallery="galleryStore.gallery || undefined"
                :project-id="projectSetupStore.project?.id || ''"
                :existing-images="galleryStore.gallery?.images ? Array.from(galleryStore.gallery.images) : undefined"
                :proposal-payment-info="proposalPaymentInfo" @gallery-saved="handleGallerySaved"
                @cancel="galleryStore.closeForm()" @upload-completed="handleUploadCompleted" />
        </template>
    </UModal>


</template>

<script lang="ts" setup>
import type { GalleryFormData, ProjectPaymentData } from "~/types/gallery";

// Use stores
const projectSetupStore = useProjectSetupStore()
const galleryStore = useGalleryStore()

// Use store-level reactive flag
const isProjectCompleted = computed(() => projectSetupStore.isProjectCompleted)

// Modal title
const modalTitle = computed(() =>
    galleryStore.exists ? 'Modifier la galerie' : 'Créer une galerie'
)

// Check if project is free
const isFree = computed(() => {
    const basePrice = galleryStore.pricing?.basePrice ?? 0;
    return basePrice === 0;
})

// Check if pricing should be displayed
const shouldShowPricing = computed(() => {
    return !isFree.value &&
        galleryStore.pricing &&
        galleryStore.gallery?.status !== 'completed';
})

// Helper functions for pricing display
const getDepositPercentage = () => {
    if (!galleryStore.pricing?.depositPaid || !galleryStore.pricing?.basePrice) return 0;
    return Math.round((galleryStore.pricing.depositPaid / galleryStore.pricing.basePrice) * 100);
}

const getPaymentMethodColor = () => {
    const method = galleryStore.project?.payment_method;
    if (method === 'bank_transfer') return 'info';
    if (method === 'stripe') return 'success';
    return 'neutral';
}

const getPaymentMethodLabel = () => {
    const method = galleryStore.project?.payment_method;
    if (method === 'bank_transfer') return 'Virement bancaire';
    if (method === 'stripe') return 'Carte bancaire';
    return 'Non défini';
}

// Computed for proposal payment info
const proposalPaymentInfo = computed(() => {
    if (!galleryStore.pricing) return undefined;

    return {
        payment_method: galleryStore.project?.payment_method || null,
        deposit_required: galleryStore.pricing.depositPaid > 0,
        deposit_amount: galleryStore.pricing.depositPaid
    };
});

// Load gallery when component is mounted
onMounted(async () => {
    const projectId = projectSetupStore.project?.id
    if (projectId && !galleryStore.exists) {
        try {
            await galleryStore.loadGallery(projectId)
        } catch (err) {
            console.error('Error loading gallery:', err)
        }
    }
})

// Handle gallery saved
const handleGallerySaved = async (data: {
    gallery: Record<string, unknown>;
    project: Record<string, unknown>;
    selectedFiles?: File[]
}) => {
    try {
        if (galleryStore.exists && galleryStore.gallery) {
            // Update existing gallery
            await galleryStore.updateGallery(
                galleryStore.gallery.id,
                data.gallery as GalleryFormData,
                data.project as ProjectPaymentData,
                data.selectedFiles
            );
        } else {
            // Create new gallery
            await galleryStore.createGallery(
                projectSetupStore.project!.id,
                data.gallery as GalleryFormData,
                data.project as ProjectPaymentData,
                data.selectedFiles
            );
        }

        const toast = useToast();

        // Show different messages based on whether files were uploaded
        const hasFiles = data.selectedFiles && data.selectedFiles.length > 0;
        const title = galleryStore.exists ? 'Galerie mise à jour' : 'Galerie créée';
        const description = hasFiles
            ? `La galerie a été sauvegardée et ${data.selectedFiles!.length} image${data.selectedFiles!.length > 1 ? 's ont' : ' a'} été uploadée${data.selectedFiles!.length > 1 ? 's' : ''} avec succès.`
            : 'La galerie a été sauvegardée avec succès.';

        toast.add({
            title,
            description,
            icon: 'i-lucide-check-circle',
            color: 'success'
        });
    } catch (err) {
        console.error('Error saving gallery:', err);
        const toast = useToast();
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la sauvegarde.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        });
    }
};

const handleDeleteImage = async (imageId: string) => {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.')
    if (!confirmed) return

    try {
        await galleryStore.deleteImage(imageId)
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

const handleDelete = async () => {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette galerie ? Cette action est irréversible.')
    if (!confirmed || !galleryStore.gallery) return

    try {
        await galleryStore.deleteGallery(galleryStore.gallery.id)

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

const sendToClient = async () => {
    if (!galleryStore.gallery) return;

    try {
        await galleryStore.sendToClient(galleryStore.gallery.id)

        const toast = useToast();
        toast.add({
            title: 'Galerie envoyée',
            description: 'La galerie a été envoyée au client.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        });
    } catch (err) {
        console.error('Error sending gallery:', err);
        const toast = useToast();
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de l\'envoi.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        });
    }
};

const handleConfirmPayment = async () => {
    if (!galleryStore.gallery || galleryStore.project?.payment_method !== 'bank_transfer' || isFree.value) return

    try {
        await galleryStore.confirmPayment(galleryStore.gallery.id)

        const toast = useToast()
        toast.add({
            title: 'Paiement confirmé',
            description: 'Le paiement a été confirmé avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })
    } catch {
        const toast = useToast()
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la confirmation.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}

const handleUploadCompleted = async () => {
    // Reset upload state and close form
    galleryStore.resetUploadState()
    galleryStore.closeForm()
}
</script>