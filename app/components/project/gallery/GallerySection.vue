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

                        <!-- Status Badge in Header -->
                        <div class="flex items-center gap-2">
                            <UBadge :color="getStatusColor(galleryStore.gallery?.status)" variant="soft"
                                :label="getStatusLabel(galleryStore.gallery?.status || 'Inconnu', 'gallery')" />
                        </div>
                    </div>
                </template>

                <div class="space-y-6">
                    <!-- Gallery Information -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Images</span>
                            <div class="flex items-center gap-2">
                                <UIcon name="i-lucide-images" class="w-4 h-4 text-neutral-500" />
                                <span class="text-sm text-neutral-600 dark:text-neutral-400">
                                    {{ galleryStore.imageCount }} image{{ galleryStore.imageCount > 1 ? 's' : '' }}
                                    uploadée{{ galleryStore.imageCount > 1 ? 's' : '' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Pricing Information -->
                    <div v-if="!isFree && galleryStore.pricing" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Prix
                                total</span>
                            <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                {{ galleryStore.formattedBasePrice }}
                            </p>
                        </div>
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Acompte
                                payé</span>
                            <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                {{ galleryStore.formattedDepositPaid }}
                            </p>
                        </div>
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Reste
                                à
                                payer</span>
                            <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                {{ galleryStore.formattedRemainingAmount }}
                            </p>
                        </div>
                    </div>

                    <!-- Revision Comment -->
                    <div v-if="galleryStore.gallery?.status === 'revision_requested' && galleryStore.gallery?.revision_last_comment"
                        class="space-y-2">
                        <span
                            class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Commentaire
                            de
                            révision</span>
                        <div
                            class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <div class="flex items-start gap-3">
                                <UIcon name="i-lucide-message-circle"
                                    class="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                <div class="flex-1">
                                    <p class="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                                        Demande de révision du client
                                    </p>
                                    <p class="text-sm text-amber-800 dark:text-amber-200">
                                        {{ galleryStore.gallery.revision_last_comment }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Images Preview -->
                    <div v-if="galleryStore.hasImages" class="space-y-3">
                        <div class="flex items-center gap-2">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Aperçu
                                des
                                images</span>
                        </div>
                        <ProjectGalleryImageGrid :images="Array.from(galleryStore.gallery?.images || [])"
                            :can-delete="false" :is-editing="false" :max-preview="6"
                            @delete-image="handleDeleteImage" />
                    </div>

                    <!-- Contextual Actions -->
                    <div
                        class="flex items-center gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700 justify-end">
                        <!-- Edit Action - Available for draft and revision_requested -->
                        <UTooltip v-if="galleryStore.canEdit && !isProjectCompleted" text="Modifier la galerie">
                            <UButton icon="i-lucide-edit" size="sm" variant="outline" color="neutral" label="Modifier"
                                @click="galleryStore.openForm()" />
                        </UTooltip>
                        <UTooltip v-else-if="galleryStore.canEdit && isProjectCompleted"
                            text="Le projet est terminé. Rafraîchissez la page pour voir les dernières modifications.">
                            <UButton icon="i-lucide-edit" size="sm" variant="outline" color="neutral" label="Modifier"
                                disabled />
                        </UTooltip>

                        <!-- Send to Client Action - Only for draft -->
                        <UTooltip v-if="galleryStore.gallery?.status === 'draft' && !isProjectCompleted"
                            text="Envoyer la galerie au client">
                            <UButton icon="i-lucide-send" size="sm" variant="solid" color="primary"
                                label="Envoyer au client" :loading="galleryStore.loading" @click="sendToClient()" />
                        </UTooltip>
                        <UTooltip v-else-if="galleryStore.gallery?.status === 'draft' && isProjectCompleted"
                            text="Le projet est terminé. Rafraîchissez la page pour voir les dernières modifications.">
                            <UButton icon="i-lucide-send" size="sm" variant="solid" color="primary"
                                label="Envoyer au client" disabled />
                        </UTooltip>

                        <!-- Preview Action - Available for all non-draft statuses -->
                        <UTooltip v-if="galleryStore.gallery?.status !== 'draft'" text="Voir l'aperçu client">
                            <UButton icon="i-lucide-external-link" size="sm" variant="outline" color="neutral"
                                label="Aperçu client" :to="`/gallery/${galleryStore.gallery?.id}`" target="_blank" />
                        </UTooltip>

                        <!-- Confirm Payment Action - Only for payment_pending and bank_transfer -->
                        <UTooltip
                            v-if="!isFree && galleryStore.gallery?.status === 'payment_pending' && galleryStore.project?.payment_method === 'bank_transfer' && !isProjectCompleted"
                            text="Confirmer le paiement reçu">
                            <UButton icon="i-lucide-check-circle" size="sm" variant="outline" color="success"
                                label="Confirmer paiement" :loading="galleryStore.loading"
                                @click="handleConfirmPayment" />
                        </UTooltip>

                        <!-- Delete Action - Only for draft and awaiting_client -->
                        <UTooltip
                            v-if="(galleryStore.gallery?.status === 'draft' || galleryStore.gallery?.status === 'awaiting_client') && !isProjectCompleted"
                            text="Supprimer la galerie">
                            <UButton icon="i-lucide-trash-2" size="sm" variant="outline" color="error" label="Supprimer"
                                :loading="galleryStore.loading" @click="handleDelete" />
                        </UTooltip>
                    </div>
                </div>
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
    <UModal v-model:open="galleryStore.showForm" :fullscreen="true" :transition="true"
        :prevent-close="galleryStore.uploadProgress.isUploading">
        <template #content>
            <div class="flex h-full bg-neutral-50 dark:bg-neutral-900">
                <!-- Form Content -->
                <div class="flex-1 flex flex-col">
                    <!-- Modal Header -->
                    <div class="p-6 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <UIcon name="i-solar-gallery-bold" class="w-6 h-6 text-violet-600" />
                                <div>
                                    <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                        {{ galleryStore.exists ? 'Modifier la galerie' : 'Créer une galerie' }}
                                    </h2>
                                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                        Configurez les détails de votre galerie
                                    </p>
                                </div>
                            </div>
                            <UButton v-if="!galleryStore.uploadProgress.isUploading" icon="i-lucide-x" size="sm"
                                variant="ghost" color="neutral" @click="galleryStore.closeForm()" />
                        </div>
                    </div>

                    <!-- Form Content -->
                    <div class="flex-1 p-6 overflow-y-auto">
                        <div class="max-w-4xl mx-auto">
                            <ProjectGalleryForm :gallery="galleryStore.gallery || undefined"
                                :project-id="projectSetupStore.project?.id || ''"
                                :existing-images="galleryStore.gallery?.images ? Array.from(galleryStore.gallery.images) : undefined"
                                :proposal-payment-info="proposalPaymentInfo" @gallery-saved="handleGallerySaved"
                                @cancel="galleryStore.closeForm()" @upload-completed="handleUploadCompleted" />
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </UModal>


</template>

<script lang="ts" setup>
import type { GalleryFormData, ProjectPaymentData } from "~/types/gallery";
import { getStatusColor, getStatusLabel } from "~/utils/formatters";

// Use stores
const projectSetupStore = useProjectSetupStore()
const galleryStore = useGalleryStore()

// Use store-level reactive flag
const isProjectCompleted = computed(() => projectSetupStore.isProjectCompleted)

// Check if project is free
const isFree = computed(() => projectSetupStore.isFree)



// Computed for proposal payment info
const proposalPaymentInfo = computed(() => {
    if (!galleryStore.pricing) return undefined;

    return {
        payment_method: galleryStore.project?.payment_method || null,
        deposit_required: galleryStore.pricing.depositPaid > 0,
        deposit_amount: galleryStore.pricing.depositPaid
    };
});

// Initialize stores when project is loaded
watch(() => projectSetupStore.project, async (project) => {
    if (project?.id) {
        try {
            await galleryStore.loadGallery(project.id)
        } catch (err) {
            console.error('Error loading project data:', err)
        }
    }
}, { immediate: true })

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

        // Refresh project to sync module states
        await projectSetupStore.refreshProject()

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
        const result = await galleryStore.sendToClient(galleryStore.gallery.id)

        if (result.projectUpdated) {
            await projectSetupStore.refreshProject()
        }

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
        await projectSetupStore.refreshProject()

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

    // Reload gallery data to get the updated images
    if (projectSetupStore.project?.id) {
        await galleryStore.loadGallery(projectSetupStore.project.id)
    }
}
</script>