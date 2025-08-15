<template>
    <div v-if="isVisible"
        class="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1"
        :style="{
            left: (position.x - 100) + 'px',
            top: position.y + 'px'
        }">
        <div class="flex items-center gap-1">
            <UButton icon="i-lucide-bold" size="xs" variant="ghost" color="neutral" :class="[
                'w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-700',
                { 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400': isFormatActive('bold') }
            ]" @click="$emit('format', 'bold')" />
            <UButton icon="i-lucide-italic" size="xs" variant="ghost" color="neutral" :class="[
                'w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-700',
                { 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400': isFormatActive('italic') }
            ]" @click="$emit('format', 'italic')" />
            <UButton icon="i-lucide-underline" size="xs" variant="ghost" color="neutral" :class="[
                'w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-700',
                { 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400': isFormatActive('underline') }
            ]" @click="$emit('format', 'underline')" />
            <UButton icon="i-lucide-strikethrough" size="xs" variant="ghost" color="neutral" :class="[
                'w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-700',
                { 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400': isFormatActive('strikethrough') }
            ]" @click="$emit('format', 'strikethrough')" />
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    isVisible: boolean
    position: { x: number; y: number }
    isFormatActive: (format: string) => boolean
}

interface Emits {
    (e: 'format', format: 'bold' | 'italic' | 'underline' | 'strikethrough'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
