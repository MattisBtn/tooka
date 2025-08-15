<template>
    <div :data-block-id="block.id" class="group relative" @mouseenter="$emit('hover', block.id)"
        @mouseleave="$emit('hover', null)">
        <!-- Actions hover à gauche -->
        <div v-if="isHovered && block.type !== 'divider'"
            class="absolute left-0 top-0 -ml-12 flex flex-col gap-1 opacity-100 transition-opacity z-10">
            <!-- Bouton + pour ajouter un bloc -->
            <UButton icon="i-lucide-plus" size="xs" variant="ghost" color="neutral"
                class="w-6 h-6 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                @click="$emit('showAddMenu', block.id, $event)" />

            <!-- Handle de drag (pour plus tard) -->
            <UButton icon="i-lucide-grip-vertical" size="xs" variant="ghost" color="neutral"
                class="w-6 h-6 rounded cursor-grab hover:bg-gray-100 dark:hover:bg-gray-800" />
        </div>

        <!-- Contenu du bloc -->
        <div class="block-content">
            <!-- Bloc Text -->
            <div v-if="block.type === 'text'" class="min-h-[1.5rem] p-1 rounded transition-colors"
                :class="{ 'bg-gray-50 dark:bg-gray-900': isFocused }">
                <div :ref="(el) => setBlockRef(block.id, el as HTMLElement | null)" contenteditable
                    class="outline-none w-full text-base text-gray-900 dark:text-gray-100 leading-relaxed"
                    :class="{ 'empty': block.content === '' }"
                    :data-placeholder="block.content === '' ? 'Tapez \'/\' pour voir les commandes ou commencez à écrire...' : ''"
                    @input="$emit('input', $event, block.id)" @focus="$emit('focus', block.id)"
                    @keydown="$emit('keydown', $event, block.id)"
                    @mouseup="$emit('textSelection', block.id, $event.target as HTMLElement)"
                    @keyup="$emit('textSelection', block.id, $event.target as HTMLElement)"
                    v-html="block.htmlContent || block.content" />
            </div>

            <!-- Bloc H1 -->
            <div v-else-if="block.type === 'h1'" class="min-h-[2rem] p-1 rounded transition-colors"
                :class="{ 'bg-gray-50 dark:bg-gray-900': isFocused }">
                <div :ref="(el) => setBlockRef(block.id, el as HTMLElement | null)" contenteditable
                    class="outline-none w-full text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight"
                    :class="{ 'empty': block.content === '' }"
                    :data-placeholder="block.content === '' ? 'Titre principal' : ''"
                    @input="$emit('input', $event, block.id)" @focus="$emit('focus', block.id)"
                    @keydown="$emit('keydown', $event, block.id)"
                    @mouseup="$emit('textSelection', block.id, $event.target as HTMLElement)"
                    @keyup="$emit('textSelection', block.id, $event.target as HTMLElement)"
                    v-html="block.htmlContent || block.content" />
            </div>

            <!-- Bloc H2 -->
            <div v-else-if="block.type === 'h2'" class="min-h-[2rem] p-1 rounded transition-colors"
                :class="{ 'bg-gray-50 dark:bg-gray-900': isFocused }">
                <div :ref="(el) => setBlockRef(block.id, el as HTMLElement | null)" contenteditable
                    class="outline-none w-full text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-tight"
                    :class="{ 'empty': block.content === '' }"
                    :data-placeholder="block.content === '' ? 'Sous-titre' : ''"
                    @input="$emit('input', $event, block.id)" @focus="$emit('focus', block.id)"
                    @keydown="$emit('keydown', $event, block.id)"
                    @mouseup="$emit('textSelection', block.id, $event.target as HTMLElement)"
                    @keyup="$emit('textSelection', block.id, $event.target as HTMLElement)"
                    v-html="block.htmlContent || block.content" />
            </div>

            <!-- Bloc H3 -->
            <div v-else-if="block.type === 'h3'" class="min-h-[2rem] p-1 rounded transition-colors"
                :class="{ 'bg-gray-50 dark:bg-gray-900': isFocused }">
                <div :ref="(el) => setBlockRef(block.id, el as HTMLElement | null)" contenteditable
                    class="outline-none w-full text-xl font-medium text-gray-900 dark:text-gray-100 leading-tight"
                    :class="{ 'empty': block.content === '' }"
                    :data-placeholder="block.content === '' ? 'Titre de section' : ''"
                    @input="$emit('input', $event, block.id)" @focus="$emit('focus', block.id)"
                    @keydown="$emit('keydown', $event, block.id)"
                    @mouseup="$emit('textSelection', block.id, $event.target as HTMLElement)"
                    @keyup="$emit('textSelection', block.id, $event.target as HTMLElement)"
                    v-html="block.htmlContent || block.content" />
            </div>

            <!-- Bloc Liste à puces -->
            <div v-else-if="block.type === 'bulleted-list'" class="min-h-[1.5rem] p-1 rounded transition-colors"
                :class="{ 'bg-gray-50 dark:bg-gray-900': isFocused }">
                <div class="flex items-start gap-2">
                    <span class="text-gray-500 flex-shrink-0 mt-0.5 min-w-[1rem]">•</span>
                    <div :ref="(el) => setBlockRef(block.id, el as HTMLElement | null)" contenteditable
                        class="outline-none w-full text-base text-gray-900 dark:text-gray-100 leading-relaxed flex-1"
                        :class="{ 'empty': block.content === '' }"
                        :data-placeholder="block.content === '' ? 'Élément de liste' : ''"
                        @input="$emit('input', $event, block.id)" @focus="$emit('focus', block.id)"
                        @keydown="$emit('keydown', $event, block.id)"
                        @mouseup="$emit('textSelection', block.id, $event.target as HTMLElement)"
                        @keyup="$emit('textSelection', block.id, $event.target as HTMLElement)"
                        v-html="block.htmlContent || block.content" />
                </div>
            </div>

            <!-- Bloc Liste numérotée -->
            <div v-else-if="block.type === 'numbered-list'" class="min-h-[1.5rem] p-1 rounded transition-colors"
                :class="{ 'bg-gray-50 dark:bg-gray-900': isFocused }">
                <div class="flex items-start gap-2">
                    <span class="text-gray-500 flex-shrink-0 mt-0.5 min-w-[1rem]">{{ numberedIndex }}.</span>
                    <div :ref="(el) => setBlockRef(block.id, el as HTMLElement | null)" contenteditable
                        class="outline-none w-full text-base text-gray-900 dark:text-gray-100 leading-relaxed flex-1"
                        :class="{ 'empty': block.content === '' }"
                        :data-placeholder="block.content === '' ? 'Élément numéroté' : ''"
                        @input="$emit('input', $event, block.id)" @focus="$emit('focus', block.id)"
                        @keydown="$emit('keydown', $event, block.id)"
                        @mouseup="$emit('textSelection', block.id, $event.target as HTMLElement)"
                        @keyup="$emit('textSelection', block.id, $event.target as HTMLElement)"
                        v-html="block.htmlContent || block.content" />
                </div>
            </div>

            <!-- Bloc Divider -->
            <div v-else-if="block.type === 'divider'"
                class="min-h-[1rem] p-1 rounded transition-colors flex items-center"
                :class="{ 'bg-gray-50 dark:bg-gray-900': isFocused }" tabindex="0" @click="$emit('focus', block.id)"
                @keydown="$emit('keydown', $event, block.id)">
                <USeparator class="flex-1" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { NotionBlock } from '~/composables/proposals/useNotionBlocks'

interface Props {
    block: NotionBlock
    isHovered: boolean
    isFocused: boolean
    numberedIndex: number
}

interface Emits {
    (e: 'hover', blockId: string | null): void
    (e: 'showAddMenu', blockId: string, event: MouseEvent): void
    (e: 'setBlockRef', blockId: string, el: HTMLElement | null): void
    (e: 'input', event: Event, blockId: string): void
    (e: 'focus', blockId: string): void
    (e: 'keydown', event: KeyboardEvent, blockId: string): void
    (e: 'textSelection', blockId: string, element: HTMLElement): void
}

const emit = defineEmits<Emits>()

defineProps<Props>()

const setBlockRef = (blockId: string, el: HTMLElement | null) => {
    emit('setBlockRef', blockId, el)
}
</script>

<style scoped>
/* Placeholders */
.empty:empty:before {
    content: attr(data-placeholder);
    color: rgb(156 163 175);
    pointer-events: none;
}

[contenteditable]:focus {
    outline: none;
}
</style>
