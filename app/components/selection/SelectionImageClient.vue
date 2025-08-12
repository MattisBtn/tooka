<template>
    <div ref="imageRef" class="w-full h-full">
        <NuxtImg v-if="imageUrl" :src="imageUrl" :alt="`Image de sélection`" :class="imageClasses"
            @error="handleImageError" />
        <div v-else-if="loading"
            class="w-full h-full bg-neutral-200 dark:bg-neutral-700 animate-pulse flex items-center justify-center">
            <UIcon name="i-lucide-image" class="w-8 h-8 text-neutral-400" />
        </div>
        <div v-else-if="error"
            class="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <UIcon name="i-lucide-image-off" class="w-8 h-8 text-neutral-400" />
        </div>
        <div v-else class="w-full h-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
            <UIcon name="i-lucide-image" class="w-8 h-8 text-neutral-400" />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { SelectionImage } from "~/types/selection";

interface Props {
    image: SelectionImage;
    fullSize?: boolean;
    selectionId: string;
    signedUrl?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
    fullSize: false,
});

// Use signed URL from props or fallback to loading state
const imageUrl = computed(() => props.signedUrl);
const loading = computed(() => !props.signedUrl && !error.value);
const error = ref(false);

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