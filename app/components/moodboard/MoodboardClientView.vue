<template>
    <div class="min-h-screen">
        <!-- Moodboard Description -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div class="text-center max-w-4xl mx-auto">
                <!-- Main title MOODBOARD -->
                <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black mb-4 tracking-tight">
                    MOODBOARD
                </h1>

                <!-- Subtitle with project and moodboard titles -->
                <div
                    class="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-medium mb-8 space-y-1">
                    <div>{{ project.title }}</div>
                    <div class="text-neutral-400 dark:text-neutral-500">{{ moodboard.title }}</div>
                </div>

                <!-- Description -->
                <div v-if="moodboard.description" class="max-w-2xl mx-auto">
                    <p class="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">
                        {{ moodboard.description }}
                    </p>
                </div>

                <!-- Upload section for interactive mode -->
                <div v-if="canInteract" class="mt-12">
                    <MoodboardImageUpload :disabled="uploadingImages"
                        @files-selected="$emit('upload-images', $event)" />
                </div>
            </div>
        </div>

        <!-- Filter Bar -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <!-- Desktop: Horizontal layout -->
            <div class="hidden md:flex items-center justify-between">
                <!-- Filter Dropdown -->
                <UDropdownMenu :items="filterDropdownItems" :popper="{ placement: 'bottom-start' }">
                    <UButton icon="i-lucide-filter" :label="filterButtonLabel" color="neutral" variant="outline"
                        size="sm" trailing-icon="i-heroicons-chevron-down-20-solid" />
                </UDropdownMenu>

                <!-- Active filters display -->
                <div v-if="activeFilters.length > 0" class="flex items-center gap-2">
                    <UBadge v-for="filter in activeFilters" :key="filter" :color="getFilterColor(filter)" variant="soft"
                        size="sm" class="cursor-pointer" @click="toggleFilter(filter)">
                        <UIcon :name="getFilterIcon(filter)" class="w-3 h-3 mr-1" />
                        {{ getFilterLabel(filter) }}
                        <UIcon name="i-heroicons-x-mark-20-solid" class="w-3 h-3 ml-1" />
                    </UBadge>
                    <UButton icon="i-heroicons-x-mark-20-solid" color="neutral" variant="ghost" size="xs"
                        @click="clearAllFilters">
                        Effacer
                    </UButton>
                </div>
            </div>

            <!-- Mobile: Vertical layout -->
            <div class="md:hidden space-y-3">
                <!-- Filter controls row -->
                <UDropdownMenu :items="filterDropdownItems" :popper="{ placement: 'bottom-start' }">
                    <UButton icon="i-lucide-filter" :label="filterButtonLabel" color="neutral" variant="outline"
                        size="sm" trailing-icon="i-heroicons-chevron-down-20-solid" />
                </UDropdownMenu>

                <!-- Active filters display -->
                <div v-if="activeFilters.length > 0" class="flex flex-wrap items-center gap-2">
                    <UBadge v-for="filter in activeFilters" :key="filter" :color="getFilterColor(filter)" variant="soft"
                        size="sm" class="cursor-pointer" @click="toggleFilter(filter)">
                        <UIcon :name="getFilterIcon(filter)" class="w-3 h-3 mr-1" />
                        {{ getFilterLabel(filter) }}
                        <UIcon name="i-heroicons-x-mark-20-solid" class="w-3 h-3 ml-1" />
                    </UBadge>
                    <UButton icon="i-heroicons-x-mark-20-solid" color="neutral" variant="ghost" size="xs"
                        @click="clearAllFilters">
                        Effacer
                    </UButton>
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
                    Les images d'inspiration seront affichées ici
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
                    <MoodboardImageCard v-for="image in filteredImages" :key="image.id" :image="image"
                        :moodboard-id="moodboardId" :can-interact="canInteract"
                        :signed-url="store.getImageSignedUrl(image.file_url)"
                        @react="$emit('react-to-image', image.id, $event)"
                        @comment="(comment, onSuccess) => $emit('add-comment', image.id, comment, onSuccess)"
                        @open-preview="openImagePreview" />
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
            :image-signed-urls="store.imageSignedUrls" :show-thumbnails="false" @close="imagePreview.closePreview"
            @next="imagePreview.nextImage" @previous="imagePreview.previousImage" @go-to="imagePreview.goToImage"
            @update:is-open="imagePreview.isOpen.value = $event" />
    </div>
</template>

<script setup lang="ts">
import { useImagePreview } from '~/composables/shared/useImagePreview';
import type {
    ClientMoodboardAccess,
    MoodboardImageWithInteractions,
    MoodboardWithDetails
} from '~/types/moodboard';

interface Props {
    moodboardId: string
    moodboard: MoodboardWithDetails
    project: ClientMoodboardAccess['project']
    images: MoodboardImageWithInteractions[]
    totalImages: number
    currentPage: number
    pageSize: number
    loading: boolean
    canInteract: boolean
    uploadingImages: boolean
}

interface Emits {
    'upload-images': [files: File[]]
    'add-comment': [imageId: string, comment: string, onSuccess?: () => void]
    'react-to-image': [imageId: string, reaction: 'love' | 'like' | 'dislike']
    'page-change': [page: number]
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Image preview composable
const imagePreview = useImagePreview();

// Filter state - now managed by the store
type FilterType = 'commented' | 'love' | 'like' | 'dislike';

// Store for signed URLs
const store = useClientMoodboardStore();

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

// Filter logic - now images are already filtered by the server
const filteredImages = computed(() => props.images);

// Active filters computed from store
const activeFilters = computed(() => {
    const filters = store.activeFilters;
    const active: FilterType[] = [];
    if (filters.commented) active.push('commented');
    if (filters.love) active.push('love');
    if (filters.like) active.push('like');
    if (filters.dislike) active.push('dislike');
    return active;
});

// Filter controls - delegate to store
const toggleFilter = async (filter: FilterType) => {
    await store.toggleFilter(filter);
};

const clearAllFilters = async () => {
    await store.clearAllFilters();
};

// Filter UI helpers
const getFilterColor = (filter: FilterType) => {
    switch (filter) {
        case 'commented': return 'info';
        case 'love': return 'error';
        case 'like': return 'success';
        case 'dislike': return 'warning';
        default: return 'neutral';
    }
};

const getFilterIcon = (filter: FilterType) => {
    switch (filter) {
        case 'commented': return 'i-lucide-message-circle';
        case 'love': return 'i-lucide-heart';
        case 'like': return 'i-lucide-thumbs-up';
        case 'dislike': return 'i-lucide-thumbs-down';
        default: return 'i-lucide-filter';
    }
};

const getFilterLabel = (filter: FilterType) => {
    switch (filter) {
        case 'commented': return 'Commentés';
        case 'love': return 'Aimés';
        case 'like': return 'Approuvés';
        case 'dislike': return 'Désapprouvés';
        default: return filter;
    }
};

const filterButtonLabel = computed(() => {
    if (activeFilters.value.length === 0) {
        return 'Filtrer';
    }
    return `Filtrer (${activeFilters.value.length})`;
});

// Dropdown items for filter - following the pattern from clients/projects pages
const filterDropdownItems = computed(() => [
    [{
        label: 'Commentés',
        icon: 'i-lucide-message-circle',
        onSelect: () => toggleFilter('commented')
    }, {
        label: 'Aimés ❤️',
        icon: 'i-lucide-heart',
        onSelect: () => toggleFilter('love')
    }, {
        label: 'Approuvés 👍',
        icon: 'i-lucide-thumbs-up',
        onSelect: () => toggleFilter('like')
    }, {
        label: 'Désapprouvés 👎',
        icon: 'i-lucide-thumbs-down',
        onSelect: () => toggleFilter('dislike')
    }],
    [{
        label: 'Effacer les filtres',
        icon: 'i-heroicons-x-mark-20-solid',
        onSelect: clearAllFilters,
        disabled: activeFilters.value.length === 0
    }]
]);

const modalImages = computed(() => filteredImages.value as unknown as MoodboardImageWithInteractions[]);

const openImagePreview = (image: MoodboardImageWithInteractions) => {
    // Convert MoodboardImageWithInteractions to PreviewImage format
    const previewImages = filteredImages.value.map(img => ({
        id: img.id,
        file_url: img.file_url,
        created_at: img.created_at
    }));

    const previewImage = {
        id: image.id,
        file_url: image.file_url,
        created_at: image.created_at
    };

    imagePreview.openPreview(previewImage, previewImages);
};
</script>

<style scoped>
/* Additional styles if needed */
</style>