<template>
    <UModal :open="isOpen" :fullscreen="true" :transition="true" @update:is-open="$emit('update:isOpen', $event)">
        <template #content>
            <div class="flex h-full bg-black/95">
                <!-- Close button -->
                <UButton icon="i-lucide-x" size="lg" color="neutral" variant="ghost" class="absolute top-4 right-4 z-50"
                    @click="closePreview" />

                <!-- Navigation arrows -->
                <UButton v-if="images.length > 1" icon="i-lucide-chevron-left" size="lg" color="neutral" variant="ghost"
                    class="absolute left-4 top-1/2 -translate-y-1/2 z-50" @click="previousImage" />

                <UButton v-if="images.length > 1" icon="i-lucide-chevron-right" size="lg" color="neutral"
                    variant="ghost" class="absolute right-4 top-1/2 -translate-y-1/2 z-50" @click="nextImage" />

                <!-- Image container -->
                <div class="flex-1 flex items-center justify-center p-8">
                    <div v-if="currentImage" class="relative max-w-full max-h-full">
                        <!-- Main image -->
                        <NuxtImg :src="getImageUrl(currentImage.file_url)" :alt="`Image preview ${currentIndex + 1}`"
                            class="max-w-full max-h-full object-contain" loading="eager" @error="handleImageError" />

                        <!-- Image counter -->
                        <div v-if="images.length > 1"
                            class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                            {{ currentIndex + 1 }} / {{ images.length }}
                        </div>
                    </div>
                </div>

                <!-- Thumbnail navigation -->
                <div v-if="images.length > 1" class="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                    <button v-for="(image, index) in images" :key="image.id"
                        class="w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-110"
                        :class="index === currentIndex ? 'border-white' : 'border-white/30'" @click="goToImage(index)">
                        <NuxtImg :src="getImageUrl(image.file_url)" :alt="`Thumbnail ${index + 1}`"
                            class="w-full h-full object-cover" loading="lazy" />
                    </button>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script lang="ts" setup>
import type { PreviewImage } from '~/composables/shared/useImagePreview'

interface Props {
    isOpen: boolean
    currentImage: PreviewImage | null
    images: PreviewImage[]
    currentIndex: number
    storageBucket?: string // Pour permettre de spécifier le bucket de stockage
}

interface Emits {
    (e: 'close' | 'next' | 'previous'): void
    (e: 'go-to', index: number): void
    (e: 'update:isOpen', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
    storageBucket: 'moodboard-images' // Par défaut, mais peut être surchargé
})

const emit = defineEmits<Emits>()

const closePreview = () => emit('close')
const nextImage = () => emit('next')
const previousImage = () => emit('previous')
const goToImage = (index: number) => emit('go-to', index)

const handleImageError = () => {
    console.error('Failed to load image in preview modal')
}

// Get real image URL using Supabase
const getImageUrl = (filePath: string) => {
    try {
        const supabase = useSupabaseClient()
        const { data } = supabase.storage
            .from(props.storageBucket)
            .getPublicUrl(filePath)
        return data.publicUrl
    } catch (error) {
        console.error('Error getting image URL:', error)
        return `https://via.placeholder.com/800x600?text=Error+Loading+Image`
    }
}
</script>