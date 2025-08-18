<template>
    <div class="space-y-6">
        <!-- Loading State -->
        <div v-if="selectionStore.isLoading" class="py-8 text-center">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
            <p class="text-sm text-neutral-600 dark:text-neutral-400">Chargement de la sélection...</p>
        </div>

        <!-- Error State -->
        <UAlert v-else-if="selectionStore.hasError" color="error" variant="soft" icon="i-lucide-alert-circle"
            :title="selectionStore.error?.message" />

        <!-- Existing Selection -->
        <div v-else-if="selectionStore.exists" class="space-y-4">
            <!-- Upload Progress Indicator -->
            <ProjectSelectionUploadProgress />

            <UCard variant="outline">
                <template #header>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-mouse-pointer-click" class="w-5 h-5 text-white dark:text-black" />
                            </div>
                            <div>
                                <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                    Sélection
                                </h3>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                    Configuration de la sélection
                                </p>
                            </div>
                        </div>

                        <!-- Status Stepper in Header -->
                        <ProjectSharedWorkflowSteps :current-status="selectionStore.selection?.status || 'draft'"
                            type="selection" />
                    </div>
                </template>

                <div class="space-y-8">
                    <!-- Selection Information -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-info" class="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Informations générales
                                </h4>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">Détails de la sélection</p>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-neutral-600 dark:text-neutral-400">Sélection max</span>
                                <span class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    {{ selectionStore.formattedSelectionLimit }}
                                </span>
                            </div>

                            <div v-if="selectionStore.formattedExtraMediaPrice"
                                class="flex items-center justify-between">
                                <span class="text-sm text-neutral-600 dark:text-neutral-400">Prix média
                                    supplémentaire</span>
                                <span class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    {{ selectionStore.formattedExtraMediaPrice }}
                                </span>
                            </div>
                        </div>

                        <!-- Selected Count -->
                        <div v-if="selectionStore.selectedCount > 0" class="space-y-2">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Sélectionnés
                                par le client</span>
                            <div class="flex items-center gap-2">
                                <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-orange-500" />
                                <span class="text-sm text-orange-600 dark:text-orange-400">
                                    {{ selectionStore.selectedCount }} image{{ selectionStore.selectedCount > 1 ? 's' :
                                        ''
                                    }}
                                    sélectionnée{{ selectionStore.selectedCount > 1 ? 's' : '' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Images Preview -->
                    <div v-if="selectionStore.hasImages" class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                    <UIcon name="i-lucide-images" class="w-4 h-4 text-white dark:text-black" />
                                </div>
                                <div>
                                    <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Aperçu des images
                                    </h4>
                                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                        {{ selectionStore.imageCount }} image{{ selectionStore.imageCount > 1 ? 's' : ''
                                        }}
                                        disponible{{ selectionStore.imageCount > 1 ? 's' : '' }}
                                    </p>
                                </div>
                            </div>
                            <UButton v-if="selectionStore.selectedCount > 0" icon="i-lucide-download" size="xs"
                                variant="ghost" color="neutral" :loading="selectionStore.isDownloadingZip"
                                :disabled="selectionStore.isDownloadingZip" @click="handleDownloadSelectedAsZip">
                                Télécharger sélection (ZIP)
                            </UButton>
                        </div>
                        <ProjectSelectionImageGrid :images="Array.from(selectionStore.selection?.images || [])"
                            :can-delete="false" :can-toggle-selection="false" :max-preview="6"
                            :show-selection-state="true" @delete-image="handleDeleteImage" />
                    </div>

                    <!-- Revision Comment -->
                    <div v-if="selectionStore.selection?.status === 'revision_requested' && selectionStore.selection?.revision_last_comment"
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
                                {{ selectionStore.selection.revision_last_comment }}
                            </p>
                        </div>
                    </div>

                </div>

                <template #footer>
                    <div class="flex items-center justify-between">
                        <!-- Secondary Actions -->
                        <div class="flex items-center gap-1">
                            <UTooltip
                                v-if="(selectionStore.selection?.status === 'draft' || selectionStore.selection?.status === 'awaiting_client') && !isProjectCompleted"
                                text="Supprimer la sélection">
                                <UButton icon="i-lucide-trash-2" size="sm" variant="ghost" color="error"
                                    :loading="selectionStore.loading" @click="handleDelete" />
                            </UTooltip>
                        </div>

                        <!-- Primary Actions -->
                        <div class="flex items-center gap-2">
                            <UButton v-if="selectionStore.canEdit && !isProjectCompleted" icon="i-lucide-edit" size="sm"
                                variant="outline" color="neutral" label="Modifier" @click="selectionStore.openForm()" />

                            <!-- Main CTA based on status -->
                            <UButton
                                v-if="(selectionStore.selection?.status === 'draft' || selectionStore.selection?.status === 'revision_requested') && !isProjectCompleted"
                                icon="i-lucide-send" size="sm" variant="solid" color="primary" label="Envoyer au client"
                                :loading="selectionStore.loading" @click="sendToClient()" />

                            <UButton v-if="selectionStore.selection?.status !== 'draft'" icon="i-lucide-external-link"
                                size="sm" label="Voir l'aperçu client" variant="ghost" color="neutral"
                                :to="`/selection/${selectionStore.selection?.id}`" target="_blank" />
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
                            <UIcon name="i-lucide-image" class="w-5 h-5 text-white dark:text-black" />
                        </div>
                        <div class="flex flex-col items-start">
                            <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                Sélection
                            </h3>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                Souhaitez-vous créer une sélection pour ce projet ?
                            </p>
                        </div>
                    </div>
                </template>

                <div class="space-y-6">
                    <!-- Feature explanation -->
                    <div
                        class="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                        <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-3">Qu'est-ce qu'une sélection
                            ?</h4>
                        <ul class="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Sélection d'images par le client</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Validation des choix finaux</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Gestion des médias supplémentaires</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Interface intuitive de sélection</span>
                            </li>
                        </ul>
                    </div>

                    <!-- Create button -->
                    <UButton v-if="!isProjectCompleted" icon="i-lucide-plus" color="primary" size="lg"
                        class="w-full sm:w-auto" :loading="selectionStore.formLoading"
                        @click="selectionStore.openForm()">
                        Oui, créer une sélection
                    </UButton>
                    <UTooltip v-else
                        text="Le projet est terminé. Rafraîchissez la page pour voir les dernières modifications.">
                        <UButton icon="i-lucide-plus" color="primary" size="lg" class="w-full sm:w-auto"
                            :loading="selectionStore.formLoading" disabled>
                            Oui, créer une sélection
                        </UButton>
                    </UTooltip>
                </div>
            </UCard>
        </div>
    </div>

    <!-- Selection Form Modal -->
    <UModal v-model:open="selectionStore.showForm" :title="modalTitle" :close="{ color: 'neutral', variant: 'ghost' }"
        :ui="{ content: 'w-[calc(100vw-2rem)] max-w-4xl' }">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <UIcon name="i-lucide-mouse-pointer-click" class="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-highlighted">{{ modalTitle }}</h3>
                    <p class="text-sm text-muted">
                        {{ selectionStore.exists ?
                            'Modifiez les détails de votre sélection' :
                            'Créez une sélection pour permettre au client de choisir ses images' }}
                    </p>
                </div>
            </div>
        </template>

        <template #body>
            <ProjectSelectionForm :selection="selectionStore.selection || undefined"
                :project-id="projectSetupStore.project?.id || ''"
                :existing-images="selectionStore.selection?.images ? Array.from(selectionStore.selection.images) : undefined"
                @selection-saved="handleSelectionSaved" @cancel="selectionStore.closeForm()" />
        </template>
    </UModal>
</template>

<script lang="ts" setup>
import type { SelectionFormData } from "~/types/selection";

// Use stores
const projectSetupStore = useProjectSetupStore()
const selectionStore = useSelectionStore()

// Use store-level reactive flag
const isProjectCompleted = computed(() => projectSetupStore.isProjectCompleted)

// Modal title
const modalTitle = computed(() =>
    selectionStore.exists ? 'Modifier la sélection' : 'Créer une sélection'
)

// Initialize selection store when project is loaded
watch(() => projectSetupStore.project, async (project) => {
    if (project?.id) {
        try {
            await selectionStore.loadSelection(project.id)
        } catch (err) {
            console.error('Error loading selection:', err)
        }
    }
}, { immediate: true })

// Handle selection saved
const handleSelectionSaved = async (data: {
    selection: Record<string, unknown>;
    selectedFiles?: File[]
}) => {
    try {
        // Fermer la modal immédiatement
        selectionStore.closeForm();

        if (selectionStore.exists && selectionStore.selection) {
            // Update existing selection
            await selectionStore.updateSelection(
                selectionStore.selection.id,
                data.selection as SelectionFormData,
                data.selectedFiles
            );
        } else {
            // Create new selection
            await selectionStore.createSelection(
                projectSetupStore.project!.id,
                data.selection as SelectionFormData,
                data.selectedFiles
            );
        }

        const toast = useToast();
        toast.add({
            title: selectionStore.exists ? 'Sélection mise à jour' : 'Sélection créée',
            description: 'La sélection a été sauvegardée avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        });
    } catch (err) {
        console.error('Error saving selection:', err);
        const toast = useToast();
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la sauvegarde.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        });
    }
};

const sendToClient = async () => {
    if (!selectionStore.selection) return;

    try {
        await selectionStore.sendToClient(selectionStore.selection.id)

        const toast = useToast();
        toast.add({
            title: 'Sélection envoyée',
            description: 'La sélection a été envoyée au client.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        });
    } catch (err) {
        console.error('Error sending selection:', err);
        const toast = useToast();
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de l\'envoi.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        });
    }
};

const handleDeleteImage = async (imageId: string) => {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.')
    if (!confirmed) return

    try {
        await selectionStore.deleteImage(imageId)
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
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette sélection ? Cette action est irréversible.')
    if (!confirmed || !selectionStore.selection) return

    try {
        await selectionStore.deleteSelection(selectionStore.selection.id)

        const toast = useToast()
        toast.add({
            title: 'Sélection supprimée',
            description: 'La sélection a été supprimée avec succès.',
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

const handleDownloadSelectedAsZip = async () => {
    try {
        await selectionStore.downloadSelectedImagesAsZip()
    } catch (error) {
        console.error('ZIP download failed:', error)
        const toast = useToast()
        toast.add({
            title: 'Erreur de téléchargement ZIP',
            description: error instanceof Error ? error.message : 'Erreur lors du téléchargement du ZIP',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}
</script>