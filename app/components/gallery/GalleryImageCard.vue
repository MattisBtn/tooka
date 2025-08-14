<template>
    <div
        class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <!-- Image with hover interactions -->
        <div class="aspect-square bg-neutral-100 dark:bg-neutral-900 relative group" @click="openImagePreview">
            <GalleryImageClient :image="image" :signed-url="signedUrl"
                class="w-full h-full transition-transform duration-300 cursor-pointer" @click.stop="openImagePreview" />

            <!-- Gradient overlay for interactions -->
            <div
                class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <!-- Download button - desktop: appears on hover, mobile: always visible -->
            <UButton v-if="showDownloadButton" icon="i-lucide-download" color="primary" variant="solid"
                :size="isMobile ? 'sm' : 'xs'" class="absolute top-2 right-2 transition-opacity duration-300"
                :class="isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'" :loading="downloadingImage"
                @click.stop="handleDownloadImage" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useClientGalleryActions } from '~/composables/galleries/client/useClientGalleryActions'
import { useClientGalleryStore } from '~/stores/public/gallery'
import type { GalleryImageWithSignedUrl } from '~/types/gallery'

interface Props {
    image: GalleryImageWithSignedUrl
    galleryId: string
    imageIndex: number
    signedUrl?: string | null
}

interface Emits {
    'open-preview': [image: GalleryImageWithSignedUrl]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Store and actions
const store = useClientGalleryStore()
const actions = useClientGalleryActions()

// Reactive mobile detection
const isMobile = ref(false)

// Computed properties
const showDownloadButton = computed(() => store.gallery?.status === 'completed')
const downloadingImage = computed(() => actions.downloadingImage.value)

// Update mobile detection on mount and resize
const updateMobileDetection = () => {
    if (import.meta.client) {
        isMobile.value = window.innerWidth < 640 // sm breakpoint
    }
}

onMounted(() => {
    updateMobileDetection()
    window.addEventListener('resize', updateMobileDetection)
})

onUnmounted(() => {
    if (import.meta.client) {
        window.removeEventListener('resize', updateMobileDetection)
    }
})

// Image preview methods
const openImagePreview = () => {
    emit('open-preview', props.image)
}

// Download methods
const handleDownloadImage = () => {
    actions.downloadImage(props.image.id)
}
</script>

<style scoped>
/* Additional styles if needed */
</style>
