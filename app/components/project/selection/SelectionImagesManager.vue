<template>
    <USlideover v-model:open="isOpen" side="right" title="Gestionnaire des images" close-icon="i-lucide-x"
        :ui="{ content: 'w-[calc(100vw-2rem)] max-w-4xl' }">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <UIcon name="i-lucide-gallery-horizontal-end" class="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-highlighted">Gestionnaire des images</h3>
                    <p class="text-sm text-muted">
                        Gérez toutes les images de la sélection ({{ totalCount }} au total)
                    </p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-4 h-full overflow-hidden">
                <!-- Filter Bar -->
                <div class="flex items-center justify-between">
                    <!-- Filter Dropdown -->
                    <UDropdownMenu :items="filterDropdownItems" :popper="{ placement: 'bottom-start' }">
                        <UButton icon="i-lucide-filter" :label="filterButtonLabel" color="neutral" variant="outline"
                            size="sm" trailing-icon="i-heroicons-chevron-down-20-solid" />
                    </UDropdownMenu>

                    <!-- Images count -->
                    <div class="text-sm text-neutral-500 dark:text-neutral-400">
                        {{ filteredImages.length }} image{{ filteredImages.length > 1 ? 's' : '' }}
                        <span v-if="currentFilter === 'selected'">sélectionnée{{ filteredImages.length > 1 ? 's' : ''
                            }}</span>
                    </div>
                </div>

                <!-- Images Grid with Infinite Scroll -->
                <div class="max-h-[calc(100vh-200px)] overflow-y-auto">
                    <div class="space-y-4">
                        <!-- Loading initial -->
                        <div v-if="isInitialLoading" class="py-8 text-center">
                            <UIcon name="i-lucide-loader-2"
                                class="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
                            <p class="text-sm text-neutral-600 dark:text-neutral-400">Chargement des images...</p>
                        </div>

                        <!-- Images Grid using existing component -->
                        <div v-else-if="filteredImages.length > 0">
                            <ProjectSelectionImageGrid :key="`grid-${currentFilter}-${displayedImages.length}`"
                                :images="filteredImages" :can-delete="canDeleteImages" :show-selection-state="true"
                                :max-preview="999999" @delete-image="deleteImage" />
                        </div>

                        <!-- Load more button -->
                        <div v-if="hasMore && !isInitialLoading" class="py-4 text-center">
                            <UButton :loading="isLoadingMore" :disabled="isLoadingMore" color="primary"
                                variant="outline" size="sm" @click="loadMoreImages">
                                <template #leading>
                                    <UIcon name="i-lucide-plus" class="w-4 h-4" />
                                </template>
                                Charger plus d'images
                            </UButton>
                        </div>

                        <!-- End message -->
                        <div v-if="!hasMore && displayedImages.length > 0" class="py-4 text-center">
                            <p class="text-sm text-neutral-500 dark:text-neutral-400">
                                Toutes les images ont été chargées
                            </p>
                        </div>

                        <!-- Empty state -->
                        <div v-if="!isInitialLoading && filteredImages.length === 0" class="text-center py-12">
                            <UIcon name="i-lucide-images" class="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                            <p class="text-neutral-600 dark:text-neutral-400">
                                {{ currentFilter === 'selected' ?
                                    'Aucune image sélectionnée' :
                                    'Aucune image dans cette sélection' }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </USlideover>
</template>

<script lang="ts" setup>
import { useSelectionStore } from '~/stores/admin/selection';
import type { SelectionImage } from '~/types/selection';

interface Props {
    open: boolean;
    selectionId?: string;
}

interface Emits {
    (e: 'update:open', value: boolean): void;
    (e: 'images-updated'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Reactive state
const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
});

// Store
const selectionStore = useSelectionStore();

// Local state
const displayedImages = ref<SelectionImage[]>([]);
const currentPage = ref(1);
const totalCount = ref(0);
const hasMore = ref(true);
const isInitialLoading = ref(false);
const isLoadingMore = ref(false);

// Filter state
type FilterType = 'all' | 'selected';
const currentFilter = ref<FilterType>('all');

// Computed
const canDeleteImages = computed(() => selectionStore.canEdit);

// Filtered images with selected images first - ULTRA OPTIMIZED
const filteredImages = computed(() => {
    // Memoize the result to prevent unnecessary recalculations
    if (currentFilter.value === 'selected') {
        return displayedImages.value.filter(image => image.is_selected);
    }
    // For 'all' filter, return reference to avoid unnecessary re-renders
    return displayedImages.value;
});

const filterButtonLabel = computed(() => {
    switch (currentFilter.value) {
        case 'selected': return 'Sélectionnées';
        default: return 'Toutes les images';
    }
});

// Dropdown items for filter - ULTRA OPTIMIZED (static to prevent re-renders)
const filterDropdownItems = [
    [{
        label: 'Toutes les images',
        icon: 'i-lucide-images',
        onSelect: () => setFilter('all')
    }],
    [{
        label: 'Sélectionnées',
        icon: 'i-lucide-check-circle',
        onSelect: () => setFilter('selected')
    }]
];

// Filter actions
const setFilter = (filter: FilterType) => {
    currentFilter.value = filter;
};

// Constants
const ITEMS_PER_PAGE = 20;

// Methods - ULTRA OPTIMIZED
const loadImages = async (page: number = 1, reset: boolean = false) => {
    if (!props.selectionId) return;

    const isInitial = page === 1 && reset;

    if (isInitial) {
        isInitialLoading.value = true;
    } else {
        isLoadingMore.value = true;
    }

    try {
        const result = await selectionStore.loadImagesWithPagination(page, ITEMS_PER_PAGE);

        // Use nextTick to batch DOM updates
        await nextTick();

        if (reset) {
            displayedImages.value = result.images;
        } else {
            // Use push for better performance than spread
            displayedImages.value.push(...result.images);
        }

        totalCount.value = result.totalCount;
        hasMore.value = result.hasMore;
        currentPage.value = result.currentPage;

    } catch (error) {
        console.error('Failed to load images:', error);
        const toast = useToast();
        toast.add({
            title: 'Erreur',
            description: 'Impossible de charger les images',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        });
    } finally {
        isInitialLoading.value = false;
        isLoadingMore.value = false;
    }
};

const loadMoreImages = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingMore.value || !hasMore.value) return;

    // Set loading state immediately to prevent double clicks
    isLoadingMore.value = true;

    try {
        await loadImages(currentPage.value + 1, false);
    } catch (error) {
        // Error handling is already done in loadImages
        console.error('Load more failed:', error);
    }
};

const deleteImage = async (imageId: string) => {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.');
    if (!confirmed) return;

    try {
        await selectionStore.deleteImage(imageId);

        // Remove from local arrays - OPTIMIZED
        const index = displayedImages.value.findIndex(img => img.id === imageId);
        if (index > -1) {
            displayedImages.value.splice(index, 1);
            totalCount.value = Math.max(0, totalCount.value - 1);
        }

        emit('images-updated');

        const toast = useToast();
        toast.add({
            title: 'Image supprimée',
            description: 'L\'image a été supprimée avec succès.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        });
    } catch (error) {
        console.error('Delete failed:', error);
        const toast = useToast();
        toast.add({
            title: 'Erreur',
            description: error instanceof Error ? error.message : 'Erreur lors de la suppression',
            icon: 'i-lucide-alert-circle',
            color: 'error'
        });
    }
};



// Initialize when slideover opens - ULTRA OPTIMIZED
watch(isOpen, (newValue, oldValue) => {
    // Only load when opening (not closing) and selectionId exists
    if (newValue && !oldValue && props.selectionId) {
        // Reset state first
        currentPage.value = 1;
        displayedImages.value = [];
        hasMore.value = true;
        totalCount.value = 0;

        // Load images after state reset
        nextTick(() => {
            loadImages(1, true);
        });
    }
});
</script>