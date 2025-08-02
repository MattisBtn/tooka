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
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Paiement</span>
                            <div class="flex items-center gap-2">
                                <UIcon name="i-lucide-credit-card" class="w-4 h-4 text-neutral-500" />
                                <span class="text-sm text-neutral-600 dark:text-neutral-400">
                                    {{ galleryStore.gallery?.payment_required ? 'Requis' : 'Gratuit' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Pricing Information -->
                    <div v-if="galleryStore.pricing" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                        <UButton v-if="galleryStore.canEdit" icon="i-lucide-edit" size="sm" variant="outline"
                            color="neutral" label="Modifier" @click="galleryStore.openForm()" />

                        <!-- Preview Action - Available for all non-draft statuses -->
                        <UButton v-if="galleryStore.gallery?.status !== 'draft'" icon="i-lucide-external-link" size="sm"
                            variant="outline" color="neutral" label="Aperçu client"
                            :to="`/gallery/${galleryStore.gallery?.id}`" target="_blank" />

                        <!-- Confirm Payment Action - Only for payment_pending -->
                        <UButton v-if="galleryStore.gallery?.status === 'payment_pending'" icon="i-lucide-check-circle"
                            size="sm" variant="outline" color="success" label="Confirmer paiement"
                            :loading="galleryStore.loading" @click="handleConfirmPayment" />

                        <!-- Delete Action - Only for draft -->
                        <UButton v-if="galleryStore.gallery?.status === 'draft'" icon="i-lucide-trash-2" size="sm"
                            variant="outline" color="error" label="Supprimer" :loading="galleryStore.loading"
                            @click="handleDelete" />
                    </div>
                </div>
            </UCard>
        </div>

        <!-- Empty State with Create Option -->
        <div v-else class="py-8 text-center">
            <UCard variant="outline">
                <template #header>
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
                            <UIcon name="i-solar-gallery-bold" class="w-5 h-5 text-white" />
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

                    <!-- Create button -->
                    <UButton icon="i-lucide-plus" color="primary" size="lg" class="w-full sm:w-auto"
                        :loading="galleryStore.formLoading" @click="galleryStore.openForm()">
                        Oui, créer une galerie
                    </UButton>
                </div>
            </UCard>
        </div>
    </div>

    <!-- Gallery Form Modal -->
    <UModal v-model:open="galleryStore.showForm" :fullscreen="true" :transition="true">
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
                            <UButton icon="i-lucide-x" size="sm" variant="ghost" color="neutral"
                                @click="galleryStore.closeForm()" />
                        </div>
                    </div>

                    <!-- Form Content -->
                    <div class="flex-1 p-6 overflow-y-auto">
                        <div class="max-w-4xl mx-auto">
                            <ProjectGalleryForm :gallery="galleryStore.gallery || undefined"
                                :project-id="projectSetupStore.project?.id || ''"
                                :existing-images="galleryStore.gallery?.images ? Array.from(galleryStore.gallery.images) : undefined"
                                :pricing="galleryStore.pricing || undefined"
                                :proposal-payment-info="proposalPaymentInfo"
                                :project="galleryStore.project || undefined" @gallery-saved="handleGallerySaved"
                                @cancel="galleryStore.closeForm()" />
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script lang="ts" setup>
import { useProposal } from "~/composables/proposals/useProposal";
import type { GalleryFormData, ProjectPaymentData } from "~/types/gallery";
import { getStatusColor, getStatusLabel } from "~/utils/formatters";

// Use stores
const projectSetupStore = useProjectSetupStore()
const galleryStore = useGalleryStore()

// Use proposal composable to get payment info
const { proposal } = useProposal(projectSetupStore.project?.id || '')

// Computed for proposal payment info
const proposalPaymentInfo = computed(() => {
    if (!proposal.value || !projectSetupStore.project) return undefined;

    return {
        payment_method: projectSetupStore.project.payment_method,
        deposit_required: proposal.value.deposit_required,
        deposit_amount: proposal.value.deposit_amount
    };
});

// Initialize gallery store when project is loaded
watch(() => projectSetupStore.project, async (project) => {
    if (project?.id) {
        try {
            await galleryStore.loadGallery(project.id)
        } catch (err) {
            console.error('Error loading gallery:', err)
        }
    }
}, { immediate: true })

// Handle gallery saved
const handleGallerySaved = async (data: {
    gallery: Record<string, unknown>;
    project: Record<string, unknown>;
    projectUpdated: boolean;
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

        if (data.projectUpdated) {
            await projectSetupStore.refreshProject()
        }

        const toast = useToast();
        toast.add({
            title: galleryStore.exists ? 'Galerie mise à jour' : 'Galerie créée',
            description: 'La galerie a été sauvegardée avec succès.',
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

const handleConfirmPayment = async () => {
    if (!galleryStore.gallery) return

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
</script>