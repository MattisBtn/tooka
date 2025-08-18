<template>
    <div class="space-y-6">
        <!-- Loading State -->
        <div v-if="moodboardStore.isLoading" class="py-8 text-center">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
            <p class="text-sm text-neutral-600 dark:text-neutral-400">Chargement du moodboard...</p>
        </div>

        <!-- Error State -->
        <UAlert v-else-if="moodboardStore.hasError" color="error" variant="soft" icon="i-lucide-alert-circle"
            :title="moodboardStore.error?.message" />

        <!-- Existing Moodboard -->
        <div v-else-if="moodboardStore.exists" class="space-y-4">
            <UCard variant="outline">
                <template #header>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-image" class="w-5 h-5 text-white dark:text-black" />
                            </div>
                            <div>
                                <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">
                                    Moodboard
                                </h3>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                    Configuration du moodboard
                                </p>
                            </div>
                        </div>

                        <!-- Status Stepper in Header -->
                        <ProjectSharedWorkflowSteps :current-status="moodboardStore.moodboard?.status || 'draft'"
                            type="moodboard" />
                    </div>
                </template>

                <div class="space-y-8">
                    <!-- Moodboard Information -->
                    <div class="space-y-4">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-info" class="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Informations générales
                                </h4>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">Détails du moodboard</p>
                            </div>
                        </div>

                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            <span class="font-semibold">Titre :</span> {{ moodboardStore.moodboard?.title }}
                        </p>

                        <div v-if="moodboardStore.moodboard?.description"
                            class="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                            <p class="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                {{ moodboardStore.moodboard.description }}
                            </p>
                        </div>
                    </div>

                    <!-- Images Preview -->
                    <div v-if="moodboardStore.hasImages" class="space-y-4">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-8 h-8 bg-gradient-to-br bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <UIcon name="i-lucide-images" class="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">Aperçu des images</h4>
                                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                    {{ moodboardStore.imageCount }} image{{ moodboardStore.imageCount > 1 ? 's' : '' }}
                                    d'inspiration
                                </p>
                            </div>
                        </div>
                        <ProjectMoodboardImageGrid :images="Array.from(moodboardStore.moodboard?.images || [])"
                            :can-delete="false" :is-editing="false" :max-preview="6"
                            @delete-image="handleDeleteImage" />
                    </div>

                    <!-- Revision Comment -->
                    <div v-if="moodboardStore.moodboard?.status === 'revision_requested' && moodboardStore.moodboard?.revision_last_comment"
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
                                {{ moodboardStore.moodboard.revision_last_comment }}
                            </p>
                        </div>
                    </div>

                </div>

                <template #footer>
                    <div class="flex items-center justify-between">
                        <!-- Secondary Actions -->
                        <div class="flex items-center gap-1">
                            <UTooltip
                                v-if="(moodboardStore.moodboard?.status === 'draft' || moodboardStore.moodboard?.status === 'awaiting_client') && !isProjectCompleted"
                                text="Supprimer le moodboard">
                                <UButton icon="i-lucide-trash-2" size="sm" variant="ghost" color="error"
                                    :loading="moodboardStore.loading" @click="handleDelete" />
                            </UTooltip>
                        </div>

                        <!-- Primary Actions -->
                        <div class="flex items-center gap-2">
                            <UButton v-if="moodboardStore.canEdit && !isProjectCompleted" icon="i-lucide-edit" size="sm"
                                variant="outline" color="neutral" label="Modifier" @click="moodboardStore.openForm()" />

                            <!-- Main CTA based on status -->
                            <UButton
                                v-if="(moodboardStore.moodboard?.status === 'draft' || moodboardStore.moodboard?.status === 'revision_requested') && !isProjectCompleted"
                                icon="i-lucide-send" size="sm" variant="solid" color="primary" label="Envoyer au client"
                                :loading="moodboardStore.loading" @click="sendToClient()" />

                            <UButton v-if="moodboardStore.moodboard?.status !== 'draft'" icon="i-lucide-external-link"
                                size="sm" label="Voir l'aperçu client" variant="ghost" color="neutral"
                                :to="`/moodboard/${moodboardStore.moodboard?.id}`" target="_blank" />
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
                                Moodboard
                            </h3>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                Souhaitez-vous créer un moodboard pour ce projet ?
                            </p>
                        </div>
                    </div>
                </template>

                <div class="space-y-6">
                    <!-- Feature explanation -->
                    <div
                        class="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                        <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-3">Qu'est-ce qu'un moodboard
                            ?</h4>
                        <ul class="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Planche d'inspiration visuelle pour le client</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Validation des directions créatives</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Commentaires et réactions du client</span>
                            </li>
                            <li class="flex items-start gap-2">
                                <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Collaboration en temps réel</span>
                            </li>
                        </ul>
                    </div>

                    <!-- Create button -->

                    <UButton v-if="!isProjectCompleted" icon="i-lucide-plus" color="primary" size="lg"
                        class="w-full sm:w-auto" :loading="moodboardStore.formLoading"
                        @click="moodboardStore.openForm()">
                        Oui, créer un moodboard
                    </UButton>

                    <UTooltip v-else
                        text="Le projet est terminé. Rafraîchissez la page pour voir les dernières modifications.">
                        <UButton icon="i-lucide-plus" color="primary" size="lg" class="w-full sm:w-auto"
                            :loading="moodboardStore.formLoading" disabled>
                            Oui, créer un moodboard
                        </UButton>
                    </UTooltip>
                </div>
            </UCard>
        </div>
    </div>

    <!-- Moodboard Form Modal -->
    <UModal v-model:open="moodboardStore.showForm" :title="modalTitle" :close="{ color: 'neutral', variant: 'ghost' }"
        :ui="{ content: 'w-[calc(100vw-2rem)] max-w-4xl' }" :prevent-close="moodboardStore.uploadProgress.isUploading">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <UIcon name="i-lucide-image" class="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-highlighted">{{ modalTitle }}</h3>
                    <p class="text-sm text-muted">
                        {{ moodboardStore.exists ?
                            'Modifiez les détails de votre moodboard' :
                            'Créez un moodboard pour partager votre vision artistique' }}
                    </p>
                </div>
            </div>
        </template>

        <template #body>
            <ProjectMoodboardForm :moodboard="moodboardStore.moodboard || undefined"
                :project-id="projectSetupStore.project?.id || ''"
                :existing-images="moodboardStore.moodboard?.images ? Array.from(moodboardStore.moodboard.images) : undefined"
                @moodboard-saved="handleMoodboardSaved" @cancel="moodboardStore.closeForm()"
                @upload-completed="handleUploadCompleted" />
        </template>
    </UModal>
</template>

<script lang="ts" setup>
import type { MoodboardFormData } from "~/types/moodboard";

// Use stores
const projectSetupStore = useProjectSetupStore()
const moodboardStore = useMoodboardStore()

// Use store-level reactive flag
const isProjectCompleted = computed(() => projectSetupStore.isProjectCompleted)

// Modal title
const modalTitle = computed(() =>
    moodboardStore.exists ? 'Modifier le moodboard' : 'Créer un moodboard'
)

// Initialize moodboard store when project is loaded
watch(() => projectSetupStore.project, async (project) => {
    if (project?.id) {
        try {
            await moodboardStore.loadMoodboard(project.id)
        } catch (err) {
            console.error('Error loading moodboard:', err)
        }
    }
}, { immediate: true })

// Handle moodboard saved
const handleMoodboardSaved = async (data: {
    moodboard: Record<string, unknown>;
    selectedFiles?: File[]
}) => {
    try {
        if (moodboardStore.exists && moodboardStore.moodboard) {
            // Update existing moodboard
            await moodboardStore.updateMoodboard(
                moodboardStore.moodboard.id,
                data.moodboard as MoodboardFormData,
                data.selectedFiles
            );
        } else {
            // Create new moodboard
            await moodboardStore.createMoodboard(
                projectSetupStore.project!.id,
                data.moodboard as MoodboardFormData,
                data.selectedFiles
            );
        }

        const toast = useToast();

        // Show different messages based on whether files were uploaded
        const hasFiles = data.selectedFiles && data.selectedFiles.length > 0;
        const title = moodboardStore.exists ? 'Moodboard mis à jour' : 'Moodboard créé';
        const description = hasFiles
            ? `Le moodboard a été sauvegardé et ${data.selectedFiles!.length} image${data.selectedFiles!.length > 1 ? 's ont' : ' a'} été uploadée${data.selectedFiles!.length > 1 ? 's' : ''} avec succès.`
            : 'Le moodboard a été sauvegardé avec succès.';

        toast.add({
            title,
            description,
            icon: 'i-lucide-check-circle',
            color: 'success'
        });
    } catch (err) {
        console.error('Error saving moodboard:', err);
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
        await moodboardStore.deleteImage(imageId)
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
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer ce moodboard ? Cette action est irréversible.')
    if (!confirmed || !moodboardStore.moodboard) return

    try {
        await moodboardStore.deleteMoodboard(moodboardStore.moodboard.id)

        const toast = useToast()
        toast.add({
            title: 'Moodboard supprimé',
            description: 'Le moodboard a été supprimé avec succès.',
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
    if (!moodboardStore.moodboard) return;

    try {
        await moodboardStore.sendToClient(moodboardStore.moodboard.id)

        const toast = useToast();
        toast.add({
            title: 'Moodboard envoyé',
            description: 'Le moodboard a été envoyé au client.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        });
    } catch (err) {
        console.error('Error sending moodboard:', err);
        const toast = useToast();
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de l\'envoi.',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        });
    }
};

const handleUploadCompleted = async () => {
    // Reset upload state and close form
    moodboardStore.resetUploadState()
    moodboardStore.closeForm()
}
</script>