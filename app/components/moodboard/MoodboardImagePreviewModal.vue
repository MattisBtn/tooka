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
                    <div v-if="currentImage" class="relative w-full h-full flex items-center justify-center">
                        <!-- Main image -->
                        <NuxtImg v-if="currentImageUrl" :src="currentImageUrl"
                            :alt="`Image preview ${currentIndex + 1}`"
                            class="max-w-[90vw] max-h-[80vh] w-auto h-auto object-contain" loading="eager"
                            @error="handleImageError" />
                        <div v-else
                            class="w-full h-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                            <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-neutral-400 animate-spin" />
                        </div>

                        <!-- Image counter -->
                        <div v-if="images.length > 1"
                            class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                            {{ currentIndex + 1 }} / {{ images.length }}
                        </div>
                    </div>
                </div>

                <!-- Thumbnail navigation -->
                <div v-if="images.length > 1"
                    class="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto">
                    <button v-for="(image, index) in images" :key="image.id"
                        class="w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-110 flex-shrink-0"
                        :class="index === currentIndex ? 'border-white' : 'border-white/30'" @click="goToImage(index)"
                        @mouseenter="loadThumbnailUrl(image)">
                        <NuxtImg v-if="thumbnailUrls[image.id]" :src="thumbnailUrls[image.id]"
                            :alt="`Thumbnail ${index + 1}`" class="w-full h-full object-cover" loading="lazy" />
                        <div v-else
                            class="w-full h-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                            <UIcon name="i-lucide-loader-2" class="w-4 h-4 text-neutral-400 animate-spin" />
                        </div>
                    </button>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script lang="ts" setup>
import type { MoodboardImageWithInteractions } from '~/types/moodboard'

interface Props {
    isOpen: boolean
    currentImage: MoodboardImageWithInteractions | null
    images: MoodboardImageWithInteractions[]
    currentIndex: number
    moodboardId: string
}

interface Emits {
    (e: 'close' | 'next' | 'previous'): void
    (e: 'go-to', index: number): void
    (e: 'update:isOpen', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive state for image URLs
const currentImageUrl = ref<string | null>(null)
const thumbnailUrls = ref<Record<string, string>>({})

const closePreview = () => emit('close')
const nextImage = () => emit('next')
const previousImage = () => emit('previous')
const goToImage = (index: number) => emit('go-to', index)

const handleImageError = () => {
    console.error('Failed to load image in preview modal')
}

// Get signed URL for main image via server
const getSignedUrl = async (filePath: string): Promise<string> => {
    try {
        const response = await $fetch<{ url: string }>(`/api/moodboard/client/${props.moodboardId}/image-url`, {
            method: 'POST',
            body: { filePath }
        })
        return response.url
    } catch (error) {
        console.error('Error getting signed URL:', error)
        return `https://via.placeholder.com/800x600?text=Error+Loading+Image`
    }
}

// Load thumbnail URL for an image
const loadThumbnailUrl = async (image: MoodboardImageWithInteractions) => {
    if (!thumbnailUrls.value[image.id]) {
        try {
            const url = await getSignedUrl(image.file_url)
            thumbnailUrls.value[image.id] = url
        } catch (error) {
            console.error('Error loading thumbnail URL:', error)
            thumbnailUrls.value[image.id] = `https://via.placeholder.com/64x64?text=Error`
        }
    }
}

// Load current image URL when image changes
watch(() => props.currentImage, async (newImage) => {
    if (newImage) {
        try {
            currentImageUrl.value = await getSignedUrl(newImage.file_url)
        } catch (error) {
            console.error('Error loading current image URL:', error)
            currentImageUrl.value = `https://via.placeholder.com/800x600?text=Error+Loading+Image`
        }
    }
}, { immediate: true })

// Preload thumbnail URLs
onMounted(async () => {
    if (props.images.length > 1) {
        const imagesToPreload = props.images.slice(0, 8)
        await Promise.all(imagesToPreload.map(image => loadThumbnailUrl(image)))
    }
})

// Keep thumbnails in sync when image list changes
watch(() => props.images, async (newImages) => {
    if (!newImages || newImages.length === 0) {
        thumbnailUrls.value = {}
        return
    }
    const imagesToPreload = newImages.slice(0, 8)
    await Promise.all(imagesToPreload.map(image => loadThumbnailUrl(image)))
}, { deep: false })

// Prefetch neighbors around current index for smoother navigation
const prefetchAround = async (centerIndex: number) => {
    const range = 2
    const start = Math.max(0, centerIndex - range)
    const end = Math.min(props.images.length - 1, centerIndex + range)
    const targets = props.images.slice(start, end + 1)
    await Promise.all(targets.map((img: MoodboardImageWithInteractions) => loadThumbnailUrl(img)))
}

watch(() => props.currentIndex, async (idx) => {
    if (typeof idx === 'number' && props.images.length > 0) {
        await prefetchAround(idx)
    }
}, { immediate: true })
</script>