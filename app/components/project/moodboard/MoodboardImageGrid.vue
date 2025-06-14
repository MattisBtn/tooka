<template>
    <div class="space-y-3">
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div v-for="(image, index) in displayImages" :key="image.id"
                class="relative group aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden cursor-pointer"
                @click="$emit('image-click', image)">

                <!-- Image -->
                <NuxtImg :src="getImageUrl(image.file_url)" :alt="`Image d'inspiration ${index + 1}`"
                    class="w-full h-full object-cover" loading="lazy" />

                <!-- Hover overlay with actions -->
                <div
                    class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div class="flex items-center gap-2">
                        <UButton icon="i-lucide-eye" size="xs" color="primary" variant="solid" title="Voir l'image"
                            @click.stop="$emit('image-click', image)" />

                        <UButton v-if="canDelete" icon="i-lucide-trash-2" size="xs" color="error" variant="solid"
                            title="Supprimer" @click.stop="$emit('delete-image', image.id)" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Show more button if there are more images -->
        <div v-if="images.length > maxPreview" class="text-center">
            <UButton icon="i-lucide-plus" variant="outline" color="neutral"
                :label="`Voir ${images.length - maxPreview} image${images.length - maxPreview > 1 ? 's' : ''} d'inspiration de plus`"
                @click="showAll = !showAll" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { MoodboardImage } from '~/types/moodboard';

interface Props {
    images: MoodboardImage[]
    maxPreview?: number
    canDelete?: boolean
}

interface Emits {
    (e: 'image-click', image: MoodboardImage): void
    (e: 'delete-image', imageId: string): void
}

const props = withDefaults(defineProps<Props>(), {
    maxPreview: 6,
    canDelete: false
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

// Get real image URL using the moodboard repository
const getImageUrl = (filePath: string) => {
    try {
        // Use the public URL method from Supabase directly for moodboard images
        const supabase = useSupabaseClient()
        const { data } = supabase.storage
            .from('moodboard-images')
            .getPublicUrl(filePath)
        return data.publicUrl
    } catch (error) {
        console.error('Error getting moodboard image URL:', error)
        return `https://via.placeholder.com/300x300?text=Error+Loading+Image`
    }
}
</script>