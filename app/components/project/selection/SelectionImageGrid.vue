<template>
    <div class="space-y-3">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div v-for="(image, index) in displayImages" :key="image.id"
                class="relative group aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden cursor-pointer"
                :class="[
                    image.is_selected ? 'ring-2 ring-orange-500 ring-offset-2' : '',
                ]" @click="$emit('image-click', image)">

                <!-- Image -->
                <NuxtImg :src="getImageUrl(image.file_url)" :alt="`Image de sélection ${index + 1}`"
                    class="w-full h-full object-cover" loading="lazy" />

                <!-- Selection indicator -->
                <div v-if="image.is_selected" class="absolute top-2 left-2">
                    <div class="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <UIcon name="i-lucide-check" class="w-4 h-4 text-white" />
                    </div>
                </div>

                <!-- Hover overlay with actions -->
                <div
                    class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div class="flex items-center gap-2">
                        <UButton icon="i-lucide-eye" size="xs" color="primary" variant="solid" title="Voir l'image"
                            @click.stop="$emit('image-click', image)" />

                        <UButton v-if="canToggleSelection"
                            :icon="image.is_selected ? 'i-lucide-circle-x' : 'i-lucide-circle-check'" size="xs"
                            :color="image.is_selected ? 'warning' : 'success'" variant="solid"
                            :title="image.is_selected ? 'Désélectionner' : 'Sélectionner'"
                            @click.stop="$emit('toggle-selection', image.id, !image.is_selected)" />

                        <UButton v-if="canDelete" icon="i-lucide-trash-2" size="xs" color="error" variant="solid"
                            title="Supprimer" @click.stop="$emit('delete-image', image.id)" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Show more button if there are more images -->
        <div v-if="images.length > maxPreview" class="text-center">
            <UButton icon="i-lucide-plus" variant="outline" color="neutral"
                :label="`Voir ${images.length - maxPreview} image${images.length - maxPreview > 1 ? 's' : ''} de sélection de plus`"
                @click="showAll = !showAll" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { SelectionImage } from '~/types/selection';

interface Props {
    images: SelectionImage[]
    maxPreview?: number
    canDelete?: boolean
    canToggleSelection?: boolean
}

interface Emits {
    (e: 'image-click', image: SelectionImage): void
    (e: 'delete-image', imageId: string): void
    (e: 'toggle-selection', imageId: string, selected: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
    maxPreview: 6,
    canDelete: false,
    canToggleSelection: false,
})

defineEmits<Emits>()

// Local state
const showAll = ref(false)

const displayImages = computed(() => {
    if (showAll.value || props.images.length <= props.maxPreview) {
        return props.images
    }
    return props.images.slice(0, props.maxPreview)
})

// Get real image URL using the selection repository
const getImageUrl = (filePath: string) => {
    try {
        // Use the public URL method from Supabase directly for selection images
        const supabase = useSupabaseClient()
        const { data } = supabase.storage
            .from('selection-images')
            .getPublicUrl(filePath)
        return data.publicUrl
    } catch (error) {
        console.error('Error getting selection image URL:', error)
        return `https://via.placeholder.com/300x300?text=Error+Loading+Image`
    }
}
</script>