import { useNotionBlocks } from "./useNotionBlocks";
import { useNotionFormatting } from "./useNotionFormatting";
import { useNotionKeyboard } from "./useNotionKeyboard";
import { useNotionUtils } from "./useNotionUtils";

export type { BlockType, NotionBlock } from "./useNotionBlocks";
export type { FormattingMenuState } from "./useNotionFormatting";

export const useNotionLikeEditor = () => {
  // Utiliser les composables spécialisés
  const blocks = useNotionBlocks();
  const formatting = useNotionFormatting();
  const keyboard = useNotionKeyboard();
  const utils = useNotionUtils();

  // Gérer les raccourcis clavier avec les callbacks appropriés
  const handleKeyDown = (event: KeyboardEvent, blockId: string) => {
    const block = blocks.blocks.value.find((b) => b.id === blockId);
    if (!block) return;

    return keyboard.handleKeyDown(event, blockId, block, {
      addBlock: blocks.addBlock,
      removeBlock: blocks.removeBlock,
      changeBlockType: blocks.changeBlockType,
      focusBlockElement: blocks.focusBlockElement,
    });
  };

  // Gérer la sélection de texte avec callback pour updateContent
  const handleTextSelection = (blockId: string, element: HTMLElement) => {
    formatting.handleTextSelection(blockId, element);
  };

  // Appliquer le formatage avec callback pour updateContent
  const applyFormatting = (
    format: "bold" | "italic" | "underline" | "strikethrough"
  ) => {
    formatting.applyFormatting(format, blocks.updateContent);
  };

  // Générer HTML et JSON avec les blocs actuels
  const toHtml = () => utils.toHtml(blocks.blocks.value);
  const toJson = () => utils.toJson(blocks.blocks.value);

  // Calculer l'index pour les listes numérotées
  const getNumberedIndex = (blockId: string) =>
    utils.getNumberedIndex(blockId, blocks.blocks.value);

  return {
    // État (exposé en lecture seule)
    blocks: blocks.blocks,
    focusedBlockId: blocks.focusedBlockId,
    formattingMenu: formatting.formattingMenu,
    blockTypes: blocks.blockTypes,

    // Méthodes de gestion des blocs
    addBlock: blocks.addBlock,
    removeBlock: blocks.removeBlock,
    updateContent: blocks.updateContent,
    changeBlockType: blocks.changeBlockType,
    focusBlock: blocks.focusBlock,
    focusBlockElement: blocks.focusBlockElement,
    moveBlock: blocks.moveBlock,

    // Méthodes de formatage
    handleTextSelection,
    hideFormattingMenu: formatting.hideFormattingMenu,
    applyFormatting,
    isFormatActive: formatting.isFormatActive,

    // Méthodes de clavier
    handleKeyDown,

    // Méthodes utilitaires
    toHtml,
    toJson,
    getNumberedIndex,
  };
};
