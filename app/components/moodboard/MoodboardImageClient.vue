<template>
    <div class="w-full h-full">
        <NuxtImg v-if="imageUrl" :src="imageUrl" :alt="`Image de moodboard`" :class="imageClasses"
            @error="handleImageError" />
        <div v-else class="w-full h-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
            <UIcon name="i-lucide-image" class="w-8 h-8 text-neutral-400" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useClientMoodboardActions } from "~/composables/moodboards/client/useClientMoodboardActions";
import type { MoodboardImage } from "~/types/moodboard";

interface Props {
    image: MoodboardImage;
    fullSize?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    fullSize: false,
});

// Get image URL directly from actions
const actions = useClientMoodboardActions();
const imageUrl = ref<string | null>(null);

// Load image URL on mount
onMounted(async () => {
    imageUrl.value = await actions.getImageSignedUrl(props.image.file_url);
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