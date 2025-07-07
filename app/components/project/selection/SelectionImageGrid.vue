<template>
    <div v-if="images.length > 0" class="space-y-4">
        <!-- Conversion Status Summary -->
        <div v-if="conversionSummary.total > 0" class="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    État des conversions
                </h4>
                <div class="text-xs text-neutral-600 dark:text-neutral-400">
                    {{ conversionSummary.completed }}/{{ conversionSummary.total }} terminées
                </div>
            </div>

            <!-- Progress bar -->
            <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mb-2">
                <div class="bg-green-500 h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${(conversionSummary.completed / conversionSummary.total) * 100}%` }" />
            </div>

            <!-- Status breakdown -->
            <div class="flex items-center gap-4 text-xs">
                <div v-if="conversionSummary.processing > 0" class="flex items-center gap-1 text-orange-600">
                    <UIcon name="i-lucide-loader-2" class="w-3 h-3 animate-spin" />
                    {{ conversionSummary.processing }} en cours
                </div>
                <div v-if="conversionSummary.pending > 0" class="flex items-center gap-1 text-neutral-600">
                    <UIcon name="i-lucide-clock" class="w-3 h-3" />
                    {{ conversionSummary.pending }} en attente
                </div>
                <div v-if="conversionSummary.failed > 0" class="flex items-center gap-1 text-red-600">
                    <UIcon name="i-lucide-alert-circle" class="w-3 h-3" />
                    {{ conversionSummary.failed }} échouées
                </div>
            </div>
        </div>

        <!-- Images Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div v-for="image in images" :key="image.id"
                class="relative group aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden border-2 transition-all duration-200"
                :class="getImageClasses(image)">
                <!-- Image Display -->
                <img v-if="image.conversion_status === 'completed' || !image.requires_conversion"
                    :src="getImageUrl(image)" :alt="image.source_filename || 'Selection image'"
                    class="w-full h-full object-cover" @error="handleImageError">

                <!-- Conversion Placeholder -->
                <div v-else class="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-700">
                    <div class="text-center">
                        <UIcon :name="getConversionIcon(image.conversion_status)"
                            :class="getConversionIconClass(image.conversion_status)" class="w-8 h-8 mx-auto mb-2" />
                        <p class="text-xs text-neutral-600 dark:text-neutral-400">
                            {{ getConversionStatusText(image.conversion_status) }}
                        </p>
                    </div>
                </div>

                <!-- RAW Badge -->
                <div v-if="image.requires_conversion"
                    class="absolute top-2 left-2 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded shadow-lg">
                    {{ (image.source_format || 'RAW').toUpperCase() }}
                </div>

                <!-- Selection Indicator -->
                <div v-if="(canToggleSelection || showSelectionState) && (image.conversion_status === 'completed' || !image.requires_conversion)"
                    class="absolute bottom-2 left-2">
                    <!-- Interactive button for clients -->
                    <UButton v-if="canToggleSelection"
                        :icon="image.is_selected ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                        :color="image.is_selected ? 'success' : 'neutral'"
                        :variant="image.is_selected ? 'solid' : 'outline'" size="sm"
                        @click="handleToggleSelection(image.id, !image.is_selected)" />
                    <!-- Read-only indicator for photographers -->
                    <div v-else-if="showSelectionState"
                        class="flex items-center justify-center w-8 h-8 rounded-full shadow-lg"
                        :class="image.is_selected ? 'bg-green-500' : 'bg-neutral-500 bg-opacity-70'">
                        <UIcon :name="image.is_selected ? 'i-lucide-check' : 'i-lucide-circle'"
                            :class="image.is_selected ? 'text-white' : 'text-neutral-300'" class="w-4 h-4" />
                    </div>
                </div>

                <!-- Action Menu -->
                <div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <UDropdownMenu :items="getImageActions(image)" :ui="{
                        content: 'min-w-48'
                    }">
                        <UButton icon="i-lucide-more-vertical" color="neutral" variant="solid" size="sm" />
                    </UDropdownMenu>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="text-center py-12">
        <UIcon name="i-lucide-images" class="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <p class="text-neutral-600 dark:text-neutral-400">
            Aucune image dans cette sélection
        </p>
    </div>
</template>

<script lang="ts" setup>
import { useConversionSummary } from '~/composables/selections/user/useSelection';
import type { SelectionImage } from '~/types/selection';

interface Props {
    images: SelectionImage[]
    canDelete?: boolean
    canToggleSelection?: boolean // Only for client interface - allows interactive selection
    showSelectionState?: boolean // For photographer interface - shows client selection state in read-only mode
}

interface Emits {
    (e: 'delete-image', imageId: string): void
    (e: 'toggle-selection', imageId: string, selected: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
    canDelete: false,
    canToggleSelection: false,
    showSelectionState: false,
})

const emit = defineEmits<Emits>()

// Computed properties
const conversionSummary = useConversionSummary(computed(() => props.images))

// Helper methods
const getImageUrl = (image: SelectionImage): string => {
    // For converted images, use the converted file URL
    if (image.requires_conversion && image.conversion_status === 'completed') {
        return getSignedUrl(image.file_url)
    }
    // For regular images, use file_url directly
    return getSignedUrl(image.file_url)
}

const getSignedUrl = (filePath: string): string => {
    // This should be implemented to get signed URLs from Supabase
    const supabase = useSupabaseClient()
    const { data } = supabase.storage
        .from('selection-images')
        .getPublicUrl(filePath)

    return data.publicUrl
}

const getImageClasses = (image: SelectionImage): string => {
    const classes = []

    if (image.is_selected) {
        classes.push('border-green-500 ring-2 ring-green-200')
    } else {
        classes.push('border-transparent hover:border-neutral-300')
    }

    if (image.conversion_status === 'failed') {
        classes.push('border-red-500 bg-red-50 dark:bg-red-950')
    }

    return classes.join(' ')
}

const getConversionIcon = (status: string | null): string => {
    switch (status) {
        case 'pending':
        case 'queued':
            return 'i-lucide-clock'
        case 'processing':
            return 'i-lucide-loader-2'
        case 'completed':
            return 'i-lucide-check-circle'
        case 'failed':
            return 'i-lucide-alert-circle'
        case 'retrying':
            return 'i-lucide-refresh-cw'
        case 'cancelled':
            return 'i-lucide-x-circle'
        default:
            return 'i-lucide-help-circle'
    }
}

const getConversionIconClass = (status: string | null): string => {
    switch (status) {
        case 'processing':
        case 'retrying':
            return 'animate-spin text-orange-500'
        case 'completed':
            return 'text-green-500'
        case 'failed':
            return 'text-red-500'
        case 'cancelled':
            return 'text-neutral-500'
        default:
            return 'text-neutral-400'
    }
}

const getConversionStatusText = (status: string | null): string => {
    switch (status) {
        case 'pending':
            return 'En attente'
        case 'queued':
            return 'En file'
        case 'processing':
            return 'Conversion...'
        case 'completed':
            return 'Terminé'
        case 'failed':
            return 'Échec'
        case 'retrying':
            return 'Nouvelle tentative'
        case 'cancelled':
            return 'Annulé'
        default:
            return 'Inconnu'
    }
}

const getImageActions = (image: SelectionImage) => {
    const actions = []

    // Download actions
    if (image.conversion_status === 'completed' || !image.requires_conversion) {
        actions.push({
            label: 'Télécharger JPEG',
            icon: 'i-lucide-download',
            onSelect: () => downloadImage(image.file_url, 'jpeg')
        })
    }

    if (image.requires_conversion && image.source_file_url) {
        actions.push({
            label: `Télécharger ${(image.source_format || 'RAW').toUpperCase()} original`,
            icon: 'i-lucide-camera',
            onSelect: () => downloadImage(image.source_file_url!, 'raw')
        })
    }

    // Retry conversion
    if (image.conversion_status === 'failed') {
        actions.push({
            label: 'Relancer la conversion',
            icon: 'i-lucide-refresh-cw',
            onSelect: () => retryConversion(image.id)
        })
    }

    // Delete action
    if (props.canDelete) {
        if (actions.length > 0) {
            actions.push({ type: 'separator' })
        }
        actions.push({
            label: 'Supprimer',
            icon: 'i-lucide-trash-2',
            color: 'error',
            onSelect: () => emit('delete-image', image.id)
        })
    }

    return [actions] // Wrap in array for grouped structure
}

// Event handlers
const handleToggleSelection = (imageId: string, selected: boolean) => {
    if (props.canToggleSelection) {
        emit('toggle-selection', imageId, selected)
    }
}

const handleImageError = (event: Event) => {
    console.error('Failed to load image:', event)
    // Could implement fallback image here
}

const retryConversion = async (imageId: string) => {
    try {
        const { selectionService } = await import('~/services/selectionService')
        await selectionService.retryConversion(imageId)

        const toast = useToast()
        toast.add({
            title: 'Conversion relancée',
            description: 'La conversion de l\'image a été relancée avec succès.',
            icon: 'i-lucide-refresh-cw',
            color: 'success'
        })

        // No need to refresh - real-time updates will handle UI changes
    } catch (error) {
        console.error('Retry conversion failed:', error)
        const toast = useToast()
        toast.add({
            title: 'Erreur',
            description: error instanceof Error ? error.message : 'Erreur lors de la relance de la conversion',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}

const downloadImage = async (filePath: string, type: 'jpeg' | 'raw') => {
    try {
        const { selectionService } = await import('~/services/selectionService')

        // Generate appropriate filename
        const timestamp = Date.now()
        const extension = type === 'raw' ? 'raw' : 'jpg'
        const filename = `image_${type}_${timestamp}.${extension}`

        await selectionService.downloadImage(filePath, filename, true)

        const toast = useToast()
        toast.add({
            title: 'Téléchargement lancé',
            description: `Le téléchargement de l'image ${type.toUpperCase()} a commencé.`,
            icon: 'i-lucide-download',
            color: 'success'
        })
    } catch (error) {
        console.error('Download failed:', error)
        const toast = useToast()
        toast.add({
            title: 'Erreur de téléchargement',
            description: error instanceof Error ? error.message : 'Erreur lors du téléchargement',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        })
    }
}
</script>