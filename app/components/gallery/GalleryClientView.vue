<template>
    <div class="min-h-screen">
        <!-- Gallery Description -->
        <div class="bg-white dark:bg-neutral-900">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div class="text-center max-w-4xl mx-auto">
                    <!-- Main title GALLERY -->
                    <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black mb-4 tracking-tight">
                        GALERIE
                    </h1>

                    <!-- Subtitle with project and gallery titles -->
                    <div
                        class="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-medium mb-8 space-y-1">
                        <div>{{ project.title }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Images Grid -->
        <div ref="galleryContainer" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div v-if="props.images.length === 0" class="text-center py-12">
                <div
                    class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UIcon name="i-lucide-image" class="w-8 h-8 text-neutral-400" />
                </div>
                <h3 class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    Aucune image pour le moment
                </h3>
                <p class="text-neutral-500 dark:text-neutral-400">
                    Les images de la galerie seront affichées ici
                </p>
            </div>

            <div v-else>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <GalleryImageCard v-for="(image, index) in props.images" :key="image.id" :image="image"
                        :gallery-id="props.gallery?.id || ''" :image-index="index"
                        :signed-url="store.getImageSignedUrl(image.file_url)" @open-preview="openImagePreview" />
                </div>

                <!-- Loading More Indicator -->
                <div v-if="props.loadingMore" class="text-center mt-8 py-4">
                    <div class="flex items-center justify-center gap-3">
                        <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-primary-500" />
                        <span class="text-neutral-600 dark:text-neutral-400">Chargement des images suivantes...</span>
                    </div>
                </div>

                <!-- End of Gallery Indicator -->
                <div v-else-if="!props.hasMore && props.images.length > 0" class="text-center mt-8 py-4">
                    <div class="flex items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400">
                        <UIcon name="i-lucide-check-circle" class="w-4 h-4" />
                        <span>Toutes les images ont été chargées</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Image Preview Modal -->
        <GalleryImagePreviewModal :is-open="imagePreview.isOpen.value" :current-image="currentPreviewImage"
            :images="modalImages" :current-index="imagePreview.currentIndex.value" :gallery-id="props.gallery?.id || ''"
            :image-signed-urls="store.imageSignedUrls" @close="imagePreview.closePreview" @next="imagePreview.nextImage"
            @previous="imagePreview.previousImage" @go-to="imagePreview.goToImage"
            @update:is-open="imagePreview.isOpen.value = $event" />
    </div>
</template>

<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core';
import { useImagePreview } from '~/composables/shared/useImagePreview';
import type { ClientGalleryAccess, GalleryImageWithSignedUrl } from "~/types/gallery";

interface Props {
    galleryId: string;
    project: ClientGalleryAccess["project"];
    gallery: ClientGalleryAccess["gallery"];
    images: readonly GalleryImageWithSignedUrl[];
    hasMore: boolean;
    loadingMore: boolean;
}

interface Emits {
    'load-more': []
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Container ref for infinite scroll
const galleryContainer = ref<HTMLElement | null>(null);

// Image preview composable
const imagePreview = useImagePreview();

// Image signed URLs from store
const store = useClientGalleryStore();

// Current preview image for modal
const currentPreviewImage = computed(() => {
    if (!imagePreview.currentImage.value || !props.images.length) return null;
    return props.images.find(img => img.id === imagePreview.currentImage.value?.id) || null;
});

// Non-readonly images for modal prop typing
const modalImages = computed(() => props.images as unknown as GalleryImageWithSignedUrl[]);

// Lightbox methods
const openImagePreview = (image: GalleryImageWithSignedUrl) => {
    const previewImages = props.images.map(img => ({ id: img.id, file_url: img.file_url, created_at: img.created_at }));
    const previewImage = { id: image.id, file_url: image.file_url, created_at: image.created_at };
    imagePreview.openPreview(previewImage, previewImages);
};

// Debounced load more function to prevent excessive calls
const loadMoreDebounced = useDebounceFn(async () => {
    if (props.hasMore && !props.loadingMore) {
        emit('load-more');
    }
}, 300);

// Infinite scroll setup with better protection
onMounted(() => {
    if (galleryContainer.value) {
        useInfiniteScroll(
            galleryContainer.value,
            loadMoreDebounced,
            {
                distance: 400, // Load more when 400px from bottom
                canLoadMore: () => props.hasMore && !props.loadingMore
            }
        );
    }
});
</script>