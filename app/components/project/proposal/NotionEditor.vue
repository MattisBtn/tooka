<template>
    <div ref="editorRoot" class="notion-editor">
        <!-- Blocs de contenu -->
        <div class="space-y-2">
            <div v-for="block in sortedBlocks" :key="block.id" class="group flex items-start gap-2"
                :class="{ 'ring-2 ring-primary ring-opacity-50 rounded-lg': isSelected(block.id) }">
                <!-- Actions (colonne fixe) -->
                <div
                    class="w-8 shrink-0 pt-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-start gap-1">
                    <UButton icon="i-lucide-grip-vertical" size="xs" variant="ghost" color="neutral"
                        class="cursor-grab active:cursor-grabbing" @mousedown="startDrag(block.id)" />
                    <UButton icon="i-lucide-plus" size="xs" variant="ghost" color="neutral"
                        @click="openSlashMenuFor(block.id, $event)" />
                    <UButton icon="i-lucide-trash-2" size="xs" variant="ghost" color="error"
                        @click="removeBlock(block.id)" />
                </div>

                <!-- Contenu du bloc -->
                <div class="relative flex-1 min-h-[1.5rem]">
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
                    <div v-else-if="block.type === 'divider'" class="relative">
                        <hr class="my-6 border-neutral-300 dark:border-neutral-600">
                    </div>

                    <!-- Image -->
                    <div v-else-if="block.type === 'image'" class="relative">
                        <div class="flex items-center gap-4">
                            <img :src="block.content" alt="" class="max-w-xs h-auto rounded-lg"
                                @error="handleImageError(block.id)">
                            <UInput v-if="!readonly" v-model="block.content" placeholder="URL de l'image..." size="sm"
                                class="flex-1" @input="updateBlockContent(block.id, $event)" />
                        </div>
                    </div>

                    <!-- Tableau -->
                    <div v-else-if="block.type === 'table'" class="relative">
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

                    <!-- Bouton -->
                    <div v-else-if="block.type === 'button'" class="relative">
                        <button
                            class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                            :disabled="!block.content">
                            {{ block.content || 'Texte du bouton' }}
                        </button>
                        <UInput v-if="!readonly" v-model="block.content" placeholder="Texte du bouton..." size="sm"
                            class="mt-2" @input="updateBlockContent(block.id, $event)" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Slash Menu -->
        <SlashMenu :is-open="slashMenuOpen" :position="slashMenuPosition" :commands="filteredCommands"
            :selected-index="slashMenuSelectedIndex" @select="handleSlashCommand" @close="closeSlashMenu"
            @update:selected-index="slashMenuSelectedIndex = $event" />

        <!-- Floating Format Menu (selection) -->
        <div v-if="showFormatMenu"
            class="fixed z-50 bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 shadow p-2 flex items-center gap-1"
            :style="{ left: formatMenuPos.x + 'px', top: formatMenuPos.y + 'px', transform: 'translateX(-50%)' }">
            <UButton icon="i-lucide-bold" size="xs" variant="ghost" @click="applyFormat('bold')" />
            <UButton icon="i-lucide-italic" size="xs" variant="ghost" @click="applyFormat('italic')" />
            <UButton icon="i-lucide-underline" size="xs" variant="ghost" @click="applyFormat('underline')" />
            <UDivider orientation="vertical" class="h-4" />
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
import type { NotionBlock, SlashCommand } from '~/types/notion';
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
    const dom: Element | null = (el && (el as any).$el) ? (el as any).$el as Element : (el as Element | null);
    if (dom instanceof HTMLElement) blockRefs.value[id] = dom;
};

// État du slash menu
const slashMenuSelectedIndex = ref(0);

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
    if (container && (container.tagName.toLowerCase() === 'ul' || container.tagName.toLowerCase() === 'ol')) {
        const items = Array.from(container.querySelectorAll('li')).map(li => (li.textContent || '').trim());
        editor.updateBlock(blockId, { content: items.join('\n') });
        return;
    }
    editor.updateBlock(blockId, { content: target.innerHTML });
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
        } else {
            el.innerHTML = newBlock.content || '';
        }
        el.focus();
        setCaretToEnd(el);
    });
};

const handleImageError = (blockId: string) => {
    editor.updateBlock(blockId, { content: '' });
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

// Drag and drop (placeholder impl)
const startDrag = (blockId: string) => {
    console.log('Start drag for block:', blockId);
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
        default: return '';
    }
};

// Synchroniser le DOM initial (listes -> <li>)
onMounted(() => {
    nextTick(() => {
        blocks.value.forEach(b => {
            const el = blockRefs.value[b.id];
            if (!el) return;
            if (b.type === 'bulletList' || b.type === 'numberedList') {
                const items = (b.content || '').split('\n').filter(Boolean);
                el.innerHTML = items.map(t => `<li>${t}</li>`).join('') || '<li></li>';
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
onUnmounted(() => { document.removeEventListener('selectionchange', handleSelectionChange); });

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
        editor.updateBlock(block.id, { type: 'paragraph', content: '' });
    } else {
        editor.updateBlock(block.id, { content: remaining.join('\n') });
    }
    const newBlock = editor.addBlock('paragraph', block.id);
    nextTick(() => {
        const p = blockRefs.value[newBlock.id];
        if (p) { p.focus(); setCaretToEnd(p); }
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
