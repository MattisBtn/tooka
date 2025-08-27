<template>
    <div ref="editorRoot" class="notion-editor">
        <!-- Blocs de contenu -->
        <div class="space-y-2">
            <div v-for="block in sortedBlocks" :key="block.id"
                class="group relative rounded-lg transition-all duration-200" :class="{
                    'bg-primary/5 dark:bg-primary/10': isSelected(block.id),
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800': !isSelected(block.id) && !readonly && !isDragging,
                    'opacity-50 scale-95 shadow-2xl': draggedBlockId === block.id && isDragging,
                    'bg-blue-50 dark:bg-blue-900/20': dragOverBlockId === block.id && isDragging && draggedBlockId !== block.id
                }">
                <!-- Indicateur de drop zone -->
                <div v-if="dragOverBlockId === block.id && isDragging && draggedBlockId !== block.id"
                    class="absolute inset-0 pointer-events-none">
                    <!-- Ligne de drop en haut -->
                    <div v-if="dragPosition === 'before'"
                        class="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full shadow-sm" />
                    <!-- Ligne de drop en bas -->
                    <div v-if="dragPosition === 'after'"
                        class="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full shadow-sm" />
                </div>
                <!-- Contenu du bloc -->
                <div class="relative min-h-[1.5rem]">
                    <!-- Actions flottantes (affichées quand sélectionné ou au hover pour les blocs non-texte avec contenu) -->
                    <div v-if="!readonly && (isSelected(block.id) || (block.type !== 'paragraph' && block.type !== 'heading1' && block.type !== 'heading2' && block.type !== 'heading3' && block.type !== 'bulletList' && block.type !== 'numberedList' && block.type !== 'quote' && block.type !== 'code' && block.type !== 'button' && block.type !== 'table' && block.content))"
                        class="absolute -top-3 right-0 z-30 flex items-center gap-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-1 py-0.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        @mousedown.prevent.stop>
                        <UButton icon="i-lucide-grip-vertical" size="xs" variant="ghost" color="neutral"
                            class="cursor-grab active:cursor-grabbing hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                            :class="{ 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400': draggedBlockId === block.id && isDragging }"
                            @mousedown.stop="startDrag(block.id, $event)" />
                        <UButton icon="i-lucide-plus" size="xs" variant="ghost" color="neutral"
                            @click.stop="openSlashMenuFor(block.id, $event)" />
                        <UButton icon="i-lucide-trash-2" size="xs" variant="ghost" color="error"
                            @click.stop="removeBlock(block.id)" />
                    </div>

                    <!-- Titre 1 -->
                    <div v-if="block.type === 'heading1'" class="relative">
                        <h1 :ref="(el) => _setBlockRef(block.id, el)" :data-block-id="block.id"
                            :contenteditable="!readonly" class="text-4xl font-bold outline-none focus:outline-none"
                            :class="{ 'cursor-text': !readonly }" :placeholder="getPlaceholder(block)"
                            @input="updateBlockContent(block.id, $event)" @keydown="handleKeydown($event, block)"
                            @focus="selectBlock(block.id)" @blur="deselectBlock" />
                    </div>

                    <!-- Titre 2 -->
                    <div v-else-if="block.type === 'heading2'" class="relative">
                        <h2 :ref="(el) => _setBlockRef(block.id, el)" :data-block-id="block.id"
                            :contenteditable="!readonly" class="text-3xl font-semibold outline-none focus:outline-none"
                            :class="{ 'cursor-text': !readonly }" :placeholder="getPlaceholder(block)"
                            @input="updateBlockContent(block.id, $event)" @keydown="handleKeydown($event, block)"
                            @focus="selectBlock(block.id)" @blur="deselectBlock" />
                    </div>

                    <!-- Titre 3 -->
                    <div v-else-if="block.type === 'heading3'" class="relative">
                        <h3 :ref="(el) => _setBlockRef(block.id, el)" :data-block-id="block.id"
                            :contenteditable="!readonly" class="text-2xl font-medium outline-none focus:outline-none"
                            :class="{ 'cursor-text': !readonly }" :placeholder="getPlaceholder(block)"
                            @input="updateBlockContent(block.id, $event)" @keydown="handleKeydown($event, block)"
                            @focus="selectBlock(block.id)" @blur="deselectBlock" />
                    </div>

                    <!-- Paragraphe -->
                    <div v-else-if="block.type === 'paragraph'" class="relative">
                        <p :ref="(el) => _setBlockRef(block.id, el)" :data-block-id="block.id"
                            :contenteditable="!readonly"
                            class="text-base leading-relaxed outline-none focus:outline-none"
                            :class="{ 'cursor-text': !readonly }" :placeholder="getPlaceholder(block)"
                            @input="updateBlockContent(block.id, $event)" @keydown="handleKeydown($event, block)"
                            @focus="selectBlock(block.id)" @blur="deselectBlock" />
                    </div>

                    <!-- Liste à puces -->
                    <div v-else-if="block.type === 'bulletList'" class="relative">
                        <ul :ref="(el) => _setBlockRef(block.id, el)" :data-block-id="block.id"
                            :contenteditable="!readonly"
                            class="list-disc list-inside space-y-1 outline-none focus:outline-none"
                            :class="{ 'cursor-text': !readonly }" :placeholder="getPlaceholder(block)"
                            @input="updateBlockContent(block.id, $event)" @keydown="handleKeydown($event, block)"
                            @focus="selectBlock(block.id)" @blur="deselectBlock" />
                    </div>

                    <!-- Liste numérotée -->
                    <div v-else-if="block.type === 'numberedList'" class="relative">
                        <ol :ref="(el) => _setBlockRef(block.id, el)" :data-block-id="block.id"
                            :contenteditable="!readonly"
                            class="list-decimal list-inside space-y-1 outline-none focus:outline-none"
                            :class="{ 'cursor-text': !readonly }" :placeholder="getPlaceholder(block)"
                            @input="updateBlockContent(block.id, $event)" @keydown="handleKeydown($event, block)"
                            @focus="selectBlock(block.id)" @blur="deselectBlock" />
                    </div>

                    <!-- Citation -->
                    <div v-else-if="block.type === 'quote'" class="relative">
                        <blockquote :ref="(el) => _setBlockRef(block.id, el)" :data-block-id="block.id"
                            :contenteditable="!readonly"
                            class="border-l-4 border-primary pl-4 italic outline-none focus:outline-none"
                            :class="{ 'cursor-text': !readonly }" :placeholder="getPlaceholder(block)"
                            @input="updateBlockContent(block.id, $event)" @keydown="handleKeydown($event, block)"
                            @focus="selectBlock(block.id)" @blur="deselectBlock" />
                    </div>

                    <!-- Code -->
                    <div v-else-if="block.type === 'code'" class="relative">
                        <pre :ref="(el) => _setBlockRef(block.id, el)" :data-block-id="block.id"
                            :contenteditable="!readonly"
                            class="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg font-mono text-sm outline-none focus:outline-none whitespace-pre-wrap"
                            :class="{ 'cursor-text': !readonly }" :placeholder="getPlaceholder(block)"
                            @input="updateBlockContent(block.id, $event)" @keydown="handleKeydown($event, block)"
                            @focus="selectBlock(block.id)" @blur="deselectBlock" />
                    </div>

                    <!-- Séparateur -->
                    <div v-else-if="block.type === 'divider'" class="relative cursor-pointer py-2" tabindex="0"
                        @click.stop="selectBlock(block.id)" @keydown.enter.prevent="createParagraphAfter(block.id)">
                        <hr class="my-2 border-neutral-300 dark:border-neutral-600">
                    </div>



                    <!-- Tableau -->
                    <div v-else-if="block.type === 'table'" class="relative">
                        <!-- Toolbar table -->
                        <div v-if="!readonly && isSelected(block.id)"
                            class="absolute -top-3 left-0 z-10 flex items-center gap-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-1 py-0.5 shadow-lg"
                            @mousedown.prevent.stop>
                            <UButton icon="i-lucide-plus-square" size="xs" variant="ghost" color="neutral"
                                @click.stop="addTableRow(block.id)" />
                            <UButton icon="i-lucide-plus" size="xs" variant="ghost" color="neutral"
                                @click.stop="addTableColumn(block.id)" />
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full border-collapse border border-neutral-300 dark:border-neutral-600">
                                <tbody :ref="(el) => _setBlockRef(block.id, el)" :data-block-id="block.id"
                                    :contenteditable="!readonly" class="outline-none focus:outline-none"
                                    :class="{ 'cursor-text': !readonly }" :placeholder="getPlaceholder(block)"
                                    @input="updateBlockContent(block.id, $event)"
                                    @keydown="handleKeydown($event, block)" @focus="selectBlock(block.id)"
                                    @blur="deselectBlock" />
                            </table>
                        </div>
                    </div>

                    <!-- Callout -->
                    <div v-else-if="block.type === 'callout'" class="relative">
                        <div
                            class="flex items-start gap-3 p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                            <!-- Icône cliquable -->
                            <div class="flex-shrink-0">
                                <button v-if="!readonly"
                                    class="flex items-center justify-center w-5 h-5 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded transition-colors"
                                    @click="openIconSelector(block.id, $event)">
                                    <span v-if="getCalloutIconType(block.id) === 'emoji'" class="text-base">
                                        {{ getCalloutIcon(block.id) }}
                                    </span>
                                    <UIcon v-else :name="`i-lucide-${getCalloutIcon(block.id)}`" class="w-4 h-4" />
                                </button>
                                <div v-else class="flex items-center justify-center w-5 h-5">
                                    <span v-if="getCalloutIconType(block.id) === 'emoji'" class="text-base">
                                        {{ getCalloutIcon(block.id) }}
                                    </span>
                                    <UIcon v-else :name="`i-lucide-${getCalloutIcon(block.id)}`" class="w-4 h-4" />
                                </div>
                            </div>
                            <!-- Contenu éditable -->
                            <div :ref="(el) => _setBlockRef(block.id, el)" :data-block-id="block.id"
                                :contenteditable="!readonly"
                                class="flex-1 outline-none focus:outline-none text-sm leading-relaxed min-h-[1.5rem]"
                                :class="{ 'cursor-text': !readonly }" :placeholder="getPlaceholder(block)"
                                @input="updateBlockContent(block.id, $event)" @keydown="handleKeydown($event, block)"
                                @focus="selectBlock(block.id)" @blur="deselectBlock" />
                        </div>
                    </div>

                    <!-- Bouton -->
                    <div v-else-if="block.type === 'button'" class="relative">
                        <UButton color="primary" variant="solid">
                            <span :ref="(el) => _setBlockRef(block.id, el)" :data-block-id="block.id"
                                :contenteditable="!readonly" :placeholder="getPlaceholder(block)"
                                class="outline-none focus:outline-none" @input="updateButtonText(block.id, $event)"
                                @keydown="handleKeydown($event, block)" @focus="selectBlock(block.id)"
                                @blur="deselectBlock" />
                        </UButton>
                    </div>

                    <!-- Image -->
                    <div v-else-if="block.type === 'image'" class="relative">
                        <NotionImageBlock :block-id="block.id" :image-url="block.content"
                            :metadata="block.metadata as ImageBlockMetadata" :readonly="readonly"
                            :is-selected="isSelected(block.id)" @update="updateImageBlock(block.id, $event)"
                            @delete="removeBlock(block.id)" />
                    </div>

                    <!-- Video -->
                    <div v-else-if="block.type === 'video'" class="relative">
                        <NotionVideoBlock :block-id="block.id" :video-url="block.content"
                            :metadata="block.metadata as VideoBlockMetadata" :readonly="readonly"
                            :is-selected="isSelected(block.id)" @update="updateVideoBlock(block.id, $event)"
                            @delete="removeBlock(block.id)" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Slash Menu -->
        <SlashMenu :is-open="slashMenuOpen" :position="slashMenuPosition" :commands="filteredCommands"
            :selected-index="slashMenuSelectedIndex" @select="handleSlashCommand" @close="closeSlashMenu"
            @update:selected-index="slashMenuSelectedIndex = $event" />

        <!-- Icon Selector Menu -->
        <IconSelectorMenu :is-open="iconSelectorOpen" :position="iconSelectorPosition" @select="handleIconSelect"
            @close="closeIconSelector" />

        <!-- Floating Format Menu (selection) -->
        <div v-if="showFormatMenu"
            class="fixed z-50 bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-lg p-2 flex items-center gap-1"
            :style="{ left: formatMenuPos.x + 'px', top: formatMenuPos.y + 'px', transform: 'translateX(-50%)' }">
            <UButton icon="i-lucide-bold" size="xs" variant="ghost" @click="applyFormat('bold')" />
            <UButton icon="i-lucide-italic" size="xs" variant="ghost" @click="applyFormat('italic')" />
            <UButton icon="i-lucide-underline" size="xs" variant="ghost" @click="applyFormat('underline')" />
            <USeparator orientation="vertical" class="h-4" />
            <UButton icon="i-lucide-align-left" size="xs" variant="ghost" @click="applyAlign('left')" />
            <UButton icon="i-lucide-align-center" size="xs" variant="ghost" @click="applyAlign('center')" />
            <UButton icon="i-lucide-align-right" size="xs" variant="ghost" @click="applyAlign('right')" />
        </div>



        <!-- Placeholder quand aucun bloc -->
        <div v-if="blocks.length === 0" class="text-center py-8 text-neutral-500 dark:text-neutral-400">
            Commencez à taper "/" pour ajouter du contenu...
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { ComponentPublicInstance } from 'vue';
import { useNotionEditor } from '~/composables/useNotionEditor';
import type { ImageBlockMetadata, NotionBlock, SlashCommand, VideoBlockMetadata } from '~/types/notion';
import IconSelectorMenu from './IconSelectorMenu.vue';
import NotionImageBlock from './NotionImageBlock.vue';
import NotionVideoBlock from './NotionVideoBlock.vue';
import SlashMenu from './SlashMenu.vue';

interface Props {
    modelValue?: NotionBlock[];
    readonly?: boolean;
}

interface Emits {
    (e: 'update:modelValue', value: NotionBlock[]): void;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    readonly: false
});

const emit = defineEmits<Emits>();

// Éditeur
const editor = useNotionEditor();

// Références aux blocs
const blockRefs = ref<Record<string, HTMLElement>>({});
const _setBlockRef = (id: string, el: Element | ComponentPublicInstance | null) => {
    const domCandidate: Element | null = (el && (el as ComponentPublicInstance).$el)
        ? ((el as ComponentPublicInstance).$el as Element)
        : (el as Element | null);
    if (domCandidate instanceof HTMLElement) blockRefs.value[id] = domCandidate;
};

// État du slash menu
const slashMenuSelectedIndex = ref(0);

// État du icon selector
const iconSelectorOpen = ref(false);
const iconSelectorPosition = ref<{ x: number; y: number } | null>(null);
const iconSelectorBlockId = ref<string | null>(null);

// Pour gérer la double frappe Enter dans les callouts
const lastEnterTime = ref<Record<string, number>>({});

// Initialiser l'éditeur
onMounted(() => {
    editor.initialize(props.modelValue);
});

// Surveiller les changements et émettre
watch(() => editor.blocks.value, (blocks) => {
    emit('update:modelValue', [...blocks]);
}, { deep: true });

// Computed
const blocks = computed(() => editor.blocks.value);
const sortedBlocks = computed(() => [...blocks.value].sort((a, b) => a.order - b.order));
const slashMenuOpen = computed(() => editor.slashMenuOpen.value);
const slashMenuPosition = computed(() => editor.slashMenuPosition.value);
const filteredCommands = computed(() => editor.filteredCommands.value);

// Sélection menu de format
const showFormatMenu = ref(false);
const formatMenuPos = ref<{ x: number; y: number }>({ x: 0, y: 0 });
const editorRoot = ref<HTMLElement | null>(null);

// Méthodes
const isSelected = (blockId: string) => editor.selectedBlockId.value === blockId;
const selectBlock = (blockId: string) => editor.selectBlock(blockId);
const deselectBlock = () => editor.deselectBlock();

const updateBlockContent = (blockId: string, event: Event) => {
    const target = event.target as HTMLElement;
    const container = blockRefs.value[blockId];
    if (container) {
        const tag = container.tagName.toLowerCase();
        if (tag === 'ul' || tag === 'ol') {
            const items = Array.from(container.querySelectorAll('li')).map(li => (li.textContent || '').trim());
            editor.updateBlock(blockId, { content: items.join('\n') });
            return;
        }
        if (tag === 'tbody') {
            editor.updateBlock(blockId, { content: container.innerHTML });
            return;
        }
        if (tag === 'span' && container.getAttribute('data-block-id') === blockId) {
            editor.updateBlock(blockId, { content: container.innerText });
            return;
        }
    }
    editor.updateBlock(blockId, { content: target.innerHTML });
};

const updateButtonText = (blockId: string, event: Event) => {
    const target = event.target as HTMLElement;
    editor.updateBlock(blockId, { content: target.innerText });
};

const updateImageBlock = (blockId: string, data: { content: string; metadata: ImageBlockMetadata }) => {
    editor.updateBlock(blockId, data);
};

const updateVideoBlock = (blockId: string, data: { content: string; metadata: VideoBlockMetadata }) => {
    editor.updateBlock(blockId, data);
};

const removeBlock = (blockId: string) => {
    editor.removeBlock(blockId);
};

const closeSlashMenu = () => {
    editor.closeSlashMenu();
};

const handleSlashCommand = (command: SlashCommand) => {
    const newBlock = editor.selectSlashCommand(command);
    nextTick(() => {
        const el = blockRefs.value[newBlock.id];
        if (!el) return;
        if (newBlock.type === 'bulletList' || newBlock.type === 'numberedList') {
            el.innerHTML = '<li></li>';
        } else if (newBlock.type === 'table') {
            initTable(newBlock.id, 3, 2);
        } else if (newBlock.type === 'button') {
            el.textContent = newBlock.content || '';
        } else if (newBlock.type === 'callout') {
            // Initialiser avec une icône par défaut si pas de metadata
            if (!newBlock.metadata?.icon) {
                editor.updateBlock(newBlock.id, {
                    metadata: { icon: '💡', iconType: 'emoji' }
                });
            }
            el.innerHTML = newBlock.content || '';
        } else if (newBlock.type === 'video') {
            // Pas besoin d'initialiser le DOM pour les vidéos, le composant s'en charge
            return;
        } else {
            el.innerHTML = newBlock.content || '';
        }
        el.focus();
        setCaretToEnd(el);
    });
};



// Gestion des touches clavier (Enter logique par type)
const handleKeydown = (event: KeyboardEvent, block: NotionBlock) => {
    if (event.key === '/' && !props.readonly) {
        event.preventDefault();
        const target = event.target as HTMLElement;
        const rect = target.getBoundingClientRect();
        editor.openSlashMenu({ x: rect.left, y: rect.bottom + 5 }, '');
        return;
    }

    if (!props.readonly && (block.type === 'bulletList' || block.type === 'numberedList')) {
        if (event.key === 'Enter' && event.shiftKey) {
            event.preventDefault();
            document.execCommand('insertHTML', false, '<br>');
            return;
        }
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleListEnter(block);
            return;
        }
    }

    if (event.key === 'Enter' && !event.shiftKey && !props.readonly) {
        // Citation: nouvelle ligne
        if (block.type === 'quote') {
            event.preventDefault();
            document.execCommand('insertHTML', false, '<br>');
            return;
        }
        // Code: autoriser nouvelle ligne
        if (block.type === 'code') {
            return;
        }
        // Callout: première entrée = nouvelle ligne, seconde entrée consécutive = nouveau paragraphe
        if (block.type === 'callout') {
            event.preventDefault();
            const target = event.target as HTMLElement;
            const currentTime = Date.now();
            const lastTime = lastEnterTime.value[block.id] || 0;
            const timeDiff = currentTime - lastTime;

            // Si deux Enter rapprochés (moins de 500ms) ET qu'on est dans une zone vide, créer un nouveau paragraphe
            if (timeDiff < 500) {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    // Vérifier si on est sur une ligne vide (après un <br>)
                    const beforeCursor = target.innerHTML.substring(0, range.startOffset);

                    if (target.innerHTML.endsWith('<br>') || beforeCursor.endsWith('<br>')) {
                        const newBlock = editor.addBlock('paragraph', block.id);
                        nextTick(() => {
                            const el = blockRefs.value[newBlock.id];
                            if (el) { el.focus(); setCaretToEnd(el); }
                        });
                        // Reset le timer
                        lastEnterTime.value[block.id] = 0;
                        return;
                    }
                }
            }

            // Enregistrer le temps de cette frappe
            lastEnterTime.value[block.id] = currentTime;

            // Ajouter une nouvelle ligne et positionner le curseur
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);

                // Créer et insérer le <br>
                const br = document.createElement('br');
                range.deleteContents();
                range.insertNode(br);

                // Créer un nouveau range après le <br>
                const newRange = document.createRange();
                newRange.setStartAfter(br);
                newRange.collapse(true);

                // Appliquer la nouvelle sélection
                selection.removeAllRanges();
                selection.addRange(newRange);
            }
            return;
        }
        // Divider: créer un paragraphe sous le séparateur
        if (block.type === 'divider') {
            event.preventDefault();
            createParagraphAfter(block.id);
            return;
        }
        // Autres: nouveau paragraphe
        event.preventDefault();
        const newBlock = editor.addBlock('paragraph', block.id);
        nextTick(() => {
            const el = blockRefs.value[newBlock.id];
            if (el) { el.focus(); setCaretToEnd(el); }
        });
        return;
    }

    // Navigation entre blocs (Ctrl + flèches)
    if (event.ctrlKey && event.key === 'ArrowUp') {
        event.preventDefault();
        const idx = blocks.value.findIndex(b => b.id === block.id);
        if (idx > 0) {
            const prevId = blocks.value[idx - 1]?.id;
            const prev = prevId ? blockRefs.value[prevId] : undefined;
            if (prev) prev.focus();
        }
        return;
    }
    if (event.ctrlKey && event.key === 'ArrowDown') {
        event.preventDefault();
        const idx = blocks.value.findIndex(b => b.id === block.id);
        if (idx < blocks.value.length - 1) {
            const nextId = blocks.value[idx + 1]?.id;
            const next = nextId ? blockRefs.value[nextId] : undefined;
            if (next) next.focus();
        }
        return;
    }

    // Supprimer bloc si vide
    if (event.key === 'Backspace' && !block.content && blocks.value.length > 1 && !props.readonly) {
        event.preventDefault();
        const idx = blocks.value.findIndex(b => b.id === block.id);
        const prevId = idx > 0 ? blocks.value[idx - 1]?.id : undefined;
        const prev = prevId ? blockRefs.value[prevId] : null;
        editor.removeBlock(block.id);
        nextTick(() => { if (prev) { prev.focus(); setCaretToEnd(prev); } });
        return;
    }
};

// Drag and drop
const draggedBlockId = ref<string | null>(null);
const dragOverBlockId = ref<string | null>(null);
const dragPosition = ref<'before' | 'after' | null>(null);
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

const startDrag = (blockId: string, event: MouseEvent) => {
    if (props.readonly) return;

    event.preventDefault();
    event.stopPropagation();

    isDragging.value = true;
    draggedBlockId.value = blockId;

    // Calculer l'offset pour maintenir la position relative du curseur
    const blockElement = blockRefs.value[blockId];
    if (blockElement) {
        const rect = blockElement.getBoundingClientRect();
        dragOffset.value = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    // Ajouter les event listeners pour le drag
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    // Empêcher la sélection de texte pendant le drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
};

const handleDragMove = (event: MouseEvent) => {
    if (!isDragging.value || !draggedBlockId.value) return;

    // Trouver le bloc sous le curseur
    const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
    if (!elementBelow) return;

    const blockElement = elementBelow.closest('[data-block-id]') as HTMLElement;
    if (blockElement && blockElement.dataset.blockId) {
        const newBlockId = blockElement.dataset.blockId;
        if (newBlockId !== draggedBlockId.value) {
            // Déterminer si on est au-dessus ou en-dessous du centre du bloc
            const rect = blockElement.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const position = event.clientY < centerY ? 'before' : 'after';

            dragOverBlockId.value = newBlockId;
            dragPosition.value = position;
        }
    } else {
        dragOverBlockId.value = null;
        dragPosition.value = null;
    }
};

const handleDragEnd = () => {
    if (!isDragging.value || !draggedBlockId.value) return;

    // Effectuer le déplacement si on a un bloc de destination
    if (dragOverBlockId.value && draggedBlockId.value !== dragOverBlockId.value) {
        moveBlock(draggedBlockId.value, dragOverBlockId.value, dragPosition.value);
    }
    // Si on n'a pas de destination, on peut soit annuler soit placer à la fin
    // Pour l'instant, on annule simplement le drag

    // Nettoyer
    isDragging.value = false;
    draggedBlockId.value = null;
    dragOverBlockId.value = null;
    dragPosition.value = null;
    dragOffset.value = { x: 0, y: 0 };

    // Restaurer les styles
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    // Retirer les event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
};

const moveBlock = (fromBlockId: string, toBlockId: string, position: 'before' | 'after' | null) => {
    const fromIndex = blocks.value.findIndex(b => b.id === fromBlockId);
    const toIndex = blocks.value.findIndex(b => b.id === toBlockId);

    if (fromIndex === -1 || toIndex === -1) return;

    // Calculer la position finale en tenant compte de la position (before/after)
    let targetIndex = toIndex;
    if (position === 'after') {
        targetIndex = toIndex + 1;
    }

    // Ajuster si le bloc source est avant la destination
    if (fromIndex < targetIndex) {
        targetIndex--;
    }

    // Utiliser la méthode moveBlock du composable pour déplacer progressivement
    if (fromIndex < targetIndex) {
        // Déplacer vers le bas
        for (let i = 0; i < targetIndex - fromIndex; i++) {
            editor.moveBlock(fromBlockId, 'down');
        }
    } else if (fromIndex > targetIndex) {
        // Déplacer vers le haut
        for (let i = 0; i < fromIndex - targetIndex; i++) {
            editor.moveBlock(fromBlockId, 'up');
        }
    }
};

// Ouvrir le slash menu depuis le bouton +
const openSlashMenuFor = (blockId: string, event: MouseEvent) => {
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    editor.selectBlock(blockId);
    editor.openSlashMenu({ x: rect.left, y: rect.bottom + 6 }, '');
    slashMenuSelectedIndex.value = 0;
};

// Place le caret à la fin
const setCaretToEnd = (element: HTMLElement) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
};

// Placeholders
const getPlaceholder = (block: NotionBlock) => {
    switch (block.type) {
        case 'heading1': return 'Titre principal';
        case 'heading2': return 'Sous-titre';
        case 'heading3': return 'Titre de section';
        case 'paragraph': return 'Tapez \'/\' pour insérer un bloc';
        case 'bulletList': return 'Liste à puces';
        case 'numberedList': return 'Liste numérotée';
        case 'quote': return 'Citation';
        case 'code': return 'Collez ou tapez du code';
        case 'table': return 'Collez un tableau (CSV) ou éditez les cellules';
        case 'button': return 'Texte du bouton';
        case 'callout': return 'Tapez votre message...';
        case 'image': return 'Cliquez pour ajouter une image';
        case 'video': return 'Cliquez pour ajouter une vidéo';
        default: return '';
    }
};

// Méthodes pour le callout
const getCalloutIcon = (blockId: string): string => {
    const block = editor.blocks.value.find(b => b.id === blockId);
    return (block?.metadata?.icon as string) || '💡';
};

const getCalloutIconType = (blockId: string): 'emoji' | 'lucide' => {
    const block = editor.blocks.value.find(b => b.id === blockId);
    return (block?.metadata?.iconType as 'emoji' | 'lucide') || 'emoji';
};

const openIconSelector = (blockId: string, event: MouseEvent) => {
    console.log('openIconSelector called', blockId, event);
    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    iconSelectorBlockId.value = blockId;
    iconSelectorPosition.value = { x: rect.left, y: rect.bottom + 5 };
    iconSelectorOpen.value = true;

    console.log('iconSelectorOpen set to', iconSelectorOpen.value);
    console.log('iconSelectorPosition set to', iconSelectorPosition.value);
};

const closeIconSelector = () => {
    iconSelectorOpen.value = false;
    iconSelectorPosition.value = null;
    iconSelectorBlockId.value = null;
};

const handleIconSelect = (icon: string, type: 'emoji' | 'lucide') => {
    if (iconSelectorBlockId.value) {
        const block = editor.blocks.value.find(b => b.id === iconSelectorBlockId.value);
        const currentMetadata = block?.metadata || {};
        editor.updateBlock(iconSelectorBlockId.value, {
            metadata: {
                ...currentMetadata,
                icon,
                iconType: type
            }
        });
    }
    closeIconSelector();
};

// Synchroniser le DOM initial (listes -> <li>, button text)
onMounted(() => {
    nextTick(() => {
        blocks.value.forEach(b => {
            const el = blockRefs.value[b.id];
            if (!el) return;
            if (b.type === 'bulletList' || b.type === 'numberedList') {
                const items = (b.content || '').split('\n').filter(Boolean);
                el.innerHTML = items.map(t => `<li>${t}</li>`).join('') || '<li></li>';
            } else if (b.type === 'table') {
                if (!b.content) initTable(b.id, 3, 2); else el.innerHTML = b.content;
            } else if (b.type === 'button') {
                el.textContent = b.content || '';
            } else if (b.type === 'callout') {
                // Initialiser avec une icône par défaut si pas de metadata
                if (!b.metadata?.icon) {
                    editor.updateBlock(b.id, {
                        metadata: { icon: '💡', iconType: 'emoji' }
                    });
                }
                el.innerHTML = b.content || '';
            } else {
                el.innerHTML = b.content || '';
            }
        });
    });
});

// Sélection: toolbar de formattage
const isNodeInsideEditor = (node: Node | null) => {
    if (!node || !editorRoot.value) return false;
    const container = node.nodeType === 3 ? (node.parentElement as HTMLElement | null) : (node as HTMLElement | null);
    return !!container && editorRoot.value.contains(container);
};
const handleSelectionChange = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { showFormatMenu.value = false; return; }
    const anchor = sel.anchorNode;
    if (!isNodeInsideEditor(anchor)) { showFormatMenu.value = false; return; }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    formatMenuPos.value = { x: rect.left + rect.width / 2, y: Math.max(0, rect.top - 40) };
    showFormatMenu.value = true;
};

onMounted(() => { document.addEventListener('selectionchange', handleSelectionChange); });
onUnmounted(() => {
    document.removeEventListener('selectionchange', handleSelectionChange);
    // Nettoyer les event listeners de drag si le composant est démonté pendant un drag
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
});

// Actions format
const applyFormat = (cmd: 'bold' | 'italic' | 'underline') => { document.execCommand(cmd); };
const applyAlign = (align: 'left' | 'center' | 'right') => {
    const sel = window.getSelection();
    const anchor = sel?.anchorNode as Node | null;
    if (!anchor) return;
    let el = (anchor.nodeType === 3 ? (anchor.parentElement) : (anchor as HTMLElement)) as HTMLElement | null;
    while (el && !el.getAttribute('data-block-id')) el = el.parentElement;
    if (el) el.style.textAlign = align;
};

// Table helpers
const initTable = (blockId: string, rows: number, cols: number) => {
    const tbody = blockRefs.value[blockId];
    if (!tbody) return;
    let html = '';
    for (let r = 0; r < rows; r++) {
        html += '<tr>' + Array.from({ length: cols }).map(() => '<td class="p-2 border border-neutral-300 dark:border-neutral-700">&nbsp;</td>').join('') + '</tr>';
    }
    tbody.innerHTML = html;
    editor.updateBlock(blockId, { content: tbody.innerHTML });
};
const addTableRow = (blockId: string) => {
    const tbody = blockRefs.value[blockId];
    if (!tbody) return;
    const firstRow = tbody.querySelector('tr');
    const cols = firstRow ? (firstRow.querySelectorAll('td,th').length || 2) : 2;
    const tr = document.createElement('tr');
    tr.innerHTML = Array.from({ length: cols }).map(() => '<td class="p-2 border border-neutral-300 dark:border-neutral-700">&nbsp;</td>').join('');
    tbody.appendChild(tr);
    editor.updateBlock(blockId, { content: tbody.innerHTML });
};
const addTableColumn = (blockId: string) => {
    const tbody = blockRefs.value[blockId];
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr')) as HTMLTableRowElement[];
    rows.forEach((row) => {
        const td = document.createElement('td');
        td.className = 'p-2 border border-neutral-300 dark:border-neutral-700';
        td.innerHTML = '&nbsp;';
        row.appendChild(td);
    });
    editor.updateBlock(blockId, { content: tbody.innerHTML });
};

// Inserer un élément de liste
const insertListItem = (block: NotionBlock) => {
    const el = blockRefs.value[block.id];
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    let li: Node | null = range.startContainer;
    while (li && (li as HTMLElement).tagName?.toLowerCase() !== 'li') li = li.parentNode as Node | null;
    const newLi = document.createElement('li');
    newLi.innerHTML = '';
    if (li && li.parentNode) {
        li.parentNode.insertBefore(newLi, (li as HTMLElement).nextSibling);
    } else {
        el.appendChild(newLi);
    }
    const newRange = document.createRange();
    newRange.selectNodeContents(newLi);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    const items = Array.from(el.querySelectorAll('li')).map(n => (n.textContent || '').trim());
    editor.updateBlock(block.id, { content: items.join('\n') });
};

// Entrée dans une liste: comportement logique
const handleListEnter = (block: NotionBlock) => {
    const el = blockRefs.value[block.id];
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { insertListItem(block); return; }
    const range = sel.getRangeAt(0);
    let li: HTMLElement | null = (range.startContainer as HTMLElement);
    while (li && li.tagName?.toLowerCase() !== 'li') li = li.parentElement;
    const isEmpty = !li || !(li.textContent || '').trim();

    if (!isEmpty) {
        insertListItem(block);
        return;
    }

    // Li vide -> sortir de la liste (nouveau paragraphe)
    if (li && li.parentNode) li.parentNode.removeChild(li);
    const remaining = Array.from(el.querySelectorAll('li')).map(n => (n.textContent || '').trim()).filter(Boolean);

    if (remaining.length === 0) {
        editor.updateBlock(block.id, { type: 'paragraph', content: '' } as Partial<NotionBlock>);
    } else {
        editor.updateBlock(block.id, { content: remaining.join('\n') });
    }
    const newBlock = editor.addBlock('paragraph', block.id);
    nextTick(() => {
        const p = blockRefs.value[newBlock.id];
        if (p) { p.focus(); setCaretToEnd(p); }
    });
};

const createParagraphAfter = (blockId: string) => {
    const newBlock = editor.addBlock('paragraph', blockId);
    nextTick(() => {
        const el = blockRefs.value[newBlock.id];
        if (el) { el.focus(); setCaretToEnd(el); }
    });
};


</script>

<style scoped>
.notion-editor {
    position: relative;
}

.notion-editor [contenteditable]:empty::before {
    content: attr(placeholder);
    color: #9ca3af;
    pointer-events: none;
}

.notion-editor [contenteditable]:focus {
    outline: none;
}

.notion-editor [contenteditable]:focus::before {
    display: none;
}
</style>
