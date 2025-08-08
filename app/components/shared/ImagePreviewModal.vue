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
                        :class="index === currentIndex ? 'border-white' : 'border-white/30'" @click="goToImage(index)">
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
import type { PreviewImage } from '~/composables/shared/useImagePreview'

interface Props {
    isOpen: boolean
    currentImage: PreviewImage | null
    images: PreviewImage[]
    currentIndex: number
    storageBucket?: string // Pour permettre de spécifier le bucket de stockage
    // Optionnel: fonction de résolution d'URL (peut retourner une URL signée)
    getUrl?: (filePath: string) => Promise<string> | string
}

interface Emits {
    (e: 'close' | 'next' | 'previous'): void
    (e: 'go-to', index: number): void
    (e: 'update:isOpen', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
    storageBucket: 'moodboard-images', // Par défaut, mais peut être surchargé
    getUrl: undefined
})

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

// Resolve URL using provided getUrl prop or fallback to Supabase public URL
const resolveUrl = async (filePath: string): Promise<string> => {
    try {
        if (props.getUrl) {
            const maybePromise = props.getUrl(filePath)
            return typeof (maybePromise as unknown as { then?: unknown }).then === 'function'
                ? await (maybePromise as Promise<string>)
                : (maybePromise as string)
        }

        const supabase = useSupabaseClient()
        const { data } = supabase.storage
            .from(props.storageBucket)
            .getPublicUrl(filePath)
        return data.publicUrl
    } catch (error) {
        console.error('Error resolving image URL:', error)
        return `https://via.placeholder.com/800x600?text=Error+Loading+Image`
    }
}

// Fast sync public URL (used when no signed URL resolver is provided)
const getPublicUrlSync = (filePath: string): string => {
    try {
        const supabase = useSupabaseClient()
        const { data } = supabase.storage
            .from(props.storageBucket)
            .getPublicUrl(filePath)
        return data.publicUrl
    } catch (error) {
        console.error('Error getting public image URL:', error)
        return `https://via.placeholder.com/800x600?text=Error+Loading+Image`
    }
}

// Load thumbnail URL for an image
const loadThumbnailUrl = async (image: PreviewImage) => {
    if (!thumbnailUrls.value[image.id]) {
        try {
            const url = await resolveUrl(image.file_url)
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
            if (props.getUrl) {
                currentImageUrl.value = await resolveUrl(newImage.file_url)
            } else {
                currentImageUrl.value = getPublicUrlSync(newImage.file_url)
            }
        } catch (error) {
            console.error('Error loading current image URL:', error)
            currentImageUrl.value = `https://via.placeholder.com/800x600?text=Error+Loading+Image`
        }
    } else {
        currentImageUrl.value = null
    }
}, { immediate: true })

// Preload thumbnail URLs
onMounted(async () => {
    if (props.images.length > 1) {
        if (props.getUrl) {
            const imagesToPreload = props.images.slice(0, 5)
            await Promise.all(imagesToPreload.map(image => loadThumbnailUrl(image)))
        } else {
            // No signed URL resolver provided → fill thumbnails synchronously
            const entries = props.images.map(image => [image.id as string, getPublicUrlSync(image.file_url)])
            thumbnailUrls.value = Object.fromEntries(entries)
        }
    }
})

watch(() => props.images, async (newImages) => {
    if (!newImages || newImages.length === 0) {
        thumbnailUrls.value = {}
        return
    }

    if (!props.getUrl) {
        // Keep thumbnails in sync when the list changes in public URL mode
        const entries = newImages.map(image => [image.id as string, getPublicUrlSync(image.file_url)])
        thumbnailUrls.value = Object.fromEntries(entries)
    } else {
        // Ensure at least first few thumbnails are loaded when using signed URLs
        const imagesToPreload = newImages.slice(0, 5)
        await Promise.all(imagesToPreload.map(image => loadThumbnailUrl(image)))
    }
}, { deep: false })
</script>