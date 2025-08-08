<template>
    <div
        class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <!-- Image with hover interactions -->
        <div class="aspect-square bg-neutral-100 dark:bg-neutral-900 relative group" @click="openImagePreview">
            <GalleryImageClient :image="image" :gallery-id="galleryId"
                class="w-full h-full transition-transform duration-300 cursor-pointer" @click.stop="openImagePreview" />

            <!-- Gradient overlay for interactions -->
            <div
                class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <!-- Action buttons overlay -->
            <div class="absolute top-2 right-2 flex gap-2">
                <!-- View button -->
                <UButton icon="i-lucide-eye" color="neutral" variant="solid" size="xs"
                    class="backdrop-blur-sm bg-white/90 hover:bg-white text-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    @click.stop="openImagePreview" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { GalleryImage } from '~/types/gallery'

interface Props {
    image: GalleryImage
    galleryId: string
    imageIndex: number
}

interface Emits {
    'open-preview': [image: GalleryImage]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Image preview methods
const openImagePreview = () => {
    emit('open-preview', props.image)
}
</script>

<style scoped>
/* Additional styles if needed */
</style>
