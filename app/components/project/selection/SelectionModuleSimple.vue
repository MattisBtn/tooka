<template>


    <!-- Loading State -->
    <div v-if="selectionManager.loading.value" class="py-8 text-center">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
        <p class="text-sm text-neutral-600 dark:text-neutral-400">Chargement...</p>
    </div>

    <!-- Error State -->
    <UAlert v-else-if="selectionManager.error.value" color="error" variant="soft" icon="i-lucide-alert-circle"
        :title="selectionManager.error.value" />

    <!-- Content -->
    <div v-else>
        <!-- Existing Selection -->
        <div v-if="selectionManager.exists.value && !showForm" class="space-y-4">
            <div
                class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">

                <!-- Selection Info -->
                <div class="space-y-4 mb-6">
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-mouse-pointer-click"
                            class="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        <h4 class="text-base font-medium text-neutral-900 dark:text-neutral-100">
                            Sélection de {{ selectionManager.selection.value?.max_media_selection }} média{{
                                selectionManager.selection.value?.max_media_selection &&
                                    selectionManager.selection.value.max_media_selection > 1 ? 's' : ''
                            }}
                        </h4>
                    </div>

                    <div class="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                        <span class="flex items-center gap-1">
                            <UIcon name="i-lucide-images" class="w-4 h-4" />
                            {{ selectionManager.imageCount.value }} image{{ selectionManager.imageCount.value > 1 ?
                                's' : ''
                            }} disponible{{ selectionManager.imageCount.value > 1 ? 's' : '' }}
                        </span>
                        <span v-if="selectionManager.selectedCount.value > 0"
                            class="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            <UIcon name="i-lucide-check-circle" class="w-4 h-4" />
                            {{ selectionManager.selectedCount.value }} sélectionnée{{
                                selectionManager.selectedCount.value >
                                    1 ? 's' : '' }} par le client
                        </span>
                    </div>

                    <div v-if="selectionManager.formattedExtraMediaPrice.value"
                        class="text-sm text-neutral-600 dark:text-neutral-400">
                        Prix média supplémentaire: {{ selectionManager.formattedExtraMediaPrice.value }}
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-2 mb-4">
                    <UButton icon="i-lucide-edit" size="sm" variant="outline" color="neutral"
                        label="Modifier la sélection" :disabled="!selectionManager.canEdit.value || !canEditModule"
                        @click="showForm = true" />

                    <UButton v-if="selectionManager.selection.value?.status !== 'draft'" icon="i-lucide-external-link"
                        size="sm" variant="outline" color="neutral" label="Aperçu client"
                        :to="`/selection/${selectionManager.selection.value?.id}`" target="_blank" />

                    <UButton v-if="selectionManager.selection.value?.status === 'draft'" icon="i-lucide-trash-2"
                        size="sm" variant="outline" color="error" label="Supprimer"
                        :loading="selectionManager.loading.value" :disabled="!canDeleteModule" @click="handleDelete" />
                </div>

                <!-- Image Preview Grid -->
                <div v-if="selectionManager.hasImages.value" class="space-y-3 mt-4">
                    <h5 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Aperçu des images</h5>
                    <SelectionImageGrid :images="Array.from(selectionManager.images.value)" :max-preview="6"
                        :can-delete="selectionManager.canEdit.value" :can-toggle-selection="false"
                        :show-selection-state="true" @image-click="handleImageClick"
                        @delete-image="handleDeleteImage" />
                </div>

                <!-- Status-specific alerts -->
                <UAlert v-if="selectionManager.selection.value?.status === 'revision_requested'" color="warning"
                    variant="soft" icon="i-lucide-edit" title="Révisions demandées par le client" class="mt-4">
                    <template #description>
                        Le client a demandé des modifications à cette sélection.
                    </template>
                </UAlert>

                <UAlert v-else-if="selectionManager.selection.value?.status === 'draft'" color="info" variant="soft"
                    icon="i-lucide-info" title="Sélection en brouillon" class="mt-4">
                    <template #description>
                        Cette sélection est encore en brouillon. Vous pouvez la modifier ou la supprimer.
                    </template>
                </UAlert>

                <UAlert v-else-if="selectionManager.selection.value?.status === 'awaiting_client'" color="info"
                    variant="soft" icon="i-lucide-clock" title="Sélection envoyée" class="mt-4">
                    <template #description>
                        Cette sélection a été envoyée au client et attend sa validation.
                    </template>
                </UAlert>

                <UAlert v-else-if="selectionManager.selection.value?.status === 'completed'" color="success"
                    variant="soft" icon="i-lucide-check-circle" title="Sélection validée" class="mt-4">
                    <template #description>
                        Cette sélection a été validée par le client.
                    </template>
                </UAlert>
            </div>
        </div>

        <!-- Form -->
        <div v-else-if="showForm">
            <ProjectSelectionForm :selection="selectionManager.selection.value || undefined" :project-id="projectId"
                :existing-images="selectionManager.images.value.length > 0 ? Array.from(selectionManager.images.value) : undefined"
                @selection-saved="handleSelectionSaved" @cancel="showForm = false" />
        </div>

        <!-- Empty State with Choice Buttons -->
        <div v-else class="py-8 text-center">
            <div
                class="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <UIcon name="i-lucide-mouse-pointer-click" class="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h4 class="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Qu'est-ce qu'une sélection ?</h4>
            <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                Sélection d'images par le client avec validation des choix finaux
            </p>

            <!-- Feature explanation -->
            <div
                class="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700 mb-6">
                <ul class="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                    <li class="flex items-start gap-2">
                        <UIcon name="i-lucide-check" class="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span>Sélection d'images par le client</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <UIcon name="i-lucide-check" class="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span>Validation des choix finaux</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <UIcon name="i-lucide-check" class="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span>Gestion des médias supplémentaires</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <UIcon name="i-lucide-check" class="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span>Interface intuitive de sélection</span>
                    </li>
                </ul>
            </div>

            <!-- Choice buttons -->
            <div class="flex flex-col sm:flex-row gap-4">
                <UButton icon="i-lucide-plus" color="primary" size="lg" class="flex-1 justify-center"
                    :loading="moduleConfig.selection.loading" :disabled="!canEditModule('selection')"
                    @click="enableModule('selection', { showForm: true })">
                    Oui, créer une sélection
                </UButton>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useSelectionManager } from '~/composables/selections/useSelectionManager';
import { useModuleState } from '~/composables/shared/useModuleState';
import type { SelectionFormData, SelectionImage } from '~/types/selection';

interface Props {
    projectId: string
}

interface Emits {
    (e: 'selection-configured'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Utiliser le state centralisé pour le showForm
const { moduleConfig, configureModule, enableModule, canEditModule, canDeleteModule } = useModuleState(props.projectId)
const showForm = computed({
    get: () => moduleConfig.value.selection.showForm,
    set: (value: boolean) => {
        if (value) {
            enableModule('selection', { showForm: true })
        } else {
            configureModule('selection')
        }
    }
})

// Utiliser le composable unifié
const selectionManager = useSelectionManager(props.projectId)

// Charger la sélection au montage
onMounted(async () => {
    await selectionManager.load()
})

// Méthodes
const handleSelectionSaved = async (data: {
    selection: SelectionFormData;
    projectUpdated: boolean;
    selectedFiles?: File[]
}) => {
    try {
        // Utiliser la méthode save qui gère création/mise à jour + upload des images
        await selectionManager.save(
            {
                max_media_selection: data.selection.max_media_selection,
                extra_media_price: data.selection.extra_media_price,
                status: data.selection.status
            },
            data.selectedFiles
        )

        // Fermer le formulaire et notifier
        configureModule('selection')
        emit('selection-configured')

        const toast = useToast()
        toast.add({
            title: 'Sélection sauvegardée',
            description: 'La sélection a été créée/mise à jour avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })
    } catch (err) {
        console.error('Error saving selection:', err)
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
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette sélection ? Cette action est irréversible.')
    if (!confirmed) return

    try {
        await selectionManager.remove()

        // Resynchroniser le state après suppression
        const { resyncAfterModuleDeletion } = useModuleState(props.projectId)
        await resyncAfterModuleDeletion('selection')

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

const handleImageClick = (_image: SelectionImage) => {
    // Gérer le clic sur image (lightbox, etc.)
}

const handleDeleteImage = async (imageId: string) => {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.')
    if (!confirmed) return

    try {
        await selectionManager.deleteImage(imageId)
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