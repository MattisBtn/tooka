import type { NotionBlock } from "./useNotionBlocks";

export const useNotionKeyboard = () => {
  // Vérifier si on peut ouvrir le menu slash à la position actuelle
  const canShowSlashMenu = (content: string, cursorPosition: number) => {
    // Toujours autorisé en début de ligne
    if (cursorPosition === 0) return true;

    // Vérifier s'il y a un espace avant le curseur
    if (cursorPosition > 0) {
      const charBeforeCursor = content.charAt(cursorPosition - 1);
      // Utiliser une comparaison plus robuste
      return charBeforeCursor.trim() === "" && charBeforeCursor.length > 0;
    }

    return false;
  };

  // Vérifier si on doit fermer le menu slash (deux espaces après le "/")
  const shouldCloseSlashMenu = (content: string, cursorPosition: number) => {
    // Chercher le "/" le plus récent avant le curseur
    const beforeCursor = content.substring(0, cursorPosition);
    const lastSlashIndex = beforeCursor.lastIndexOf("/");

    if (lastSlashIndex === -1) return false;

    // Vérifier s'il y a exactement deux espaces après le "/"
    const afterSlash = beforeCursor.substring(lastSlashIndex + 1);

    // Vérifier qu'il y a exactement 2 caractères et que ce sont des espaces
    return afterSlash.length === 2 && afterSlash.trim() === "";
  };

  // Obtenir la position du curseur dans un élément contenteditable
  const getCursorPosition = (element: HTMLElement) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;

    const range = selection.getRangeAt(0);

    // Vérifier si le range est dans l'élément
    if (element.contains(range.commonAncestorContainer)) {
      // Méthode plus simple et fiable
      const beforeRange = range.cloneRange();
      beforeRange.selectNodeContents(element);
      beforeRange.setEnd(range.endContainer, range.endOffset);
      return beforeRange.toString().length;
    }

    return 0;
  };

  // Gérer les raccourcis clavier
  const handleKeyDown = (
    event: KeyboardEvent,
    blockId: string,
    block: NotionBlock,
    callbacks: {
      addBlock: (type: NotionBlock["type"], afterId?: string) => NotionBlock;
      removeBlock: (id: string) => void;
      changeBlockType: (id: string, type: NotionBlock["type"]) => void;
      focusBlockElement: (blockId: string) => void;
    }
  ) => {
    // Enter = nouveau bloc
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      // Gestion spéciale pour les listes
      if (block.type === "bulleted-list" || block.type === "numbered-list") {
        if (block.content.trim() === "") {
          // Si la liste est vide, transformer en bloc texte
          callbacks.changeBlockType(blockId, "text");
          nextTick(() => {
            callbacks.focusBlockElement(blockId);
          });
        } else {
          // Si la liste a du contenu, créer un nouvel élément de liste
          const newBlock = callbacks.addBlock(block.type, blockId);
          nextTick(() => {
            callbacks.focusBlockElement(newBlock.id);
          });
        }
      } else if (block.type === "divider") {
        // Pour le divider, créer un nouveau bloc texte après
        const newBlock = callbacks.addBlock("text", blockId);
        nextTick(() => {
          callbacks.focusBlockElement(newBlock.id);
        });
      } else {
        // Pour les autres types de blocs, comportement normal
        const newBlock = callbacks.addBlock("text", blockId);
        nextTick(() => {
          callbacks.focusBlockElement(newBlock.id);
        });
      }
      return;
    }

    // Backspace sur bloc vide = supprimer
    if (
      event.key === "Backspace" &&
      (block.content === "" || block.type === "divider")
    ) {
      event.preventDefault();
      callbacks.removeBlock(blockId);
      return;
    }

    // "/" = ouvrir le menu slash si autorisé
    if (event.key === "/") {
      const target = event.target as HTMLElement;
      const cursorPosition = getCursorPosition(target);

      if (canShowSlashMenu(block.content, cursorPosition)) {
        return { showSlashMenu: true, blockId, element: target };
      }
    }

    // Espace = vérifier si on doit fermer le menu slash
    if (event.key === " ") {
      const target = event.target as HTMLElement;
      const cursorPosition = getCursorPosition(target);

      // Simuler le contenu après l'ajout de l'espace
      const contentAfterSpace = block.content + " ";
      const cursorPositionAfterSpace = cursorPosition + 1;

      // Vérifier si on a deux espaces consécutifs après le "/"
      if (shouldCloseSlashMenu(contentAfterSpace, cursorPositionAfterSpace)) {
        return { closeSlashMenu: true, blockId, element: target };
      }
    }

    // Retourner null si aucun traitement spécial n'est nécessaire
    return null;
  };

  return {
    canShowSlashMenu,
    shouldCloseSlashMenu,
    getCursorPosition,
    handleKeyDown,
  };
};
