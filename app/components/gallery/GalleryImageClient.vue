<template>
    <div class="w-full h-full" @click="$emit('click', $event)">
        <NuxtImg v-if="imageUrl" :src="imageUrl" :alt="`Image de galerie`" :class="imageClasses"
            @error="handleImageError" />
        <div v-else class="w-full h-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
            <UIcon name="i-lucide-image" class="w-8 h-8 text-neutral-400" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useClientGalleryActions } from "~/composables/galleries/client/useClientGalleryActions";
import type { GalleryImage } from "~/types/gallery";

interface Props {
    image: GalleryImage;
    fullSize?: boolean;
    galleryId: string;
}

interface Emits {
    (e: 'click', event: MouseEvent): void
}

const props = withDefaults(defineProps<Props>(), {
    fullSize: false,
});

defineEmits<Emits>()

// Get image URL directly from actions
const actions = useClientGalleryActions();
const imageUrl = ref<string | null>(null);

// Load image URL on mount
onMounted(async () => {
    imageUrl.value = await actions.getImageSignedUrl(props.galleryId, props.image.file_url);
});

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