<template>
    <div
        class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <!-- Image with selection state -->
        <div class="aspect-square bg-neutral-100 dark:bg-neutral-900 relative group transition-transform duration-300"
            :class="[
                canInteract ? 'cursor-pointer' : 'cursor-default',
                image.userSelected ? 'ring-4 ring-amber-500' : ''
            ]" @click="handleImageClick">

            <SelectionImageClient :image="image" :selection-id="selectionId"
                class="w-full h-full transition-all duration-300" :class="[
                    image.userSelected ? 'brightness-75' : ''
                ]" />

            <!-- Selection indicator overlay -->
            <div v-if="image.userSelected" class="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
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
                    @click.stop="showImageModal = true" />

                <!-- Non-interactive status for completed state -->
                <div v-if="!canInteract" class="px-2 py-1 bg-neutral-900/70 rounded-lg text-xs text-white">
                    {{ image.userSelected ? 'Sélectionnée' : 'Non sélectionnée' }}
                </div>
            </div>
        </div>
    </div>

    <!-- Image Preview Modal -->
    <UModal v-model:open="showImageModal">
        <template #header>
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                    <UIcon name="i-lucide-image" class="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 class="text-lg font-semibold">Aperçu de l'image</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        {{ image.userSelected ? 'Image sélectionnée' : 'Image non sélectionnée' }}
                    </p>
                </div>
            </div>
        </template>

        <template #body>
            <div class="space-y-4">
                <!-- Large image display -->
                <div class="relative bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                    <SelectionImageClient :image="image" :selection-id="selectionId" :full-size="true"
                        class="w-full h-auto max-h-[70vh] object-contain" />
                </div>

                <!-- Selection status and actions -->
                <div v-if="canInteract"
                    class="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div class="flex items-center gap-3">
                        <UIcon :name="image.userSelected ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                            :class="image.userSelected ? 'text-amber-500' : 'text-neutral-400'" class="w-5 h-5" />
                        <span class="text-sm font-medium">
                            <template v-if="image.userSelected">Cette image est sélectionnée</template>
                            <template v-else>Cette image n'est pas sélectionnée</template>
                        </span>
                    </div>

                    <UButton :color="image.userSelected ? 'warning' : 'warning'"
                        :variant="image.userSelected ? 'outline' : 'solid'" size="sm"
                        :icon="image.userSelected ? 'i-lucide-x' : 'i-lucide-check'" @click="handleToggleFromModal">
                        {{ image.userSelected ? 'Désélectionner' : 'Sélectionner' }}
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import type { SelectionImageWithSelection } from '~/types/selection'

interface Props {
    image: SelectionImageWithSelection
    selectionId: string
    canInteract: boolean
}

interface Emits {
    'toggle-selection': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Modal state
const showImageModal = ref(false)

// Handle image click for selection
const handleImageClick = () => {
    if (props.canInteract) {
        emit('toggle-selection')
    }
}

// Handle toggle from modal
const handleToggleFromModal = () => {
    emit('toggle-selection')
}
</script>

<style scoped>
/* Additional styles if needed */
</style>