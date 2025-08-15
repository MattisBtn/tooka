<template>
    <UModal :open="isOpen" :fullscreen="true" :transition="true" @update:is-open="$emit('update:isOpen', $event)">
        <template #content>
            <div class="flex h-full bg-black/95 relative">
                <!-- Header controls -->
                <div class="absolute top-4 left-4 right-4 flex items-center justify-between z-50">
                    <!-- Left side - Download button on mobile -->
                    <div class="flex items-center gap-2">
                        <UButton v-if="showDownloadButton && isMobile" icon="i-lucide-download" size="sm"
                            color="primary" variant="solid" :loading="downloadingImage"
                            @click="handleDownloadCurrentImage" />
                    </div>

                    <!-- Right side - Controls -->
                    <div class="flex items-center gap-2">
                        <!-- Download button on desktop -->
                        <UButton v-if="showDownloadButton && !isMobile" icon="i-lucide-download" size="md"
                            color="primary" variant="solid" :loading="downloadingImage"
                            @click="handleDownloadCurrentImage" />

                        <!-- Close button -->
                        <UButton icon="i-lucide-x" :size="isMobile ? 'sm' : 'md'" color="neutral" variant="ghost"
                            @click="closePreview" />
                    </div>
                </div>

                <!-- Navigation arrows - Hidden on mobile when thumbnails are disabled -->
                <UButton v-if="images.length > 1 && (!isMobile || showThumbnails)" icon="i-lucide-chevron-left"
                    :size="isMobile ? 'md' : 'lg'" color="neutral" variant="ghost"
                    class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50" @click="previousImage" />

                <UButton v-if="images.length > 1 && (!isMobile || showThumbnails)" icon="i-lucide-chevron-right"
                    :size="isMobile ? 'md' : 'lg'" color="neutral" variant="ghost"
                    class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50" @click="nextImage" />

                <!-- Image container -->
                <div class="flex-1 flex items-center justify-center p-4 sm:p-8 w-full h-full">
                    <div v-if="currentImage" class="relative w-full h-full flex items-center justify-center">
                        <!-- Main image -->
                        <div v-if="currentImageUrl" class="relative w-full h-full flex items-center justify-center">
                            <NuxtImg :src="currentImageUrl" :alt="`Image preview ${currentIndex + 1}`"
                                class="max-w-full max-h-full w-auto h-auto object-contain transition-all duration-300"
                                loading="eager" @error="handleImageError" />
                        </div>
                        <div v-else class="w-full h-full flex items-center justify-center">
                            <USkeleton class="w-full h-full max-w-4xl max-h-4xl" />
                        </div>

                        <!-- Image counter - Always visible -->
                        <div v-if="images.length > 1"
                            class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                            {{ currentIndex + 1 }} / {{ images.length }}
                        </div>

                        <!-- Swipe indicator on mobile when no thumbnails -->
                        <div v-if="isMobile && images.length > 1 && !showThumbnails"
                            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                            <div class="flex items-center gap-2 text-white/60 text-xs">
                                <UIcon name="i-lucide-move-horizontal" class="w-4 h-4" />
                                <span>Glissez pour naviguer</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Thumbnail navigation - Hidden on mobile -->
                <div v-if="images.length > 1 && !isMobile && showThumbnails"
                    class="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto pb-2">
                    <button v-for="(image, index) in images" :key="image.id"
                        class="w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-110 flex-shrink-0"
                        :class="index === currentIndex ? 'border-white' : 'border-white/30'" @click="goToImage(index)">
                        <NuxtImg v-if="thumbnailUrls[image.id]" :src="thumbnailUrls[image.id]"
                            :alt="`Thumbnail ${index + 1}`" class="w-full h-full object-cover" loading="lazy" />
                        <USkeleton v-else class="w-full h-full" />
                    </button>
                </div>

                <!-- Mobile swipe area -->
                <div v-if="isMobile && images.length > 1" class="absolute inset-0 z-40" @touchstart="handleTouchStart"
                    @touchend="handleTouchEnd" />
            </div>
        </template>
    </UModal>
</template>

<script lang="ts" setup>
interface ImageWithFileUrl {
    id: string
    file_url: string
    created_at: string
}

interface Props {
    isOpen: boolean
    currentImage: ImageWithFileUrl | null
    images: ImageWithFileUrl[]
    currentIndex: number
    imageSignedUrls: ReadonlyMap<string, string>
    // Optional props for download functionality
    showDownloadButton?: boolean
    downloadingImage?: boolean
    onDownloadImage?: (imageId: string) => void
    showThumbnails?: boolean // New prop to control thumbnail visibility
}

interface Emits {
    (e: 'close' | 'next' | 'previous'): void
    (e: 'go-to', index: number): void
    (e: 'update:isOpen', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
    showDownloadButton: false,
    downloadingImage: false,
    showThumbnails: true,
})

const emit = defineEmits<Emits>()

// Device detection using nuxt-device
const { isMobile } = useDevice()

// Touch handling for mobile swipe
const touchStart = ref<{ x: number; y: number } | null>(null)
const touchEnd = ref<{ x: number; y: number } | null>(null)

// Minimum swipe distance
const minSwipeDistance = 50

const handleTouchStart = (e: TouchEvent) => {
    touchEnd.value = null
    if (e.targetTouches && e.targetTouches[0]) {
        touchStart.value = {
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY,
        }
    }
}

const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart.value) return

    if (e.changedTouches && e.changedTouches[0]) {
        touchEnd.value = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
        }
    }

    if (!touchEnd.value) return

    const distanceX = touchStart.value.x - touchEnd.value.x
    const distanceY = touchStart.value.y - touchEnd.value.y
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)

    if (isHorizontalSwipe && Math.abs(distanceX) > minSwipeDistance) {
        if (distanceX > 0) {
            // Swipe left - next image
            emit('next')
        } else {
            // Swipe right - previous image
            emit('previous')
        }
    }
}

// Use signed URLs from props
const currentImageUrl = computed(() => {
    if (!props.currentImage) return null
    return props.imageSignedUrls.get(props.currentImage.file_url) || null
})

const thumbnailUrls = computed(() => {
    const urls: Record<string, string> = {}
    props.images.forEach(image => {
        const signedUrl = props.imageSignedUrls.get(image.file_url)
        if (signedUrl) {
            urls[image.id] = signedUrl
        }
    })
    return urls
})

const closePreview = () => emit('close')
const nextImage = () => emit('next')
const previousImage = () => emit('previous')
const goToImage = (index: number) => emit('go-to', index)

const handleImageError = () => {
    console.error('Failed to load image in preview modal')
}

// Download methods
const handleDownloadCurrentImage = () => {
    if (props.currentImage && props.onDownloadImage) {
        props.onDownloadImage(props.currentImage.id)
    }
}
</script>