<template>
    <UCard variant="outline">
        <template #header>
            <div class="flex items-center gap-3">
                <UIcon name="i-lucide-image" class="w-5 h-5 text-pink-500" />
                <div>
                    <h3 class="font-semibold">Moodboard</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">Planche d'inspiration pour le client</p>
                </div>
                <!-- Status badge -->
                <div v-if="moodboardManager.exists.value" class="ml-auto">
                    <UBadge :color="moodboardManager.statusInfo.value?.color as any" variant="subtle"
                        :label="moodboardManager.statusInfo.value?.label"
                        :icon="moodboardManager.statusInfo.value?.icon" />
                </div>
            </div>
        </template>

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
                            label="Modifier le moodboard" :disabled="!moodboardManager.canEdit.value"
                            @click="showForm = true" />

                        <UButton v-if="moodboardManager.moodboard.value?.status !== 'draft'"
                            icon="i-lucide-external-link" size="sm" variant="outline" color="neutral"
                            label="Aperçu client" :to="`/moodboard/${moodboardManager.moodboard.value?.id}`"
                            target="_blank" />

                        <UButton v-if="moodboardManager.moodboard.value?.status === 'draft'" icon="i-lucide-trash-2"
                            size="sm" variant="outline" color="error" label="Supprimer"
                            :loading="moodboardManager.loading.value" @click="handleDelete" />
                    </div>

                    <!-- Image Preview Grid -->
                    <div v-if="moodboardManager.hasImages.value" class="space-y-3 mt-4">
                        <h5 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Aperçu des images</h5>
                        <ProjectMoodboardImageGrid :images="Array.from(moodboardManager.moodboard.value?.images || [])"
                            :max-preview="6" :can-delete="moodboardManager.canEdit.value"
                            @image-click="handleImageClick" @delete-image="handleDeleteImage" />
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

            <!-- Empty State -->
            <div v-else class="py-8 text-center">
                <div
                    class="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UIcon name="i-lucide-image-plus" class="w-8 h-8 text-pink-600 dark:text-pink-400" />
                </div>
                <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Aucun moodboard</h4>
                <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                    Créez une planche d'inspiration pour ce projet
                </p>
                <UButton icon="i-lucide-plus" color="primary" label="Créer un moodboard" @click="showForm = true" />
            </div>
        </div>
    </UCard>
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
const { moduleConfig, configureModule, enableModule } = useModuleState(props.projectId)
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
        // Recharger les données du moodboardManager pour synchroniser
        await moodboardManager.load()

        // Upload des images si nécessaire
        if (data.selectedFiles && data.selectedFiles.length > 0) {
            await moodboardManager.uploadImages(data.selectedFiles)
        }

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