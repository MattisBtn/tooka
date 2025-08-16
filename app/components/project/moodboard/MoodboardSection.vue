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

                        <!-- Status Badge in Header -->
                        <div class="flex items-center gap-2">
                            <UBadge :color="getStatusColor(moodboardStore.moodboard?.status)" variant="soft"
                                :label="getStatusLabel(moodboardStore.moodboard?.status || 'Inconnu', 'moodboard')" />
                        </div>
                    </div>
                </template>

                <div class="space-y-6">
                    <!-- Moodboard Information -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Titre</span>
                            <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                {{ moodboardStore.moodboard?.title }}
                            </p>
                        </div>
                        <div class="space-y-1">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Images</span>
                            <div class="flex items-center gap-2">
                                <UIcon name="i-lucide-images" class="w-4 h-4 text-neutral-500" />
                                <span class="text-sm text-neutral-600 dark:text-neutral-400">
                                    {{ moodboardStore.imageCount }} image{{ moodboardStore.imageCount > 1 ? 's' : '' }}
                                    d'inspiration
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Description -->
                    <div v-if="moodboardStore.moodboard?.description" class="space-y-2">
                        <span
                            class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Description</span>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            {{ moodboardStore.moodboard.description }}
                        </p>
                    </div>

                    <!-- Revision Comment -->
                    <div v-if="moodboardStore.moodboard?.status === 'revision_requested' && moodboardStore.moodboard?.revision_last_comment"
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
                                        {{ moodboardStore.moodboard.revision_last_comment }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Images Preview -->
                    <div v-if="moodboardStore.hasImages" class="space-y-3">
                        <div class="flex items-center gap-2">
                            <span
                                class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Aperçu
                                des
                                images</span>
                        </div>
                        <ProjectMoodboardImageGrid :images="Array.from(moodboardStore.moodboard?.images || [])"
                            :can-delete="false" :is-editing="false" :max-preview="6"
                            @delete-image="handleDeleteImage" />
                    </div>

                    <!-- Contextual Actions -->
                    <div
                        class="flex items-center gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700 justify-end">
                        <!-- Edit Action - Available for draft and revision_requested -->
                        <UTooltip v-if="moodboardStore.canEdit && !isProjectCompleted" text="Modifier le moodboard">
                            <UButton icon="i-lucide-edit" size="sm" variant="outline" color="neutral" label="Modifier"
                                @click="moodboardStore.openForm()" />
                        </UTooltip>
                        <UTooltip v-else-if="moodboardStore.canEdit && isProjectCompleted"
                            text="Le projet est terminé. Rafraîchissez la page pour voir les dernières modifications.">
                            <UButton icon="i-lucide-edit" size="sm" variant="outline" color="neutral" label="Modifier"
                                disabled />
                        </UTooltip>

                        <!-- Send to Client Action - Only for draft -->
                        <UTooltip v-if="moodboardStore.moodboard?.status === 'draft' && !isProjectCompleted"
                            text="Envoyer le moodboard au client">
                            <UButton icon="i-lucide-send" size="sm" variant="solid" color="primary"
                                label="Envoyer au client" :loading="moodboardStore.loading" @click="sendToClient()" />
                        </UTooltip>
                        <UTooltip v-else-if="moodboardStore.moodboard?.status === 'draft' && isProjectCompleted"
                            text="Le projet est terminé. Rafraîchissez la page pour voir les dernières modifications.">
                            <UButton icon="i-lucide-send" size="sm" variant="solid" color="primary"
                                label="Envoyer au client" disabled />
                        </UTooltip>

                        <!-- Preview Action - Available for all non-draft statuses -->
                        <UTooltip v-if="moodboardStore.moodboard?.status !== 'draft'" text="Voir l'aperçu client">
                            <UButton icon="i-lucide-external-link" size="sm" variant="outline" color="neutral"
                                label="Aperçu client" :to="`/moodboard/${moodboardStore.moodboard?.id}`"
                                target="_blank" />
                        </UTooltip>
                        <UTooltip v-else-if="moodboardStore.moodboard?.status !== 'draft' && isProjectCompleted"
                            text="Le projet est terminé. Rafraîchissez la page pour voir les dernières modifications.">
                            <UButton icon="i-lucide-external-link" size="sm" variant="outline" color="neutral"
                                label="Aperçu client" disabled />
                        </UTooltip>

                        <!-- Delete Action - Only for draft and awaiting_client -->
                        <UTooltip
                            v-if="(moodboardStore.moodboard?.status === 'draft' || moodboardStore.moodboard?.status === 'awaiting_client') && !isProjectCompleted"
                            text="Supprimer le moodboard">
                            <UButton icon="i-lucide-trash-2" size="sm" variant="outline" color="error" label="Supprimer"
                                :loading="moodboardStore.loading" @click="handleDelete" />
                        </UTooltip>
                        <UTooltip
                            v-else-if="(moodboardStore.moodboard?.status === 'draft' || moodboardStore.moodboard?.status === 'awaiting_client') && isProjectCompleted"
                            text="Le projet est terminé. Rafraîchissez la page pour voir les dernières modifications.">
                            <UButton icon="i-lucide-trash-2" size="sm" variant="outline" color="error" label="Supprimer"
                                disabled />
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
    <UModal v-model:open="moodboardStore.showForm" :fullscreen="true" :transition="true"
        :prevent-close="moodboardStore.uploadProgress.isUploading">
        <template #content>
            <div class="flex h-full bg-neutral-50 dark:bg-neutral-900">
                <!-- Form Content -->
                <div class="flex-1 flex flex-col">
                    <!-- Modal Header -->
                    <div class="p-6 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <UIcon name="i-lucide-image" class="w-6 h-6 text-pink-600" />
                                <div>
                                    <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                        {{ moodboardStore.exists ? 'Modifier le moodboard' : 'Créer un moodboard' }}
                                    </h2>
                                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                                        Configurez les détails de votre moodboard
                                    </p>
                                </div>
                            </div>
                            <UButton v-if="!moodboardStore.uploadProgress.isUploading" icon="i-lucide-x" size="sm"
                                variant="ghost" color="neutral" @click="moodboardStore.closeForm()" />
                        </div>
                    </div>

                    <!-- Form Content -->
                    <div class="flex-1 p-6 overflow-y-auto">
                        <div class="max-w-4xl mx-auto">
                            <ProjectMoodboardForm :moodboard="moodboardStore.moodboard || undefined"
                                :project-id="projectSetupStore.project?.id || ''"
                                :existing-images="moodboardStore.moodboard?.images ? Array.from(moodboardStore.moodboard.images) : undefined"
                                @moodboard-saved="handleMoodboardSaved" @cancel="moodboardStore.closeForm()"
                                @upload-completed="handleUploadCompleted" />
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script lang="ts" setup>
import type { MoodboardFormData } from "~/types/moodboard";
import { getStatusColor, getStatusLabel } from "~/utils/formatters";

// Use stores
const projectSetupStore = useProjectSetupStore()
const moodboardStore = useMoodboardStore()

// Use store-level reactive flag
const isProjectCompleted = computed(() => projectSetupStore.isProjectCompleted)

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

        // Refresh project to sync module states
        await projectSetupStore.refreshProject()

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
        await projectSetupStore.refreshProject()

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
}

const handleUploadCompleted = async () => {
    // Reset upload state and close form
    moodboardStore.resetUploadState()
    moodboardStore.closeForm()

    // Reload moodboard data to get the updated images
    if (projectSetupStore.project?.id) {
        await moodboardStore.loadMoodboard(projectSetupStore.project.id)
    }
}
</script>