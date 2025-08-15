<template>
    <div class="min-h-screen">
        <!-- Gallery Description -->
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


        <!-- Images Grid -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <!-- Loading skeleton -->
                <div v-if="props.loading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div v-for="i in 8" :key="i" class="aspect-square rounded-lg overflow-hidden">
                        <USkeleton class="w-full h-full" />
                    </div>
                </div>

                <!-- Images grid -->
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <GalleryImageCard v-for="(image, index) in props.images" :key="image.id" :image="image"
                        :gallery-id="props.gallery?.id || ''" :image-index="index"
                        :signed-url="store.getImageSignedUrl(image.file_url)" @open-preview="openImagePreview" />
                </div>

                <!-- Pagination -->
                <div v-if="props.totalImages > props.pageSize" class="flex justify-center mt-12 mb-8">
                    <UPagination v-model:page="currentPageModel" :total="props.totalImages"
                        :items-per-page="props.pageSize" :max="5"
                        class="px-4 py-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm" />
                </div>
            </div>
        </div>

        <!-- Image Preview Modal -->
        <SharedImagePreviewModal :is-open="imagePreview.isOpen.value" :current-image="currentPreviewImage"
            :images="modalImages" :current-index="imagePreview.currentIndex.value"
            :image-signed-urls="store.imageSignedUrls" :show-download-button="store.gallery?.status === 'completed'"
            :downloading-image="actions.downloadingImage.value" :on-download-image="actions.downloadImage"
            :show-thumbnails="false" @close="imagePreview.closePreview" @next="imagePreview.nextImage"
            @previous="imagePreview.previousImage" @go-to="imagePreview.goToImage"
            @update:is-open="imagePreview.isOpen.value = $event" />
    </div>
</template>

<script setup lang="ts">
import { useClientGalleryActions } from '~/composables/galleries/client/useClientGalleryActions';
import { useImagePreview } from '~/composables/shared/useImagePreview';
import type { ClientGalleryAccess, GalleryImageWithSignedUrl } from "~/types/gallery";

interface Props {
    galleryId: string;
    project: ClientGalleryAccess["project"];
    gallery: ClientGalleryAccess["gallery"];
    images: readonly GalleryImageWithSignedUrl[];
    totalImages: number;
    currentPage: number;
    pageSize: number;
    loading: boolean;
}

interface Emits {
    'page-change': [page: number]
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Image preview composable
const imagePreview = useImagePreview();

// Store for signed URLs
const store = useClientGalleryStore();

// Gallery actions for download functionality
const actions = useClientGalleryActions();

// Pagination computed removed - UPagination calculates pages automatically

// Current page model for v-model binding
const currentPageModel = computed({
    get: () => props.currentPage,
    set: (page: number) => {
        emit('page-change', page);
    }
});

// Image preview
const currentPreviewImage = computed(() => {
    if (!imagePreview.currentImage.value || !props.images.length) return null;
    return props.images.find(img => img.id === imagePreview.currentImage.value?.id) || null;
});

const modalImages = computed(() => props.images as unknown as GalleryImageWithSignedUrl[]);

const openImagePreview = (image: GalleryImageWithSignedUrl) => {
    const previewImages = props.images.map(img => ({ id: img.id, file_url: img.file_url, created_at: img.created_at }));
    const previewImage = { id: image.id, file_url: image.file_url, created_at: image.created_at };
    imagePreview.openPreview(previewImage, previewImages);
};
</script>