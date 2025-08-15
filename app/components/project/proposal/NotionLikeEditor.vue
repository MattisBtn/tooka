<template>
    <div class="notion-editor w-full">
        <!-- Blocs de contenu -->
        <div class="space-y-1">
            <ProjectProposalNotionBlock v-for="block in blocks" :key="block.id" :block="block"
                :is-hovered="hoveredBlockId === block.id" :is-focused="focusedBlockId === block.id"
                :numbered-index="getNumberedIndex(block.id)" @hover="hoveredBlockId = $event"
                @show-add-menu="showAddMenuFunc" @set-block-ref="setBlockRef" @input="handleInput" @focus="focusBlock"
                @keydown="handleKeyDownCustom" @text-selection="handleTextSelection" />
        </div>

        <!-- Menu de formatage flottant -->
        <ProjectProposalNotionFormattingMenu :is-visible="formattingMenu.isVisible" :position="formattingMenu.position"
            :is-format-active="isFormatActive" @format="applyFormatting" />

        <!-- Menu slash -->
        <ProjectProposalNotionSlashMenu :is-visible="localShowSlashMenu" :position="localSlashMenuPosition"
            :block-types="blockTypes" @select="selectBlockTypeCustom" />

        <!-- Menu d'ajout -->
        <ProjectProposalNotionAddMenu :is-visible="showAddMenu" :block-types="blockTypes"
            @update:is-visible="showAddMenu = $event" @select="addBlockOfType" />
    </div>
</template>

<script setup lang="ts">
import type { BlockType } from '~/composables/proposals/useNotionLikeEditor'
import { useNotionLikeEditor } from '~/composables/proposals/useNotionLikeEditor'

interface Props {
    contentHtml?: string
    readonly?: boolean
}

interface Emits {
    (e: 'update:content_html', value: string): void
    (e: 'update:content_json', value: unknown[]): void
}

const _props = withDefaults(defineProps<Props>(), {
    contentHtml: '',
    readonly: false
})

const emit = defineEmits<Emits>()

// État local pour les hovers et menus
const hoveredBlockId = ref<string | null>(null)
const showAddMenu = ref(false)
const currentAddBlockId = ref<string | null>(null)

// Références des éléments de blocs
const blockRefs = ref<Map<string, HTMLElement>>(new Map())

const {
    blocks,
    focusedBlockId,
    formattingMenu,
    blockTypes,
    addBlock,
    updateContent,
    handleKeyDown,
    focusBlock,
    focusBlockElement,
    handleTextSelection,
    hideFormattingMenu,
    applyFormatting,
    isFormatActive,
    toHtml,
    toJson,
    getNumberedIndex
} = useNotionLikeEditor()

// Émettre les changements
watch(() => blocks.value, () => {
    emit('update:content_html', toHtml())
    emit('update:content_json', toJson() as unknown[])
}, { deep: true })

// Afficher le menu d'ajout
const showAddMenuFunc = (blockId: string, _event: MouseEvent) => {
    currentAddBlockId.value = blockId
    showAddMenu.value = true
}

// Ajouter un bloc d'un type spécifique
const addBlockOfType = (blockType: BlockType) => {
    if (currentAddBlockId.value) {
        const newBlock = addBlock(blockType.type, currentAddBlockId.value)
        showAddMenu.value = false

        nextTick(() => {
            focusBlockElement(newBlock.id)
        })
    }
}

// Gérer les références des blocs
const setBlockRef = (blockId: string, el: HTMLElement | null) => {
    if (el && el instanceof HTMLElement) {
        blockRefs.value.set(blockId, el)
    } else {
        blockRefs.value.delete(blockId)
    }
}

// Gérer l'input avec préservation du curseur
const handleInput = (event: Event, blockId: string) => {
    const target = event.target as HTMLElement
    const htmlContent = target.innerHTML

    // Sauvegarder la position du curseur AVANT la mise à jour
    const selection = window.getSelection()
    const range = selection?.getRangeAt(0)

    // Sauvegarder plus d'informations sur la position
    let cursorInfo = null
    if (range && target.contains(range.commonAncestorContainer)) {
        cursorInfo = {
            startContainer: range.startContainer,
            startOffset: range.startOffset,
            endContainer: range.endContainer,
            endOffset: range.endOffset,
            // Sauvegarder le texte avant le curseur pour référence
            textBeforeCursor: getTextBeforeCursor(target, range)
        }
    }

    // Mettre à jour le contenu HTML et texte
    updateContent(blockId, htmlContent, true)

    // Restaurer le curseur après le re-render
    nextTick(() => {
        const element = blockRefs.value.get(blockId)
        if (element && cursorInfo) {
            restoreCursorPosition(element, cursorInfo)
        }
    })
}

// Fonction pour obtenir le texte avant le curseur
const getTextBeforeCursor = (element: HTMLElement, range: Range): string => {
    const beforeRange = range.cloneRange()
    beforeRange.selectNodeContents(element)
    beforeRange.setEnd(range.startContainer, range.startOffset)
    return beforeRange.toString()
}

// Fonction améliorée pour restaurer la position du curseur
const restoreCursorPosition = (element: HTMLElement, cursorInfo: {
    startContainer: Node
    startOffset: number
    endContainer: Node
    endOffset: number
    textBeforeCursor: string
}) => {
    try {
        const newRange = document.createRange()
        const newSelection = window.getSelection()

        // Essayer de restaurer la position exacte d'abord
        if (cursorInfo.startContainer && cursorInfo.startContainer.parentNode &&
            element.contains(cursorInfo.startContainer)) {
            newRange.setStart(cursorInfo.startContainer, cursorInfo.startOffset)
            newRange.setEnd(cursorInfo.endContainer || cursorInfo.startContainer,
                cursorInfo.endOffset || cursorInfo.startOffset)
            newSelection?.removeAllRanges()
            newSelection?.addRange(newRange)
            return
        }

        // Fallback: chercher la position basée sur le texte avant le curseur
        const targetPosition = findPositionByTextBefore(element, cursorInfo.textBeforeCursor)
        if (targetPosition) {
            newRange.setStart(targetPosition.node, targetPosition.offset)
            newRange.setEnd(targetPosition.node, targetPosition.offset)
            newSelection?.removeAllRanges()
            newSelection?.addRange(newRange)
            return
        }

        // Fallback final: placer le curseur à la fin
        const range = document.createRange()
        const selection = window.getSelection()
        range.selectNodeContents(element)
        range.collapse(false)
        selection?.removeAllRanges()
        selection?.addRange(range)
    } catch {
        // Fallback final en cas d'erreur
        const range = document.createRange()
        const selection = window.getSelection()
        range.selectNodeContents(element)
        range.collapse(false)
        selection?.removeAllRanges()
        selection?.addRange(range)
    }
}

// Fonction pour trouver la position basée sur le texte avant le curseur
const findPositionByTextBefore = (element: HTMLElement, textBeforeCursor: string) => {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
    )

    let currentPosition = 0
    let node: Node | null

    while ((node = walker.nextNode())) {
        const nodeText = node.textContent || ""
        const nodeLength = nodeText.length

        // Si on trouve une correspondance dans ce nœud
        if (currentPosition + nodeLength >= textBeforeCursor.length) {
            const offsetInNode = textBeforeCursor.length - currentPosition
            if (offsetInNode >= 0 && offsetInNode <= nodeLength) {
                return { node, offset: offsetInNode }
            }
        }

        currentPosition += nodeLength
    }

    return null
}

// Gérer les événements clavier personnalisés
const handleKeyDownCustom = (event: KeyboardEvent, blockId: string) => {
    // Utiliser la logique du composable qui gère maintenant les positions
    const result = handleKeyDown(event, blockId)

    // Si le menu slash doit être affiché
    if (result && result.showSlashMenu) {
        showSlashMenuForBlock(result.blockId, result.element)
    }

    // Si le menu slash doit être fermé
    if (result && result.closeSlashMenu) {
        localShowSlashMenu.value = false
    }
}

// Variables réactives locales pour le menu slash
const localShowSlashMenu = ref(false)
const localSlashMenuPosition = ref({ x: 0, y: 0 })

// Fonction pour afficher le menu slash
const showSlashMenuForBlock = (blockId: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    localSlashMenuPosition.value = {
        x: rect.left,
        y: rect.bottom + 4,
    }
    currentSlashBlockId.value = blockId
    localShowSlashMenu.value = true
}

const currentSlashBlockId = ref<string | null>(null)

// Sélectionner un type de bloc depuis le menu slash
const selectBlockTypeCustom = (blockType: BlockType) => {
    if (currentSlashBlockId.value) {
        // Créer un nouveau bloc du type sélectionné après le bloc actuel
        const newBlock = addBlock(blockType.type, currentSlashBlockId.value)

        // Vider le contenu du bloc actuel (supprimer le "/" et les espaces)
        const currentBlock = blocks.value.find(b => b.id === currentSlashBlockId.value)
        if (currentBlock) {
            updateContent(currentSlashBlockId.value, '')
        }

        localShowSlashMenu.value = false

        nextTick(() => {
            // Si c'est un divider, créer un nouveau bloc texte après et le focus
            if (blockType.type === 'divider') {
                const textBlock = addBlock('text', newBlock.id)
                focusBlockElement(textBlock.id)
            } else {
                focusBlockElement(newBlock.id)
            }
        })
    }
}

// Auto-focus sur le premier bloc au montage
onMounted(() => {
    nextTick(() => {
        if (blocks.value.length > 0 && blocks.value[0]) {
            focusBlockElement(blocks.value[0].id)
        }
    })

    // Fermer le menu slash avec Échap
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && localShowSlashMenu.value) {
            localShowSlashMenu.value = false
        }
        if (event.key === 'Escape' && formattingMenu.value.isVisible) {
            hideFormattingMenu()
        }
    })

    // Fermer le menu slash quand on clique ailleurs
    document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement
        if (!target.closest('.notion-editor') && localShowSlashMenu.value) {
            localShowSlashMenu.value = false
        }
        if (!target.closest('.notion-editor') && formattingMenu.value.isVisible) {
            hideFormattingMenu()
        }
    })
})

onUnmounted(() => {
    // Cleanup sera fait automatiquement
})
</script>

<style scoped>
/* Placeholders */
.empty:empty:before {
    content: attr(data-placeholder);
    color: rgb(156 163 175);
    pointer-events: none;
}

.notion-editor [contenteditable]:focus {
    outline: none;
}
</style>
