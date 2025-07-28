<template>
    <!-- Loading State -->
    <div v-if="moodboardManager.loading.value" class="py-8 text-center">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
        <p class="text-sm text-neutral-600 dark:text-neutral-400">Chargement...</p>
    </div>

    <!-- Error State -->
    <UAlert v-else-if="moodboardManager.error.value" color="error" variant="soft" icon="i-lucide-alert-circle"
        :title="moodboardManager.error.value" />

    <!-- Content -->
    <div v-else>
        <!-- Existing Moodboard -->
        <div v-if="moodboardManager.exists.value && !showForm" class="space-y-4">
            <div
                class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">

                <!-- Moodboard Info -->
                <div class="space-y-4 mb-6">
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-image" class="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">
                            {{ moodboardManager.moodboard.value?.title }}
                        </h4>
                    </div>

                    <p v-if="moodboardManager.moodboard.value?.description"
                        class="text-sm text-neutral-600 dark:text-neutral-400">
                        {{ moodboardManager.moodboard.value.description }}
                    </p>

                    <div class="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                        <span class="flex items-center gap-1">
                            <UIcon name="i-lucide-images" class="w-4 h-4" />
                            {{ moodboardManager.imageCount.value }} image{{ moodboardManager.imageCount.value > 1 ?
                                's' : ''
                            }}
                        </span>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-2 mb-4">
                    <UButton icon="i-lucide-edit" size="sm" variant="outline" color="neutral"
                        label="Modifier le moodboard" :disabled="!moodboardManager.canEdit.value || !canEditModule"
                        @click="showForm = true" />

                    <UButton v-if="moodboardManager.moodboard.value?.status !== 'draft'" icon="i-lucide-external-link"
                        size="sm" variant="outline" color="neutral" label="Aperçu client"
                        :to="`/moodboard/${moodboardManager.moodboard.value?.id}`" target="_blank" />

                    <UButton v-if="moodboardManager.moodboard.value?.status === 'draft'" icon="i-lucide-trash-2"
                        size="sm" variant="outline" color="error" label="Supprimer"
                        :loading="moodboardManager.loading.value" :disabled="!canDeleteModule" @click="handleDelete" />
                </div>

                <!-- Image Preview Grid -->
                <div v-if="moodboardManager.hasImages.value" class="space-y-3 mt-4">
                    <h5 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Aperçu des images</h5>
                    <ProjectMoodboardImageGrid :images="Array.from(moodboardManager.moodboard.value?.images || [])"
                        :max-preview="6" :can-delete="moodboardManager.canEdit.value" @image-click="handleImageClick"
                        @delete-image="handleDeleteImage" />
                </div>

                <!-- Status-specific alerts -->
                <UAlert v-if="moodboardManager.moodboard.value?.status === 'revision_requested'" color="warning"
                    variant="soft" icon="i-lucide-message-circle" title="Révisions demandées par le client"
                    class="mt-4">
                    <template #description>
                        Le client a demandé des modifications à ce moodboard.
                    </template>
                </UAlert>

                <UAlert v-else-if="moodboardManager.moodboard.value?.status === 'draft'" color="info" variant="soft"
                    icon="i-lucide-info" title="Moodboard en brouillon" class="mt-4">
                    <template #description>
                        Ce moodboard est encore en brouillon. Vous pouvez le modifier ou le supprimer.
                    </template>
                </UAlert>

                <UAlert v-else-if="moodboardManager.moodboard.value?.status === 'awaiting_client'" color="info"
                    variant="soft" icon="i-lucide-clock" title="Moodboard envoyé" class="mt-4">
                    <template #description>
                        Ce moodboard a été envoyé au client et attend sa validation.
                    </template>
                </UAlert>

                <UAlert v-else-if="moodboardManager.moodboard.value?.status === 'completed'" color="success"
                    variant="soft" icon="i-lucide-check-circle" title="Moodboard validé" class="mt-4">
                    <template #description>
                        Ce moodboard a été validé par le client.
                    </template>
                </UAlert>
            </div>
        </div>

        <!-- Form -->
        <div v-else-if="showForm">
            <ProjectMoodboardForm :moodboard="moodboardManager.moodboard.value || undefined" :project-id="projectId"
                :existing-images="moodboardManager.moodboard.value?.images ? Array.from(moodboardManager.moodboard.value.images) : undefined"
                @moodboard-saved="handleMoodboardSaved" @cancel="showForm = false" />
        </div>

        <!-- Empty State with Choice Buttons -->
        <div v-else class="py-8 text-center">
            <div
                class="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UIcon name="i-lucide-image" class="w-8 h-8 text-pink-600 dark:text-pink-400" />
            </div>
            <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Qu'est-ce qu'un moodboard ?</h4>
            <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                Planche d'inspiration visuelle pour le client avec collaboration en temps réel
            </p>

            <!-- Feature explanation -->
            <div
                class="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700 mb-6">
                <ul class="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                    <li class="flex items-start gap-2">
                        <UIcon name="i-lucide-check" class="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                        <span>Planche d'inspiration visuelle pour le client</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <UIcon name="i-lucide-check" class="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                        <span>Validation des directions créatives</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <UIcon name="i-lucide-check" class="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                        <span>Commentaires et réactions du client</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <UIcon name="i-lucide-check" class="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                        <span>Collaboration en temps réel</span>
                    </li>
                </ul>
            </div>

            <!-- Choice buttons -->
            <div class="flex flex-col sm:flex-row gap-4">
                <UButton icon="i-lucide-plus" color="primary" size="lg" class="flex-1 justify-center"
                    :loading="moduleConfig.moodboard.loading" :disabled="!canEditModule('moodboard')"
                    @click="enableModule('moodboard', { showForm: true })">
                    Oui, créer un moodboard
                </UButton>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useMoodboardManager } from '~/composables/moodboards/useMoodboardManager';
import { useModuleState } from '~/composables/shared/useModuleState';
import type { Moodboard, MoodboardImage } from '~/types/moodboard';

interface Props {
    projectId: string
}

interface Emits {
    (e: 'moodboard-configured'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Utiliser le state centralisé pour le showForm
const { moduleConfig, configureModule, enableModule, canEditModule, canDeleteModule } = useModuleState(props.projectId)
const showForm = computed({
    get: () => moduleConfig.value.moodboard.showForm,
    set: (value: boolean) => {
        if (value) {
            enableModule('moodboard', { showForm: true })
        } else {
            configureModule('moodboard')
        }
    }
})

// Utiliser le composable unifié
const moodboardManager = useMoodboardManager(props.projectId)

// Charger le moodboard au montage
onMounted(async () => {
    await moodboardManager.load()
})

// Méthodes
const handleMoodboardSaved = async (data: {
    moodboard: Moodboard;
    projectUpdated: boolean;
    selectedFiles?: File[]
}) => {
    try {
        // Utiliser la méthode save qui gère création/mise à jour + upload des images
        await moodboardManager.save(
            {
                title: data.moodboard.title,
                description: data.moodboard.description,
                project_id: data.moodboard.project_id,
                status: data.moodboard.status
            },
            data.selectedFiles
        )

        // Fermer le formulaire et notifier
        configureModule('moodboard')
        emit('moodboard-configured')

        const toast = useToast()
        toast.add({
            title: 'Moodboard sauvegardé',
            description: 'Le moodboard a été créé/mis à jour avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })
    } catch (err) {
        console.error('Error saving moodboard:', err)
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
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer ce moodboard ? Cette action est irréversible.')
    if (!confirmed) return

    try {
        await moodboardManager.remove()

        // Resynchroniser le state après suppression
        const { resyncAfterModuleDeletion } = useModuleState(props.projectId)
        await resyncAfterModuleDeletion('moodboard')

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

const handleImageClick = (image: MoodboardImage) => {
    // Gérer le clic sur image (lightbox, etc.)
    console.log('Image clicked:', image)
}

const handleDeleteImage = async (imageId: string) => {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.')
    if (!confirmed) return

    try {
        await moodboardManager.deleteImage(imageId)
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
</script>