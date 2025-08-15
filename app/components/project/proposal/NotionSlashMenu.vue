<template>
    <div v-if="isVisible"
        class="fixed z-50 w-64 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
        :style="{
            left: position.x + 'px',
            top: position.y + 'px'
        }">
        <div class="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 font-medium">
            BLOCS DE BASE
        </div>
        <div class="space-y-1">
            <div v-for="blockType in blockTypes" :key="blockType.id"
                class="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                @click="$emit('select', blockType)">
                <div class="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                    <UIcon :name="blockType.icon" class="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {{ blockType.label }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ blockType.description }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { BlockType } from '~/composables/proposals/useNotionBlocks';

interface Props {
    isVisible: boolean
    position: { x: number; y: number }
    blockTypes: BlockType[]
}

interface Emits {
    (e: 'select', blockType: BlockType): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
