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
import { useClientSelectionActions } from "~/composables/selections/client/useClientSelectionActions";
import type { SelectionImage } from "~/types/selection";

interface Props {
    image: SelectionImage;
    fullSize?: boolean;
    selectionId: string;
}

const props = withDefaults(defineProps<Props>(), {
    fullSize: false,
});

// Get image URL directly from actions
const actions = useClientSelectionActions();
const imageUrl = ref<string | null>(null);
const loading = ref(false);
const error = ref(false);

// Load image URL on mount
onMounted(async () => {
    loading.value = true;
    try {
        imageUrl.value = await actions.getImageSignedUrl(props.selectionId, props.image.file_url);
    } catch (err) {
        console.error("Error loading image:", err);
        error.value = true;
    } finally {
        loading.value = false;
    }
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