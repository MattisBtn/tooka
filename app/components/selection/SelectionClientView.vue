<template>
    <div class="min-h-screen">
        <!-- Selection Description -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div class="text-center max-w-4xl mx-auto">
                <!-- Main title SELECTION -->
                <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black mb-4 tracking-tight">
                    SÉLECTION
                </h1>

                <!-- Subtitle with project title -->
                <div
                    class="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-medium mb-8">
                    <div>{{ project.title }}</div>
                </div>

                <!-- Selection Instructions -->
                <div class="max-w-2xl mx-auto mb-8">
                    <p class="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">
                        <template v-if="maxAllowed === Infinity">
                            Sélectionnez vos images préférées en cliquant dessus.
                            Vous pouvez choisir autant d'images que vous souhaitez.
                        </template>
                        <template v-else>
                            Sélectionnez vos images préférées en cliquant dessus.
                            Vous pouvez choisir jusqu'à {{ maxAllowed }} images incluses, ou plus avec un coût
                            supplémentaire.
                        </template>
                    </p>
                </div>

                <!-- Selection Information - Sticky Wrapper -->
                <div
                    class="sticky top-16 z-20 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-700 transition-all duration-300">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
                        <!-- Selection Stats - Simplified -->
                        <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                            <!-- Selected count -->
                            <div
                                class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg shadow-sm">
                                <UIcon name="i-lucide-check-circle" class="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                                <span class="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    <template v-if="maxAllowed === Infinity">
                                        {{ selectedCount }}
                                    </template>
                                    <template v-else>
                                        {{ selectedCount }}/{{ maxAllowed }}
                                    </template>
                                </span>
                            </div>

                            <!-- Extra count -->
                            <div v-if="extraCount > 0"
                                class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg shadow-sm">
                                <UIcon name="i-lucide-plus-circle" class="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                                <span class="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    +{{ extraCount }}
                                </span>
                            </div>

                            <!-- Extra price -->
                            <div v-if="extraPrice > 0"
                                class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg shadow-sm">
                                <UIcon name="i-lucide-euro" class="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                                <span class="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    +{{ extraPrice.toFixed(2) }}€
                                </span>
                            </div>
                        </div>


                    </div>
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

                <!-- Images count -->
                <div class="text-sm text-neutral-500 dark:text-neutral-400">
                    {{ props.images.length }} image{{ props.images.length > 1 ? 's' : '' }}
                    <span v-if="activeFilters.length > 0">filtrée{{ props.images.length > 1 ? 's' : '' }}</span>
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
                    Les images de sélection seront affichées ici
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
                    <SelectionImageCard v-for="image in props.images" :key="image.id" :image="image"
                        :selection-id="selectionId" :can-interact="canInteract"
                        :signed-url="store.getImageSignedUrl(image.file_url)"
                        @toggle-selection="$emit('toggle-selection', image.id)" @open-preview="openImagePreview" />
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
    ClientSelectionAccess,
    SelectionImageWithSelection,
    SelectionWithDetails
} from '~/types/selection';

interface Props {
    selectionId: string
    selection: SelectionWithDetails
    project: ClientSelectionAccess['project']
    images: SelectionImageWithSelection[]
    totalImages: number
    currentPage: number
    pageSize: number
    loading: boolean
    canInteract: boolean
    selectedCount: number
    maxAllowed: number
    extraCount: number
    extraPrice: number
}

interface Emits {
    'toggle-selection': [imageId: string]
    'page-change': [page: number]
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Image preview composable
const imagePreview = useImagePreview();

// Filter state - managed by the store
type FilterType = 'selected';

// Store for signed URLs
const store = useClientSelectionStore();

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

// Active filters computed from store
const activeFilters = computed(() => {
    const filters = store.activeFilters;
    const active: FilterType[] = [];
    if (filters.selected) active.push('selected');
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
        case 'selected': return 'success';
        default: return 'neutral';
    }
};

const getFilterIcon = (filter: FilterType) => {
    switch (filter) {
        case 'selected': return 'i-lucide-check-circle';
        default: return 'i-lucide-filter';
    }
};

const getFilterLabel = (filter: FilterType) => {
    switch (filter) {
        case 'selected': return 'Sélectionnées';
        default: return filter;
    }
};

const filterButtonLabel = computed(() => {
    if (activeFilters.value.length === 0) {
        return 'Filtrer';
    }
    return `Filtrer (${activeFilters.value.length})`;
});

// Dropdown items for filter
const filterDropdownItems = computed(() => [
    [{
        label: 'Sélectionnées',
        icon: 'i-lucide-check-circle',
        onSelect: () => toggleFilter('selected')
    }],
    [{
        label: 'Effacer les filtres',
        icon: 'i-heroicons-x-mark-20-solid',
        onSelect: clearAllFilters,
        disabled: activeFilters.value.length === 0
    }]
]);

const modalImages = computed(() => props.images as unknown as SelectionImageWithSelection[]);

const openImagePreview = (image: SelectionImageWithSelection) => {
    // Convert SelectionImageWithSelection to PreviewImage format
    const previewImages = props.images.map(img => ({
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