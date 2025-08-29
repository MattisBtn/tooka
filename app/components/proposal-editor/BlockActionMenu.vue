<template>
    <div v-if="shouldShow"
        class="absolute -top-3 right-0 z-30 flex items-center gap-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-1 py-0.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
        @mousedown.prevent.stop>
        <UButton icon="i-lucide-grip-vertical" size="xs" variant="ghost" color="neutral"
            class="cursor-grab active:cursor-grabbing hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            :class="{ 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400': isDragging }"
            @mousedown.stop="$emit('drag', $event)" />
        <UButton icon="i-lucide-plus" size="xs" variant="ghost" color="neutral" @click.stop="$emit('add', $event)" />
        <UButton icon="i-lucide-trash-2" size="xs" variant="ghost" color="error"
            @click.stop="$emit('remove', $event)" />
    </div>
</template>

<script lang="ts" setup>
interface Props {
    readonly?: boolean;
    isSelected?: boolean;
    blockType: string;
    hasContent?: boolean;
    isDragging?: boolean;
}

interface Emits {
    (e: 'drag' | 'add' | 'remove', event: MouseEvent): void;
}

const props = withDefaults(defineProps<Props>(), {
    readonly: false,
    isSelected: false,
    hasContent: false,
    isDragging: false
});

defineEmits<Emits>();

// Types de blocs qui ne doivent pas avoir d'actions flottantes
const textBlockTypes = [
    'paragraph',
    'heading1',
    'heading2',
    'heading3',
    'bulletList',
    'numberedList',
    'quote',
    'code',
    // 'button',
    'table'
];

// Afficher les actions si :
// 1. Pas en mode readonly
// 2. Bloc sélectionné OU (bloc non-texte ET avec contenu)
const shouldShow = computed(() => {
    if (props.readonly) return false;

    if (props.isSelected) return true;

    const isTextBlock = textBlockTypes.includes(props.blockType);
    return !isTextBlock && props.hasContent;
});
</script>
