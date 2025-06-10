<template>
    <div ref="imageRef" class="w-full h-full">
        <NuxtImg v-if="imageUrl" :src="imageUrl" :alt="`Image de galerie`" :class="imageClasses"
            @error="handleImageError" />
        <div v-else-if="loading"
            class="w-full h-full bg-neutral-200 dark:bg-neutral-700 animate-pulse flex items-center justify-center">
            <UIcon name="i-heroicons-photo" class="w-8 h-8 text-neutral-400" />
        </div>
        <div v-else-if="error"
            class="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-neutral-400" />
        </div>
        <div v-else class="w-full h-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
            <UIcon name="i-heroicons-photo" class="w-8 h-8 text-neutral-400" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useClientGalleryImages } from "~/composables/galleries/client/useClientGalleryImages";
import type { GalleryImage } from "~/types/gallery";

interface Props {
    image: GalleryImage;
    fullSize?: boolean;
    galleryId: string;
}

const props = withDefaults(defineProps<Props>(), {
    fullSize: false,
});

// Use client gallery images composable with lazy loading
const { useLazyImageLoading } = useClientGalleryImages();

// Lazy load the image with intersection observer
const { imageUrl, loading, error, imageRef } = useLazyImageLoading(
    props.galleryId,
    props.image.file_url
);

// Computed classes
const imageClasses = computed(() => [
    "object-cover transition-opacity duration-300",
    props.fullSize ? "max-w-full max-h-full" : "w-full h-full",
]);

// Handle image load error
const handleImageError = () => {
    console.error("Image failed to load:", props.image.file_url);
};
</script>