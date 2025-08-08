<template>
    <div
        class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <!-- Image with selection state -->
        <div class="aspect-square bg-neutral-100 dark:bg-neutral-900 relative group transition-transform duration-300"
            :class="[
                canInteract ? 'cursor-pointer' : 'cursor-default',
                isSelected ? 'ring-4 ring-amber-500' : ''
            ]" @click="handleImageClick">

            <SelectionImageClient :image="image" :selection-id="selectionId"
                class="w-full h-full transition-all duration-300 cursor-pointer" :class="[
                    isSelected ? 'brightness-75' : ''
                ]" />

            <!-- Selection indicator overlay -->
            <div v-if="isSelected" class="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                <div class="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                    <UIcon name="i-lucide-check" class="w-8 h-8 text-white" />
                </div>
            </div>

            <!-- Hover overlay for unselected images -->
            <div v-else-if="canInteract"
                class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div
                    class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50">
                    <UIcon name="i-lucide-plus" class="w-8 h-8 text-white" />
                </div>
            </div>

            <!-- Update indicator removed - selections are now instant -->

            <!-- Action buttons overlay -->
            <div class="absolute top-2 right-2 flex gap-2">
                <!-- View button -->
                <UButton icon="i-lucide-eye" color="neutral" variant="solid" size="xs"
                    class="backdrop-blur-sm bg-white/90 hover:bg-white text-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    @click.stop="openImagePreview" />

                <!-- Non-interactive status for completed state -->
                <div v-if="!canInteract" class="px-2 py-1 bg-neutral-900/70 rounded-lg text-xs text-white">
                    {{ isSelected ? 'Sélectionnée' : 'Non sélectionnée' }}
                </div>
            </div>
        </div>
    </div>


</template>

<script setup lang="ts">
import { useClientSelectionStore } from '~/stores/public/selection'
import type { SelectionImageWithSelection } from '~/types/selection'

interface Props {
    image: SelectionImageWithSelection
    selectionId: string
    canInteract: boolean
}

interface Emits {
    'toggle-selection': []
    'open-preview': [image: SelectionImageWithSelection]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Use store for selection state
const store = useClientSelectionStore()



// Computed for selection state
const isSelected = computed(() => store.isImageSelected(props.image.id))

// Handle image click for selection
const handleImageClick = () => {
    if (props.canInteract) {
        emit('toggle-selection')
    }
}

// Image preview methods
const openImagePreview = () => {
    emit('open-preview', props.image)
}
</script>

<style scoped>
/* Additional styles if needed */
</style>